import { Injectable, OnModuleInit } from '@nestjs/common';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus } from '../enum/order-status';
import Order from '../orders/entities/order.entity';
import { Throttle } from '@nestjs/throttler';

@Injectable()
export class GoogleSheetService implements OnModuleInit {
  private sheets;
  private auth: JWT;
  private spreadsheetId: string;
  private readonly sheetName = 'Orders';
  private readonly STATUS_COLUMN = 'F';
  private lastKnownStatuses: Map<string, OrderStatus> = new Map();
  private readonly POLLING_INTERVAL = 10000; // 10 seconds
  private readonly BATCH_SIZE = 100;
  private readonly MAX_RETRIES = 3;
  private isProcessing = false;

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2
  ) {
    this.auth = new JWT({
      email: this.configService.get('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
      key: this.configService.get('GOOGLE_PRIVATE_KEY').replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.spreadsheetId = this.configService.get('GOOGLE_SHEET_ID');
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  async onModuleInit() {
    try {
      await this.initializeWithRetry();
    } catch (error) {
      console.error('Failed to initialize Google Sheet service:', error);
    }
  }

  private async initializeWithRetry(retryCount = 0) {
    try {
      await this.createSheetIfNotExists();
      await this.initializeSheet();
      await this.initializeStatusTracking();
      await this.protectNonStatusColumns();
      await this.setupSheetWatcher();
    } catch (error) {
      if (retryCount < this.MAX_RETRIES) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.initializeWithRetry(retryCount + 1);
      }
      throw error;
    }
  }

  private async createSheetIfNotExists() {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const sheet = response.data.sheets.find(
        (s) => s.properties.title === this.sheetName
      );

      if (!sheet) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: [{
              addSheet: {
                properties: {
                  title: this.sheetName,
                  gridProperties: {
                    frozenRowCount: 1 // Freeze header row
                  }
                }
              }
            }]
          }
        });
      }
    } catch (error) {
      console.error('Failed to check/create sheet:', error);
      throw error;
    }
  }

  private async initializeSheet() {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      const sheet = response.data.sheets.find(
        (s) => s.properties.title === this.sheetName
      );
      const sheetId = sheet.properties.sheetId;

      // Set up data validation for status column
      const requests = [
        {
          setDataValidation: {
            range: {
              sheetId: sheetId,
              startRowIndex: 1,
              endRowIndex: 1000,
              startColumnIndex: 5, // Status column (F)
              endColumnIndex: 6,
            },
            rule: {
              condition: {
                type: 'ONE_OF_LIST',
                values: Object.values(OrderStatus).map(status => ({ userEnteredValue: status })),
              },
              strict: true,
              showCustomUi: true,
            },
          },
        },
        {
          updateSheetProperties: {
            properties: {
              sheetId: sheetId,
              gridProperties: {
                frozenRowCount: 1
              }
            },
            fields: 'gridProperties.frozenRowCount'
          }
        }
      ];

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: { requests },
      });

      // Set up headers with formatting
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A1:H1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'ID đơn hàng',
            'Người nhận hàng',
            'Số điện thoại người nhận',
            'Tổng tiền đơn hàng',
            'Địa chỉ nhận hàng',
            'Trạng thái',
            'Ngày tạo',
            'Ngày cập nhật',
          ]],
        },
      });

      // Apply header formatting
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [{
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                  textFormat: { bold: true },
                  horizontalAlignment: 'CENTER',
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
            }
          }]
        }
      });
    } catch (error) {
      console.error('Failed to initialize sheet:', error);
      throw error;
    }
  }

  private async initializeStatusTracking() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:F`,
        majorDimension: 'ROWS'
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) return;

      for (let i = 1; i < rows.length; i++) {
        const [orderId, , , , , status] = rows[i];
        if (orderId && status) {
          this.lastKnownStatuses.set(orderId.toString(), status as OrderStatus);
        }
      }
    } catch (error) {
      console.error('Failed to initialize status tracking:', error);
    }
  }

  private async setupSheetWatcher() {
    setInterval(async () => {
      if (!this.isProcessing) {
        await this.checkForStatusUpdates();
      }
    }, this.POLLING_INTERVAL);
  }

  @Throttle({default: {limit: 100, ttl: 60}}) // 100 requests per minute
  async syncOrderToSheet(order: Order) {
    try {
      const values = [[
        order.id?.toString() ?? '',
        order.snapshot_receiver_name ?? '',
        order.snapshot_phone_number ?? '',
        order.total_amount?.toString() ?? '',
        order.snapshot_full_address ?? '',
        order.status ?? '',
        order.createdAt?.toISOString() ?? '',
        order.updateAt?.toISOString() ?? ''
      ]];

      // First check if order exists using binary search
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:A`,
        majorDimension: 'COLUMNS'
      });

      const orderIds = response.data.values?.[0] || [];
      const orderIndex = this.binarySearch(orderIds, order.id.toString());

      if (orderIndex === -1) {
        // Order doesn't exist, append it
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A:H`,
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          requestBody: { values },
        });
      } else {
        // Order exists, update it
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A${orderIndex}:H${orderIndex}`,
          valueInputOption: 'RAW',
          requestBody: { values },
        });
      }
    } catch (error) {
      console.error('Failed to sync order to sheet:', error);
      throw error;
    }
  }

  private binarySearch(arr: string[], target: string): number {
    let left = 0;
    let right = arr.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (arr[mid] === target) {
        return mid + 1; // Add 1 because sheet rows are 1-based
      }
      if (arr[mid] < target) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    return -1;
  }

  private async checkForStatusUpdates() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:F`,
        majorDimension: 'ROWS'
      });

      const rows = response.data.values;
      if (!rows || rows.length <= 1) return;

      // Process in batches
      for (let i = 0; i < rows.length; i += this.BATCH_SIZE) {
        const batch = rows.slice(i, i + this.BATCH_SIZE);
        await this.processBatch(batch);
      }
    } catch (error) {
      console.error('Failed to check for status updates:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processBatch(rows: any[]) {
    for (let i = 1; i < rows.length; i++) {
      const [orderId, , , , , currentStatus] = rows[i];
      
      if (orderId && currentStatus) {
        const lastStatus = this.lastKnownStatuses.get(orderId.toString());
        
        if (lastStatus !== currentStatus && 
            Object.values(OrderStatus).includes(currentStatus as OrderStatus)) {
          this.eventEmitter.emit('order.status.changed', {
            orderId: Number(orderId),
            newStatus: currentStatus as OrderStatus,
            previousStatus: lastStatus
          });
          
          this.lastKnownStatuses.set(orderId.toString(), currentStatus as OrderStatus);
        }
      }
    }
  }

  async protectNonStatusColumns() {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      const sheet = response.data.sheets.find(
        (s) => s.properties.title === this.sheetName
      );
      const sheetId = sheet.properties.sheetId;

      // Protect all columns except status
      const requests = [
        {
          addProtectedRange: {
            protectedRange: {
              range: {
                sheetId: sheetId,
                startRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 5, // Protect columns A-E
              },
              warningOnly: false,
              editors: {
                users: [this.configService.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')]
              },
              description: 'Protected columns (non-status)'
            },
          },
        },
        {
          addProtectedRange: {
            protectedRange: {
              range: {
                sheetId: sheetId,
                startRowIndex: 1,
                startColumnIndex: 6, // Protect columns G-H
                endColumnIndex: 8,
              },
              warningOnly: false,
              editors: {
                users: [this.configService.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')]
              },
              description: 'Protected columns (non-status)'
            },
          },
        },
        {
          addProtectedRange: {
            protectedRange: {
              range: {
                sheetId: sheetId,
                startRowIndex: 0,
                endRowIndex: 1, // Protect header row
                startColumnIndex: 0,
                endColumnIndex: 8,
              },
              warningOnly: false,
              editors: {
                users: [this.configService.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')]
              },
              description: 'Protected header row'
            },
          },
        }
      ];

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: { requests },
      });
    } catch (error) {
      console.error('Failed to protect columns:', error);
      throw error;
    }
  }
}
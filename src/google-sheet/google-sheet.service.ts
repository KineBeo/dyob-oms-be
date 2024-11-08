import { Injectable, OnModuleInit } from '@nestjs/common';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus } from '../enum/order-status';
import Order from '../orders/entities/order.entity';

@Injectable()
export class GoogleSheetService implements OnModuleInit {
  private sheets;
  private auth: JWT;
  private spreadsheetId: string;
  private readonly sheetName = 'Orders';
  private readonly STATUS_COLUMN = 'F'; // Column for status
  private lastKnownStatuses: Map<string, OrderStatus> = new Map();

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
      // Ensure the sheet exists first
      await this.createSheetIfNotExists();
      await this.initializeSheet();
      await this.initializeStatusTracking();
      await this.setupSheetWatcher();
    } catch (error) {
      console.error('Failed to initialize Google Sheet service:', error);
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
                  title: this.sheetName
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
      // Get the sheet ID
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      const sheet = response.data.sheets.find(
        (s) => s.properties.title === this.sheetName
      );
      const sheetId = sheet.properties.sheetId;

      // Set up data validation for status column
      const requests = [{
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
      }];

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: { requests },
      });

      // Set up headers
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A1:H1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'ID đơn hàng',
            'Người nhận hàng',
            'Đơn hàng từ người dùng với ID',
            'Tổng tiền đơn hàng',
            'Địa chỉ nhận hàng',
            'Trạng thái',
            'Ngày tạo',
            'Ngày cập nhật',
          ]],
        },
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
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) return; // Only headers or empty

      // Start from index 1 to skip headers
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
    // Poll for changes every 30 seconds
    setInterval(async () => {
      await this.checkForStatusUpdates();
    }, 5000);
  }

  async syncOrderToSheet(order: Order) {
    try {
      // First, check if the order already exists in the sheet
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:A`,
      });

      const rows = response.data.values || [];
      const orderIndex = rows.findIndex(row => row[0] === order.id.toString());

      const values = [[
        order.id?.toString() ?? '',
        order.user?.fullname?.toString() ?? '',
        order.userStatus?.user?.fullname?.toString() ?? '',
        order.total_amount?.toString() ?? '',
        order.snapshot_full_address ?? '',
        order.status ?? '',
        order.createdAt?.toISOString() ?? '',
        order.updateAt?.toISOString() ?? ''
      ]];

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
          range: `${this.sheetName}!A${orderIndex + 1}:H${orderIndex + 1}`,
          valueInputOption: 'RAW',
          requestBody: { values },
        });
      }
    } catch (error) {
      console.error('Failed to sync order to sheet:', error);
      throw error;
    }
  }

  private async checkForStatusUpdates() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:F`,
      });

      const rows = response.data.values;
      if (!rows || rows.length <= 1) return;

      for (let i = 1; i < rows.length; i++) {
        const [orderId, , , , , currentStatus] = rows[i];
        
        if (orderId && currentStatus) {
          const lastStatus = this.lastKnownStatuses.get(orderId.toString());
          
          // Only emit if status has changed
          if (lastStatus !== currentStatus && 
              Object.values(OrderStatus).includes(currentStatus as OrderStatus)) {
            // console.log(`Status changed for order ${orderId}: ${lastStatus} -> ${currentStatus}`);
            
            this.eventEmitter.emit('order.status.changed', {
              orderId: Number(orderId),
              newStatus: currentStatus as OrderStatus,
              previousStatus: lastStatus
            });
            
            // Update the tracked status
            this.lastKnownStatuses.set(orderId.toString(), currentStatus as OrderStatus);
          }
        }
      }
    } catch (error) {
      console.error('Failed to check for status updates:', error);
    }
  }

  async protectNonStatusColumns() {
    try {
      // Get the sheet ID first
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      const sheet = response.data.sheets.find(
        (s) => s.properties.title === this.sheetName
      );
      const sheetId = sheet.properties.sheetId;

      const requests = [{
        addProtectedRange: {
          protectedRange: {
            range: {
              sheetId: sheetId,
              startRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: 5,
            },
            warningOnly: false,
            editors: {
              users: [this.configService.get('ADMIN_EMAIL')],
            },
          },
        },
      }];

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
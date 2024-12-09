import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000', // Chỉ cho phép frontend tại đây truy cập
    methods: ['GET', 'POST'], // Phương thức được phép
  },
})
export class SocketGateway {
  @WebSocketServer()
  server: Server;

  sendToUser(userId: string, data: any) {
    this.server.to(userId).emit('notification', data);
  }
}

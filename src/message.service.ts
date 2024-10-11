/* eslint-disable prettier/prettier */
import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';

@Injectable()
export class MessageService implements OnModuleInit {
  client: ClientProxy;

  onModuleInit() {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RMQURL],
        queue: 'request_queueV2',
        queueOptions: {
          durable: true,
          autoDelete: false,
        },
      },
    });
  }

  sendMessage(message: any) {
    return this.client.emit('request_submitted', message);
  }
}

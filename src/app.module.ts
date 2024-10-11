import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Record,
  RecordSchema,
} from './records/schemas/record.schema/record.schema';
import { MessageService } from './message.service';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URL'),
      }),
    }),
    MongooseModule.forFeature([{ name: Record.name, schema: RecordSchema }]),
    RabbitMQModule.forRoot(RabbitMQModule, {
      uri: process.env.RMQURL,
      exchanges: [
        {
          name: 'ccp1',
          type: 'topic',
        },
      ],
      enableControllerDiscovery: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, Record, MessageService],
})
export class AppModule {}

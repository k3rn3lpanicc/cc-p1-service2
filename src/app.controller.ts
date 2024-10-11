import { Body, Controller, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { MessageService } from './message.service';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { STATE } from './records/enums/state.enum';

@Controller()
export class AppController {
  constructor(
    private readonly configService: ConfigService,
    private readonly appService: AppService,
    private readonly messageService: MessageService,
  ) {}

  @RabbitSubscribe({
    exchange: 'ccp1',
    routingKey: 'request_submitted',
  })
  public async handleRequestSubmitted(msg: { id: string; imageURL: string }) {
    console.log('Received message:', msg);
    const reqStatus = await this.appService.getRequestStatus(msg.id);
    if (reqStatus.result.state !== STATE.CREATED) {
      throw new Error('Request already processed');
    }
    await this.appService.updateState(msg.id, STATE.PENDING);
    let caption: string;
    try {
      caption = await this.appService.getCaption(msg.imageURL);
      this.appService.setCaption(msg.id, caption);
      this.appService.updateState(msg.id, STATE.READY);
    } catch (ex: any) {
      await this.appService.updateState(msg.id, STATE.FAILED);
    }
    console.log({ caption });
    // Process the message here
  }

  @Post('/state')
  async getStateOfRequest(@Body('id') requestId: string) {
    return await this.appService.getRequestStatus(requestId);
  }
}

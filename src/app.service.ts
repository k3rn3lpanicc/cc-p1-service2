import { Injectable } from '@nestjs/common';
import {
  Record,
  RecordDocument,
} from './records/schemas/record.schema/record.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateRecordDto } from './records/dtos/create.record.dto';
import { STATE } from './records/enums/state.enum';
import axios from 'axios';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Record.name) private recordModel: Model<RecordDocument>,
  ) {}
  checkHealth(): string {
    return 'Service is running';
  }

  async handleUserRequest(email: string, imageUrl: string) {
    const record: CreateRecordDto = {
      email,
      imageUrl,
      resultUrl: '',
      state: STATE.CREATED,
      imageCaption: '',
    };
    const createdRecord = new this.recordModel(record);
    return createdRecord.save();
  }

  async getRequestStatus(requestId: string) {
    const req = await this.recordModel.findOne({ _id: requestId });
    return {
      result: {
        url: req.imageUrl,
        requestId: req._id,
        state: req.state,
        caption: req.imageCaption,
      },
    };
  }

  async updateState(requestId: string, state: string) {
    const req = await this.recordModel.findOne({ _id: requestId });
    req.state = state;
    return req.save();
  }

  async setCaption(requestId: string, caption: string) {
    const req = await this.recordModel.findOne({ _id: requestId });
    req.imageCaption = caption;
    return req.save();
  }

  async getCaption(imageURL: string) {
    try {
      const API_URL =
        'https://api-inference.huggingface.co/models/nlpconnect/vit-gpt2-image-captioning';
      const headers = {
        Authorization: `Bearer ${process.env.HUGAPIKEY}`,
      };
      const imageResponse = await axios.get(imageURL, {
        responseType: 'arraybuffer',
      });
      const imageBuffer = Buffer.from(imageResponse.data, 'binary');
      const response = await axios.post(API_URL, imageBuffer, {
        headers: {
          ...headers,
          'Content-Type': 'application/octet-stream',
        },
      });

      return response.data[0].generated_text;
    } catch (error) {
      console.error('Error:', error.message);
      throw error;
    }
  }
}

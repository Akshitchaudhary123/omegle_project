

import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  private getTemplate(templateName: string, context: any): string {
    const filePath = path.join(__dirname, 'templates', `${templateName}.hbs`);
    const source = fs.readFileSync(filePath, 'utf8');
    const compiled = handlebars.compile(source);
    return compiled(context);
  }

  async sendMail(to: string, subject: string, html: string) {
    const from = this.configService.get<string>('FROM_EMAIL');
    try {
      const info = await this.transporter.sendMail({ from, to, subject, html });
      this.logger.log(`✅ Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error(`❌ Email send failed: ${error.message}`);
      throw error;
    }
  }

  async sendOtpEmail(to: string, otp: string) {
    const html = this.getTemplate('otp', { otp });
    return this.sendMail(to, 'Your OTP Code', html);
  }
}

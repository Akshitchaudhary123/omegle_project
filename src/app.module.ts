import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';

import { RoomService } from './room/room.service';
import { RoomController } from './room/room.controller';
import { RoomModule } from './room/room.module';
import { ChatModule } from './chat/chat.module';
import { MessageModule } from './message/message.module';



@Module({

  controllers: [AppController, RoomController],
  providers: [AppService, RoomService],
  imports: [
    MailModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,

      envFilePath: process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev',


    }),
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DB_URL'),
        onConnectionCreate: (connection: Connection) => {
          connection.on('connected', () => {
            console.log('\n🟢 MongoDB Connection Status: CONNECTED');
            console.log(`📍 Database: ${connection.name}`);
            console.log(`🔗 Host: ${connection.host}:${connection.port}\n`);
          });

          connection.on('error', (err) => {
            console.log('🔴 MongoDB Connection Error:', err.message);
          });

          return connection;
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    RoomModule,
    MessageModule,
    ChatModule
  ],
})
export class AppModule { }

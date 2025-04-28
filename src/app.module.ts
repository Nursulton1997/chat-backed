import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { JwtStrategy } from 'src/strategy/jwt.strategy';
import { renderController } from './app.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OperatorMessageHendler } from './message-hendler/operator-message-handler';
import { PrismaService } from './prisma/prisma.service';
import { ClientMessageHendler } from './message-hendler/client-message-handler';
import { AppService } from './app.service';
import { OperatorModule } from './operator/operator.module';
import { MessageHendlerModule } from './message-hendler/message-hendler.module';
import { SocketGateway } from './app.gateway';
import { TelegramBotService } from './telegram-bot/telegram-bot.service';
import { CallbackQueryHandler } from './telegram-bot/hendlers/callback-query-hendler';
import { MessageTextHandler } from './telegram-bot/hendlers/messae-text-hendler';
import { DinamicButton } from './telegram-bot/menu/dinamic-menu';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { StatusTypes } from './dto/types';
import { OperatorService } from './operator/operator.service';
import { OperatorController } from './operator/operator.controller';
import { EditMessage } from './message-hendler/editmessage-handler';
import { DeleteMessage } from './message-hendler/delete-message-hendler';
import { TicketHelper } from './message-hendler/ticket-notification';
import * as dotenv from 'dotenv';
import { ReportModule } from './report/report.module';
import { TasksService } from './message-hendler/auto-answer';
import { MyHttpModule } from './http/http.module';
import {join} from "path";
import {ServeStaticModule} from "@nestjs/serve-static";

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'files'),
    }),
    PrismaModule,
    MyHttpModule,
    JwtModule.register({
      global: true,
      secret: dotenv.config().parsed.JWT_SECRET,
      signOptions: { expiresIn: '12h' },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MessageHendlerModule,
    ReportModule
  ],
  providers: [
    JwtStrategy,
    AppService,
    SocketGateway,
    OperatorMessageHendler,
    EditMessage,
    TasksService,
    ClientMessageHendler,
    DinamicButton,
    MessageTextHandler,
    DeleteMessage,
    TicketHelper,
    CallbackQueryHandler,
    OperatorService,
    TelegramBotService,
    AuthService,
  ],
  controllers: [
    renderController,
    OperatorController,
    AuthController,
  ],
  exports: [AppService]
})
export class AppModule {
  constructor(private prisma: PrismaService) {

  }

  private async statusCrone() {
    let tickets = await this.prisma.tickets.findMany();
    tickets.forEach(async (el) => {
      let now = new Date().getTime();
      let ticket_updatedAt = new Date(el.updated_at).getTime();

      if ( el.status == StatusTypes.ANSWERED && now - ticket_updatedAt > 259200000 ) {
          await this.prisma.tickets.update({
            where: { id: el.id },
            data: { status: StatusTypes.NOACTIVE },
          });
      } else if (el.status == StatusTypes.AWAITING && now - ticket_updatedAt > 10800000 ) {
          await this.prisma.tickets.update({
            where: { id: el.id },
            data: { status: StatusTypes.EXPIRED },
          });
      } else if( el.status == StatusTypes.NOACTIVE && now - ticket_updatedAt > 259200000 ) {
          await this.prisma.tickets.update({
            where: { id: el.id },
            data: { status: StatusTypes.CLOSED },
          });
      }
    });
  }
}

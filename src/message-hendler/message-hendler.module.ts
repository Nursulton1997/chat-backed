import { forwardRef, Module } from '@nestjs/common';
import { ClientMessageHendler } from './client-message-handler';
import { OperatorMessageHendler } from './operator-message-handler';
import { TicketHelper } from './ticket-notification';
import { ScheduleModule } from '@nestjs/schedule';
import { AppService } from 'src/app.service';
import { AppModule } from 'src/app.module';

@Module({
    imports: [
        ScheduleModule.forRoot()
    ],
    providers: [ClientMessageHendler, OperatorMessageHendler, TicketHelper]
})
export class MessageHendlerModule {}



import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestExceptionResponse, GetTicektsResponse, MyticketResponse, OpenTicketResponse, closeTicketResponse } from './responses/AppServiceResponse';
import { Message, SendFileDto, closeTicketDto, openTicketDto } from './dto/openTicketDto';
import { ConfigService } from '@nestjs/config';
import { ContentType, EmitTypes, StatusColors, StatusTypes, audioTypes, documentTypes, imageTypes, videoTypes } from './dto/types';
import { ClientRequest } from './dto/clientModel';
import { MyTicketModel } from './responses/TicketsModel';
import { TicketIdDto } from './operator/dto';
import { SendMessageResponse } from './message-hendler/emitsmodel/sendmessage-response';
import { SocketGateway } from './app.gateway';
import { UserModel } from './operator/responses';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { extname } from 'path';
import { already_ticket_error, conternt_types, defaultMessages, file_type_error, message_notfound, ticket_opened_error, user_blocked } from './dictonary';
import { PrismaNestService } from './prisma/nestjs.prisma.service';
import { botSendFile, botSendMesssage } from './telegram-bot/hendlers/botsender';
import { EventType } from './telegram-bot/hendlers/dto/actionModel';
import { TicketHelper } from './message-hendler/ticket-notification';
import { Helper } from './helper/helper';
import { TasksService } from './message-hendler/auto-answer';
import { creteThreads } from './message-hendler/opanai';
import { MyHttpService } from './http/http.service';
const FormData = require('form-data');

@Injectable()
export class AppService {

    constructor(
        private socket: SocketGateway,
        public prisma: PrismaService,
        public config: ConfigService,
        private ticketHelper: TicketHelper,
    ) { }

    async getTicketsList(client: ClientRequest, lang = 'uz', is_bot: boolean = false): Promise<Array<GetTicektsResponse>> {
        let user = await this.prisma.users.findUnique({ where: { chat_id: client.uuid } })

        let tickets = await this.prisma.tickets.findMany({
            where: {
                AND: {
                    user_id: user?.id == undefined ? 0 : user.id,
                    status: { notIn: [StatusTypes.CLOSED] },
                    deleted: false
                }
            }
        })

        let category_ids = tickets.map(el => el.category_id)
        let categories = await this.prisma.categories.findMany({
            where: {
                id: { notIn: category_ids },
                status: 'ACTIVE'
            }
        })

        return categories.map((el): GetTicektsResponse => {
            return {
                id: el.id,
                name: el.name[lang]
            }
        })
    }

    async getMyTickets(user: ClientRequest, lang = 'uz'): Promise<MyticketResponse | BadRequestException> {
        let date = new Date()

        // let message = {
        //     uz: "Hurmatli mijoz, 1216 aloqa markaziga murojaat qilishingiz mumkin, dushanba-juma kunlari soat 09:00 dan 18:00 gacha.", 
        //     ru: "Уважаемый клиент, вы можете связаться с контакт-центром 1216 с понедельника по пятницу с 09:00 до 18:00.",
        //     en: "Dear customer, you can contact the 1216 contact center, Monday-Friday from 09:00 to 18:00."
        // }
        // throw new BadRequestException({
        //     data: {},
        //     action: {},
        //     message: {
        //         error_text: message[lang],
        //         error_code: 10175, 
        //         error_type: 0
        //     }
        // })

        // if(((date.getDay() == 0 || date.getDay() == 6) || (date.getHours() >= 18 || date.getHours() < 9)) && user.uuid != '3294dfb8-d1e0-467d-88c7-76c88cd787b1') {
        // }

        let client = await this.prisma.users.findFirst({
            where: { chat_id: user.uuid },
            select: {
                tickets: {
                    where: {
                        deleted: false
                    },
                    orderBy: { updated_at: 'desc' },
                    select: {
                        id: true,
                        categories: true,
                        updated_at: true,
                        status: true,
                        request_close: true,
                        messages: {
                            orderBy: { created_at: 'desc' }
                        }
                    }
                },
                id: true, chat_id: true
            }
        })
        let tickets = await this.getTicketsList(user, lang)
        let result: Array<MyTicketModel> = []
        if (!client) return {
            isDisabled: tickets.length ? false : true,
            tickets: []
        }

        client.tickets.forEach(ticket => {
            let last_message: string = !['text', "reply_text"].includes(ticket.messages[0].content_type) ? conternt_types[ticket.messages[0].content_type][lang] : Object(ticket.messages[0].message).content || ""
            result.push({
                id: ticket.id,
                categoty_name: ticket.categories.name[lang],
                formatted_date: Helper.formatByMonthName(ticket.updated_at, lang),
                last_message: last_message,
                status: ticket.status,
                request_close: ticket.request_close,
                color: StatusColors[ticket.status]
            })
        })

        return {
            isDisabled: tickets.length ? false : true,
            tickets: result
        }
    }

    async closeTicket(body: closeTicketDto, user: ClientRequest, lang = 'uz'): Promise<closeTicketResponse> {
        await this.prisma.tickets.update({
            where: {
                id: body.ticket_id
            },
            data: {
                status: StatusTypes.CLOSED,
                rate: body.rate,
                request_close: false
            }
        })

        return {
            result: true,
            message: 'success'
        }
    }

    async getChatsByTicketId(user: ClientRequest, lang): Promise<Array<SendMessageResponse | null>> {
        let userData = await this.prisma.users.findFirst({
            where:{
                chat_id:user.uuid
            },
            include:{
                tickets:true
            }
        })

        let ticket = userData.tickets.at(-1)
        let param = {
            id: ticket.id
        }

        let messages = await this.prisma.messages.findMany({
            where: { ticket_id: Number(param.id), deleted: false },
            select: {
                tickets: true,
                id: true,
                message: true,
                created_at: true,
                is_answer: true,
                user: true,
                operator: true,
                content_type: true,
                is_ready: true
            },
            orderBy: { created_at: 'asc' }
        })
        if (!messages.length) return []
        if (messages[0]?.user?.chat_id != user.uuid) throw new HttpException('Access denied', 403)
        let messagesData: Array<SendMessageResponse> = []
        messages.forEach(message => {
            let sendmessage: Message = {
                content: Object(message.message).content,
            }
            if (message.content_type == ContentType.REPLYTEXT) {
                let replyMessage = messages.find(mes => mes.id == Object(message.message).reply_message_id)
                sendmessage.reply_content = { content: Object(replyMessage.message).content, content_type: replyMessage.content_type, author: message.user.name }
                sendmessage.reply_message_id = replyMessage.id
            }

            messagesData.push({
                id: Number(message.id),
                message: sendmessage,
                formatted_time: message.created_at.toLocaleTimeString(),
                date: message.created_at,
                base_url: this.config.get('FILES_BASE_URL'),
                is_answer: Number(message.is_answer),
                author: message.is_answer == 0 ? message.user.name : message.operator.first_name,
                content_type: message.content_type,
                is_ready: message.is_ready
            })
        })
        await this.prisma.users.update({ where: { chat_id: user.uuid }, data: { switch_ticket_id: Number(param.id) } })
        return messagesData
    }

    async openTicket(data: openTicketDto, client: ClientRequest, lang): Promise<OpenTicketResponse | BadRequestExceptionResponse> {
        
        const { category_id, message, bot_message_id, content_type } = data
        let categories = await this.getTicketsList(client, lang)
        let category = categories.find(category => category.id == category_id)
        
        if (!category) throw new BadRequestException(already_ticket_error[lang])
        let content_lang: string = lang
        let thread_id: string

    

        let newMessage: Message | any = {
            content: message
        }

        let user = await this.prisma.users.findUnique({
            where: { chat_id: client.uuid },
            select: { id: true, chat_id: true, name: true, is_block: true, updated_at: true, phone_number: true, is_online: true, messages: true }
        })

        if (!user?.chat_id) {
            let newUserData = await this.getUserData(client.uuid)
            let newuser = await this.prisma.users.create({
                data: {
                    name: (newUserData?.firstname ? `${newUserData?.firstname} ${newUserData?.lastname} ${newUserData?.surname}` : newUserData?.phone),
                    chat_id: client.uuid,
                    last_message: message,
                    photo: newUserData?.photo ? `${newUserData.photo}` : "",
                    phone_number: client.phone,
                    lang: lang
                },
                select: { id: true, chat_id: true, name: true, is_block: true, updated_at: true, phone_number: true, is_online: true, messages: true }
            })
            let newTicket = await this.prisma.tickets.create({
                data: {
                    category_id: Number(category_id),
                    user_id: newuser.id,
                    status: StatusTypes.ACTIVE,
                    lang: content_lang,
                    last_request_user: thread_id
                }
            })

            await this.prisma.messages.create({ data: { user_id: newuser.id, is_answer: 0, content_type: content_type ? content_type : ContentType.TEXT, ticket_id: newTicket.id, message: newMessage, bot_id: bot_message_id } })

            let usersData: UserModel = {
                id: newuser.id,
                chat_id: newuser.chat_id,
                name: newuser.name,
                is_block: newuser.is_block,
                date: newuser.updated_at.toLocaleString(),
                phone: newuser.phone_number,
                is_online: newuser.is_online,
                last_message: newMessage,
                push: 1
            }

            this.socket.server.emit(EmitTypes.NOTIFICATION, usersData)

            return { result: StatusTypes.SUCCESS, data: { id: newTicket.id, name: category.name } }
        }

        let newTicket = await this.prisma.tickets.create({
            data: {
                category_id: Number(category_id),
                user_id: user.id,
                status: StatusTypes.ACTIVE,
                lang: content_lang,
                last_request_user: thread_id
            }
        })

        await this.prisma.messages.create({ data: { user_id: user.id, is_answer: 0, content_type: content_type ? content_type : ContentType.TEXT, ticket_id: newTicket.id, message: newMessage, bot_id: bot_message_id } })

        user = await this.prisma.users.findUnique({
            where: { chat_id: client.uuid },
            select: { id: true, chat_id: true, name: true, is_block: true, updated_at: true, phone_number: true, is_online: true, messages: true }
        })

        let usersData: UserModel = {
            id: user.id,
            chat_id: user.chat_id,
            name: user.name,
            is_block: user.is_block,
            date: user.updated_at.toLocaleString(),
            phone: user.phone_number,
            is_online: user.is_online,
            last_message: user.messages[0]?.message || { content: "" },
            push: user.messages.filter(msg => msg.is_ready === false && msg.is_answer == 0)?.length + 1
        }

        this.socket.server.emit(EmitTypes.NOTIFICATION, usersData)
        return { result: StatusTypes.SUCCESS, data: { id: newTicket.id, name: category.name } }
    }

    async upload(file: Express.Multer.File, data: SendFileDto, client, lang): Promise<any> {
        const { reply_message_id } = data
        let userdata = await this.prisma.users.findFirst({
            where:{
                chat_id:client.uuid
            },
            include:{
                tickets:true
            }
        })

        let ticket_id = userdata.tickets.at(-1)
        let date = new Date()
        let ext_name = extname(file?.originalname)
        let random_id = 100000 + Math.random() * 900000 | 0
        let filename = random_id + ext_name
        let is_answer: number
        let socket_ids: Array<string> = []

        let ticket = await this.prisma.tickets.findFirst({
            where: {
                id: Number(ticket_id)
            }
        })

        if (ticket?.operator_id != null && client?.user_id && ticket?.operator_id != client.user_id) {
            this.socket.server.to(client.id).emit(EmitTypes.EXCEOPTION, { status: 403, error: 'Bad Request', message: ticket_opened_error['en'] });
        }

        let path = `${date.toLocaleDateString().split('.').join('_')}/${date.toLocaleTimeString('ru-RU', { hour: "numeric"})}/`
        let usersData: UserModel
        if (!client?.uuid) {
            let operator = await this.prisma.operators.findUnique({ where: { id: client.user_id } })
            let user = await this.prisma.users.findUnique({ where: { id: operator.user_id }, select: { id: true, chat_id: true, name: true, is_block: true, updated_at: true, phone_number: true, is_online: true, messages: true, socket_id: true } })
            is_answer = 1
            socket_ids.push(operator.socket_id, user.socket_id)
            client.uuid = user.chat_id
            usersData = {
                id: user.id,
                chat_id: user.chat_id,
                name: user.name,
                is_block: user.is_block,
                date: user.updated_at.toLocaleString(),
                phone: user.phone_number,
                is_online: user.is_online,
                last_message: user.messages[0]?.message || { content: "" },
                push: user.messages.filter(msg => msg.is_ready === false && msg.is_answer == 0).length
            }
        } else {
            let user = await this.prisma.users.findUnique({ where: { chat_id: client.uuid }, select: { id: true, chat_id: true, name: true, is_block: true, updated_at: true, phone_number: true, is_online: true, messages: true, socket_id: true }, })
            is_answer = 0
            let operator = await this.prisma.operators.findFirst({ where: { user_id: user.id } })
            socket_ids.push(operator?.socket_id, user?.socket_id)
            usersData = {
                id: user.id,
                chat_id: user.chat_id,
                name: user.name,
                is_block: user.is_block,
                date: user.updated_at.toLocaleString(),
                phone: user.phone_number,
                is_online: user.is_online,
                last_message: user.messages[0]?.message || { content: "" },
                push: user.messages.filter(msg => msg.is_ready === false && msg.is_answer == 0).length
            }
        }
        let contentType: string
        let botEvent: EventType
        if (imageTypes.includes(file.mimetype)) {
            path = client.uuid + '/images/' + path
            contentType = reply_message_id ? ContentType.REPLYPHOTO : ContentType.PHOTO
            botEvent = 'sendPhoto'
        } else if (audioTypes.includes(file.mimetype)) {
            path = client.uuid + '/audios/' + path
            contentType = reply_message_id ? ContentType.REPLYVOICE : ContentType.VOICE
            botEvent = 'sendAudio'
        } else if (videoTypes.includes(file.mimetype)) {
            path = client.uuid + '/videos/' + path
            contentType = reply_message_id ? ContentType.REPLYVIDEO : ContentType.VIDEO
            botEvent = 'sendVideo'
        } else if (documentTypes.includes(file.mimetype)) {
            path = client.uuid + '/documents/' + path
            contentType = reply_message_id ? ContentType.REPLYDOCUMENT : ContentType.DOCUMENT
            botEvent = 'sendDocument'
        } else {
            throw new BadRequestException(file_type_error[lang])
        }

        usersData.last_message = { content: contentType }

        path = '/support/' + path + filename

        let metaData = {
            'Content-Type': file.mimetype,
        }

        await Helper.uploadMinio(file.buffer, path, metaData)

        let newMessage: Message | any = {
            content: path
        }

        let sendmessage: Message = {
            content: path
        }
        if (data?.reply_message_id) {
            let message = await this.prisma.messages.findFirst({ where: { id: data.reply_message_id }, select: { id: true, message: true, content_type: true, is_answer: true, user: true, operator: true } })
            if (!message) throw new BadRequestException(message_notfound[lang])
            newMessage.reply_message_id = message.id
            sendmessage.reply_message_id = data.reply_message_id
            sendmessage.reply_content = { content: Object(message.message)?.content, content_type: message.content_type, author: message.is_answer == 0 ? message.user.name : message.operator.first_name }
        }
        let createdMessage = await this.prisma.messages.create({
            data: {
                user_id: usersData.id, is_answer: is_answer, operator_id: is_answer == 1 ? client.user_id : null, content_type: contentType, ticket_id: Number(ticket_id), message: newMessage
            },
            select: {
                id: true,
                created_at: true,
                is_answer: true,
                content_type: true,
                is_ready: true,
                user: true
            }
        })

        let responseData: SendMessageResponse = {
            id: createdMessage.id,
            message: sendmessage,
            formatted_time: createdMessage.created_at.toLocaleTimeString(),
            date: createdMessage.created_at,
            is_answer: createdMessage.is_answer,
            base_url: this.config.get('FILES_BASE_URL'),
            author: is_answer = 0 ? usersData.name : client.name,
            content_type: createdMessage.content_type,
            is_ready: createdMessage.is_ready
        }
        await this.prisma.users.update({ where: { id: createdMessage.user.id }, data: { last_message: contentType, updated_at: new Date() } })
        await this.prisma.tickets.update({ where: { id: Number(ticket_id) }, data: { updated_at: new Date() } })

        if (Object(createdMessage.user.action)?.is_telegram_user) {
            let response = await botSendFile(botEvent, { chat_id: createdMessage.user.chat_id, reply_to_message_id: sendmessage.reply_bot_message_id }, file)

            if (response?.['ok'] === false) {
                newMessage.content = user_blocked[lang]
                sendmessage.content = user_blocked[lang]
                await this.prisma.messages.update({ where: { id: createdMessage.id }, data: { message: newMessage, content_type: 'text' } })
            } else {
                await this.prisma.messages.update({ where: { id: createdMessage.id }, data: { bot_id: response.message_id } })
            }
        }

        socket_ids.forEach(id => {
            this.socket.server.to(id).emit(EmitTypes.NEWMESSAGE, responseData)
        })

        await this.ticketHelper.notification(this.socket.server, ticket.id)
        let operators = await this.prisma.operators.findMany({ where: { is_active: true } })
        operators.map(operator => {
            this.socket.server.to(operator.socket_id).emit(EmitTypes.NOTIFICATION, usersData)
        })

        return { result: StatusTypes.SUCCESS }
    }

    async getUserData(uuid: string): Promise<{
        phone: string
        firstname: string,
        lastname: string,
        surname: string,
        photo: string
    } | null> {
        return { firstname: "", lastname: "", phone: "", photo: "", surname: "" }
    }
}

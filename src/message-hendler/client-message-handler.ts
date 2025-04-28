import { PrismaService } from "src/prisma/prisma.service";
import { Server, Socket } from 'socket.io';
import { Injectable } from "@nestjs/common";
import { sendMessageDto } from "src/message-hendler/dto/sendMessageDto";
import { ClientRequest } from "src/dto/clientModel";
import { Message, openTicketDto } from "src/dto/openTicketDto";
import { ContentType, EmitTypes, StatusTypes } from "src/dto/types";
import { SendMessageResponse } from "./emitsmodel/sendmessage-response";
import { UserModel } from "src/operator/responses/usersModel";
import { TicketHelper } from "./ticket-notification";
import { ConfigService } from "@nestjs/config";
import { Users } from "@prisma/client";
import { createMessage } from "./opanai";
import { OpenTicketResponse } from "src/responses/AppServiceResponse";

@Injectable()
export class ClientMessageHendler {
    constructor(
        private prisma: PrismaService,
        private ticketHelper: TicketHelper,
        private config: ConfigService
    ) { }

    async sendMessage(data: sendMessageDto, client: Socket, server: Server) {
        let user: ClientRequest = client['user']

        let existsUser = await this.prisma.users.findFirst({
            where:{
                chat_id: user.uuid
            }
        })

        let { message, ticket_id, reply_message_id } = data

        if(!existsUser) {
            let category = await this.prisma.categories.findFirst()
            let ticket = await this.openTicket({category_id:category.id, message: message}, user, 'uz', server)
            ticket_id = ticket.data.id
        } else {
            let userTicket = await this.prisma.tickets.findFirst({
                where:{
                    user_id: existsUser.id
                }
            })
            ticket_id = userTicket.id
        }

        let newMessage: Message | any = {
            content: message
        }

        let ticket = await this.prisma.tickets.findUnique({ where: { id: ticket_id } })
        if (!ticket) return server.to(client.id).emit(EmitTypes.EXCEOPTION, { status: 403, error: 'Bad Request', message: 'Ticket not found' })
        let siwitchOperators = await this.prisma.operators.findMany({
            where: {
                AND: {
                    ticket_id: ticket_id,
                    is_active: true
                }
            }
        })
        let sendmessage: Message = {
            content: message,
        }
        let userData = await this.prisma.users.findUnique({ where: { chat_id: user.uuid } })
        if (reply_message_id) {
            let message = await this.prisma.messages.findFirst({ where: { id: data.reply_message_id }, select: { id: true, message: true, content_type: true, is_answer: true, user: true, operator: true } })
            if (!message) server.to(client.id).emit(EmitTypes.EXCEOPTION, { status: 403, error: 'Bad Request', message: 'No message found by reply_message_id' });
            newMessage.reply_message_id = message.id
            sendmessage.reply_message_id = reply_message_id
            sendmessage.reply_content = { content: Object(message.message).content, content_type: message.content_type, author: message.is_answer == 0 ? message.user.name : message.operator.first_name }
        }
        let contentType = reply_message_id ? ContentType.REPLYTEXT : ContentType.TEXT
        let createdMessage = await this.prisma.messages.create({
            data: {
                user_id: userData.id, is_answer: 0, content_type: contentType, ticket_id: ticket_id, message: newMessage,
                is_ready: siwitchOperators.length ? true : false
            },
            select: {
                id: true, message: true, content_type: true, created_at: true, is_answer: true,
                user: {
                    select: { id: true, chat_id: true, name: true, phone_number: true, is_block: true, is_online: true, messages: true, updated_at: true }
                },
                is_ready: true,
            }
        })

        await this.prisma.users.update({ where: { id: createdMessage.user.id }, data: { last_message: data.message, updated_at: new Date() } })

        let responseData: SendMessageResponse = {
            id: createdMessage.id,
            message: sendmessage,
            formatted_time: createdMessage.created_at.toLocaleTimeString(),
            date: createdMessage.created_at,
            base_url: this.config.get('FILES_BASE_URL'),
            is_answer: createdMessage.is_answer,
            author: createdMessage.user.name,
            content_type: createdMessage.content_type,
            is_ready: createdMessage.is_ready
        }

        siwitchOperators.forEach(async operator => {
            server.to(operator.socket_id).emit(EmitTypes.NEWMESSAGE, responseData)
        })

        this.ticketHelper.notification(server, ticket.id)
        await this.prisma.tickets.update({ where: { id: ticket.id }, data: { status: StatusTypes.AWAITING } })
        let responseUser: UserModel = {
            id: createdMessage.user.id,
            chat_id: createdMessage.user.chat_id,
            name: createdMessage.user.name,
            last_message: newMessage,
            date: createdMessage.user.updated_at.toLocaleString(),
            phone: createdMessage.user.phone_number,
            is_block: createdMessage.user.is_block,
            is_online: createdMessage.user.is_online,
            push: createdMessage.user.messages.filter(msg => msg.is_ready === false && msg.is_answer === 0).length
        }
        console.log('responseUser', responseUser);

        server.to(client.id).emit(EmitTypes.NEWMESSAGE, responseData)
        server.emit(EmitTypes.NOTIFICATION, responseUser)


        if ([9].includes(ticket.category_id)) {
            let response = await createMessage(ticket.last_request_user, message, createdMessage.user.chat_id)
            if (response) await this.createMessage(response, server, client, userData, ticket_id)
        }
        // let responsemessage: SendMessageResponse = {
        //     id: createdMessage.id,
        //     message: {
        //         content: response
        //     },
        //     formatted_time: createdMessage.created_at.toLocaleTimeString(),
        //     date: createdMessage.created_at,
        //     base_url: this.config.get('FILES_BASE_URL'),
        //     is_answer: 0,
        //     author: "chat gpt",
        //     content_type: 'text',
        //     is_ready: true
        // } 
        // server.to(client.id).emit(EmitTypes.NEWMESSAGE, responsemessage)


    }

    async createMessage(message: string, server: Server, client: Socket, userData: Users, ticket_id: number) {
        let sendmessage: Message = {
            content: message,
        }
        console.log('createdMessage', sendmessage);

        let createdMessage = await this.prisma.messages.create({
            data: {
                user_id: userData.id,
                is_answer: 1,
                content_type: ContentType.TEXT,
                ticket_id: ticket_id,
                message: sendmessage as any,
                operator_id: 1,
                is_ready: true
            },
            select: {
                id: true,
                message: true,
                content_type: true,
                created_at: true,
                is_answer: true,
                user: {
                    select: {
                        id: true,
                        chat_id: true,
                        name: true,
                        phone_number: true,
                        is_block: true,
                        is_online: true,
                        messages: true,
                        updated_at: true
                    }
                },
                operator: {
                    select: {
                        first_name: true
                    }
                },
                is_ready: true,
            }
        })

        let responseData: SendMessageResponse = {
            id: createdMessage.id,
            message: sendmessage,
            formatted_time: createdMessage.created_at.toLocaleTimeString('ru'),
            date: createdMessage.created_at,
            base_url: this.config.get('FILES_BASE_URL'),
            is_answer: createdMessage.is_answer,
            author: createdMessage.operator.first_name,
            content_type: createdMessage.content_type,
            is_ready: createdMessage.is_ready
        }
        server.to(client.id).emit(EmitTypes.NEWMESSAGE, responseData)
    }

    async openTicket(data: openTicketDto, client: ClientRequest, lang, socket: Server): Promise<OpenTicketResponse> {
        const { category_id, message, bot_message_id, content_type } = data
        let category = await this.prisma.categories.findFirst(({
            where: { id: category_id }
        }))

        let content_lang: string = lang
        let category_name = category.name[lang]

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
                    lang: content_lang
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
            
            socket.emit(EmitTypes.NOTIFICATION, usersData)

            return { result: StatusTypes.SUCCESS, data: { id: newTicket.id, name: category_name } }
        }

        let newTicket = await this.prisma.tickets.create({
            data: {
                category_id: Number(category_id),
                user_id: user.id,
                status: StatusTypes.ACTIVE,
                lang: content_lang
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

        socket.emit(EmitTypes.NOTIFICATION, usersData)
        return { result: StatusTypes.SUCCESS, data: { id: newTicket.id, name: category_name } }
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
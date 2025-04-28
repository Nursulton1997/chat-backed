import { z } from 'zod'

export const message = z
    .string()
    .min(1, { message: 'Must be at least 1 character.' })
    .max(2048, { message: 'Must be at most 2048 characters.' })
export const ticket_id = z.number().min(1)
export const replay_message_id = z.number().optional()
export const message_id = z.number().optional()

export const SendMessageData = z.object({
    message: message,
    replay_message_id: replay_message_id
})

export const EditMessageData = z.object({
    message: message,
    message_id: message_id
})

export const DeleteMessageData = z.object({
    message_id: message_id
})
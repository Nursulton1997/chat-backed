export const download = ["📲 Download application", "📲 Скачать приложение", "📲 Ilovani yuklash"]
export const download_description = {uz:'🔗* Ilovani yuklab olish uchun havola*', ru:'🔗* Ссылка для скачивания приложения*', en:'🔗 *Link to download the application*'}
export const home_txt = { uz:"🏠 Bosh saxifa", ru:"🏠 Домашняя страница", en:"🏠 Home page" }
export const contact = ["📞 Aloqa", "📞 Contact", "📞 Контакты"]
export const tickets_txt = {
    uz: "*Mavzulardan birini tanlang *👇\n\n🔸- _mavzuni davom etish\n🔹- yangi mavzu ochish_", 
    ru: "*Выберите одну из тем* 👇\n\n🔸- продолжить тикет\n🔹- открыть новый тикет", 
    en: "*Choose one of the topics *👇\n\n🔸- _continue ticket\n🔹- open a new ticket_"
}
export const answer_txt = {
    uz:"Yaxshi savolingizni batafsil yozing",
    ru:"Напишите свой хороший вопрос подробно",
    en:"Write your good question in detail"
}
export const success_txt = {uz: "Qabul qilindi operator javobini kuting", ru: "Получил, дождитесь ответа оператора", en: "Received, wait for the operator's response"}
export const file_type_error = {uz: 'Fayl turi qo\'llab-quvvatlanmaydi', ru: 'Тип файла не поддерживается', en:'The file type is not supported'}
export const file_size_error = {uz: 'Maksimal fayl hajmi 100 mb', ru: 'Максимальный размер файла 100 МБ', en:'Maximum file size 100 mb'}
export const already_ticket_error = {uz: 'Bu ticket allaqachon ochilgan', ru: 'Этот тикет уже открыт', en:'This ticket has already been opened'}
export const auth_error = {uz: 'Login yoki parol noto\'g\'ri', ru: 'Неправильный логин или пароль', en:'Login or password incorret'}
export const register_error = {uz: 'Foydalanuvchi nomi band', ru: 'Имя пользователя занято', en:'Username taken'}
export const operator_notfound = {uz: 'Operator topilmadi', ru: 'Оператор не найден', en:'Operator not found'}
export const ticket_notfound = {uz: 'Chipta topilmadi', ru: 'Билет не найден', en:'Ticket not found'}
export const message_notfound = {uz: 'Javob berilgan xabar identifikatorida xabar topilmadi', ru: 'Сообщение не найдено по идентификатору сообщения, на которое был дан ответ.', en:'A message was not found by the message ID that was answered'}
export const ticket_opened_error = {uz: 'Bu ticket boshqa operator tomonidan ochilgan', ru: 'Этот тикет был открыт другим оператором', en:'This ticket was opened by another operator'}
export const unable_user_error = {uz: 'Noma\'lum foydalanuvchiga yozish imkonsiz', ru: 'Невозможно написать неопределенному пользователю', en:'Unable to write to unspecified user'}
export const success = { uz: 'Muvaffaqiyatli', ru: 'Успешный', en: 'Success'}
export const user_blocked = { uz: 'Foydalanuvchi botni blocklagani sabab xabar yetkazilmadi', ru: 'Сообщение не было доставлено, поскольку пользователь заблокировал бота.', en: 'The message was not delivered because the user blocked the bot'}
export const _user_blocked = { uz: 'Foydalanuvchi botni blocklagan', ru: 'Пользователь заблокировал бота', en: 'The user blocked the bot'}
export const else_message = { uz: 'Xurmatli mijoz agar savolingiz bo\'lsa *📞 Aloqa* tugmasini bosing', ru: 'Уважаемый покупатель, если у вас есть вопросы, нажмите кнопку *📞 Контакты*', en: 'Dear customer, if you have any questions, please click the *📞 Contact* button.'}
export const proccess = { uz: 'Jarayonda', ru: 'В обработке', en: 'In process'}
export const error = { uz: 'Xatolik', ru: 'Ошибка', en: 'Error'}
export const today = { uz: 'Bugun', ru: 'Сегодня', en: 'Today'}
export const yesterday = { uz: 'Kecha', ru: 'Вчера', en: 'Yesterday'}
export const conternt_types = { 
    photo: { uz:'Rasm', ru: 'Картина', en: 'Picture'},
    voice: { uz:'ovozli xabar', ru: 'голосовое сообщение', en: 'voice message'},
    video: { uz:'video', ru: 'видео', en: 'video'},
    document: { uz:'hujjat', ru: 'документ', en: 'document'},
    reply_document: { uz:'hujjat', ru: 'документ', en: 'document'},
    reply_photo: { uz:'Rasm', ru: 'Картина', en: 'Picture'},
    reply_video: { uz:'video', ru: 'видео', en: 'video'},
    reply_voice: { uz:'ovozli xabar', ru: 'голосовое сообщение', en: 'voice message'},
}

export const status_dictonary = {
    myticket :{uz: "Mening chiptalarim", ru: "Мои тикеты", en: "My tickets", order:1 },
    active :{uz: "Yangi", ru: "Новые", en: "New", order:2},
    answered :{uz: "Javob berdi", ru: "Отвеченные", en: "Answered", order:3},
    awaiting :{uz: "Javob kutilmoqda", ru: "Ожидающие ответа", en: "Awaiting reply", order:4},
    expired :{uz: "Muddati o'tgan", ru: "Просроченные", en: "Overdue", order:5},
    noactive :{uz: "Faol emas", ru: "Неактивные", en: "Inactive", order:6},
    closed :{uz: "Yopiq", ru: "Закрытые", en: "Closed", order:7}
}

export const week = {uz: "7 kun", ru: "7 дней", en: "7 days"}
export const two_week = {uz: "2 hafta", ru: "2 недели", en: "2 weeks"}
export const four_week = {uz: "4 hafta", ru: "4 недели", en: "4 weeks"}
export const ten_days = {uz: "10 kun", ru: "10 дней", en: "10 days"}

export const defaultMessages = {
    8: { 
        uz: "Hurmatli mijoz, bergan ma'lumotlariz uchun rahmat.\nMa'lumotlaringiz texnik hodimlarga etkaziladi, lekin murojatingiz holati bo'yicha bu yerda ma'lumot taqdim etilmaydi.\n\nAgar yordamga ehtiyojingiz bo'lsa 1216 aloqa markaziga murojaat qilishingiz mumkin, dushanbadan jumagacha soat 09:00 dan 18:00 gacha.",
        ru: "Уважаемый клиент, спасибо за предоставленную информацию.\nВаша информация будет передана техническому персоналу, но информация о статусе вашей заявки здесь не предоставляется.\n\nЕсли вам нужна помощь, вы можете обратиться в контакт-центр 1216 с понедельника по пятницу с 09:00 до 18:00.",
        en: "Dear customer, thank you for the information provided.\nYour information will be shared with the technical staff, but information about the status of your application is not provided here.\n\nIf you need help, you can contact the 1216 contact center from Monday to Friday from 09:00 to 18:00."
    },
    9: {
        uz: "Assalomu alaykum. Men Mobile uchun yaratilgan suniy intelektman.",
        ru: "Привет. Я искусственный интеллект, созданный для приложения Mobile.",
        en: "Hello. I am an artificial intelligence created for the Mobile application.",
    }
}

export const max_file_size_error = {
    uz: "Siz maksimum 20 Mb gacha fayl yuborishingiz mumkin",
    ru: "Размер максимум 20 Мб гача файл юборишингиз мамкин",
    en: "You can send files up to a maximum of 20 MB."
}
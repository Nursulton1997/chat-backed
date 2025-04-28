import TelegramBot from "node-telegram-bot-api";
type ButtonType = "home" | "language" | 'app_link' | 'home2'
const button = (btn:ButtonType, lang?) => {
    switch (btn) {
        case 'home':
            let home: {
               uz: TelegramBot.ReplyKeyboardMarkup,
               en: TelegramBot.ReplyKeyboardMarkup,
               ru: TelegramBot.ReplyKeyboardMarkup,
            } = {
               uz: {
                   resize_keyboard: true, 
                   keyboard: [
                       [{ text : "📲 Ilovani yuklash"}, {text: "📞 Aloqa",  request_contact: true}]
                   ]
               },
               en: {
                   resize_keyboard: true, 
                   keyboard: [
                       [{ text : "📲 Download application"}, {text: "📞 Contact",  request_contact: true}]
                   ]
               },
               ru: {
                   resize_keyboard: true, 
                   keyboard: [
                       [{ text : "📲 Скачать приложение"}, {text: "📞 Контакты", request_contact: true}]
                   ]
               }
            }
            return home[lang]
        case 'home2':
            let home2: {
                uz: TelegramBot.ReplyKeyboardMarkup,
                en: TelegramBot.ReplyKeyboardMarkup,
                ru: TelegramBot.ReplyKeyboardMarkup,
            } = {
                uz: {
                    resize_keyboard: true, 
                    keyboard: [
                        [{ text : "📲 Ilovani yuklash"}, {text: "📞 Aloqa"}]
                    ]
                },
                en: {
                    resize_keyboard: true, 
                    keyboard: [
                        [{ text : "📲 Download application"}, {text: "📞 Contact"}]
                    ]
                },
                ru: {
                    resize_keyboard: true, 
                    keyboard: [
                        [{ text : "📲 Скачать приложение"}, {text: "📞 Контакты"}]
                    ]
                }
            }
            return home2[lang]
        case 'language':
            let language:TelegramBot.InlineKeyboardMarkup = {
                inline_keyboard: [
                    [{text: "🇺🇿 O'zbekcha", callback_data: 'uz'}, {text: "🇷🇺 Русский", callback_data: 'ru'}, {text: "🇺🇸 English", callback_data: 'en'}]
                ]
            }
            return language
        case 'app_link': 
            let app_link: TelegramBot.InlineKeyboardMarkup = {
                inline_keyboard: [
                    [{text: "📥 Play market", url: 'https://play.google.com/store/apps/details?id=uz.milliypay.android&pcampaignid=web_share'}],
                    [{text: "📥 App Store", url: 'https://play.google.com/store/apps/details?id=uz.milliypay.android&pcampaignid=web_share'}],
                ]
            }
            return app_link
    }
}




export {
    button
}
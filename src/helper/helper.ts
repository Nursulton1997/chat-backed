import { today, yesterday } from "src/dictonary";
import * as dotenv from "dotenv";
import * as Minio from 'minio'
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { extname, join } from "path";
const https = require('https');
const fs = require('fs');

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_HOST,
    port: +process.env.MINIO_PORT,
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
})
// import Client from "./detect-language";

// let detectLanguage = new Client(dotenv.config().parsed.DETECT_LANGUAGE_KEY)
export class Helper {
    static formatByMonthName(date: Date, lang: string): string {
        const monthNames = {
            'ru': [
                'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
            ],
            'uz': [
                'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
                'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
            ],
            'en': [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ]
        }

        const currentDate = new Date();
        const inputDate = new Date(date);

        let dateString = ''
        const timeDiff = currentDate.getTime() - inputDate.getTime();
        const dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24)); // kunga o'tkazadi

        if (currentDate.getDate() === inputDate.getDate() && currentDate.getMonth() === inputDate.getMonth()) {
            if (lang == 'en') {
                dateString = today[lang] + ` ${inputDate.toLocaleTimeString('uz-UZ', { minute: "2-digit", hour: '2-digit' })}`
            } else {
                dateString = today[lang] + ` ${inputDate.toLocaleTimeString('uz-UZ', { minute: "2-digit", hour: '2-digit' })}`
            }
        } else if (currentDate.getDate() - inputDate.getDate() === 1 && currentDate.getMonth() === inputDate.getMonth()) {
            dateString = yesterday[lang]
            if (lang == 'en') {
                dateString = yesterday[lang] + ` ${inputDate.toLocaleTimeString('uz-UZ', { minute: "2-digit", hour: '2-digit' })}`
            } else {
                dateString = yesterday[lang] + ` ${inputDate.toLocaleTimeString('uz-UZ', { minute: "2-digit", hour: '2-digit' })}`
            }
        } else if (dayDiff > 1 && inputDate.getFullYear() === currentDate.getFullYear()) {
            if (lang == 'en') {
                dateString = `${monthNames[lang][inputDate.getMonth()]} ${inputDate.getDate()} ${inputDate.toLocaleTimeString('uz-UZ', { minute: "2-digit", hour: '2-digit' })}`
            } else {
                dateString = `${inputDate.getDate()} ${monthNames[lang][inputDate.getMonth()]} ${inputDate.toLocaleTimeString('uz-UZ', { minute: "2-digit", hour: '2-digit' })}`
            }
        } else if (currentDate.getFullYear() - inputDate.getFullYear() >= 1) {
            if (lang == 'en') {
                dateString = `${monthNames[lang][inputDate.getMonth()]} ${inputDate.getDate()} ${inputDate.getFullYear()}`
            } else {
                dateString = `${inputDate.getDate()} ${monthNames[lang][inputDate.getMonth()]} ${inputDate.getFullYear()}`
            }
        }

        return dateString
    }

    static async uploadMinio(buffer: Buffer, path, metadata) {

        if (!existsSync('files/' + path)) {
            mkdirSync('files/' + path, { recursive: true });
        }

        writeFileSync(join(process.cwd(), 'files', path), buffer)
    }

    static async uploadByFileLink(fileLink: string, payload: { filename: string, folder: string }) {
        let { filename, folder } = payload
        if (!existsSync('files/' + folder)) {
            mkdirSync('files/' + folder, { recursive: true });
        }

        let ext_name = extname(fileLink)
        const filePath = join(process.cwd(), 'files', folder, `${filename}${ext_name}`);
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(filePath);
            https.get(fileLink, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(() => resolve(filePath));
                });
            }).on('error', (err) => {
                fs.unlink(filePath, () => reject(err));
            });
        });
    }

    static async detectLanguage(message: string) {
        try {
            // let langs = await detectLanguage.post('detect', { q: message })
            // langs = langs?.data?.detections?.filter(el => el.isReliable === true).sort((a, b) => a.confidence - b.confidence) 
            // return ['uz', 'ru', 'en'].includes(langs[0]?.language) ?  langs[0]?.language : 'uz'
        } catch (error) {
            return undefined
        }
    }
}
// email.ts
import nodemailer from 'nodemailer';
import { NotificationEvents, NotificationMessages } from '../../types/notifcation';
import generateEmailTemplate from './emailSend';
import path from 'path';

const __dirname = path.resolve(path.dirname(''));

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, 
    },
});


export async function sendEmail(to: string, event: NotificationEvents, auctionName: string, username: string, args: any = {}) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to, 
        subject: NotificationMessages[event].eventHeader, 
        html: generateEmailTemplate(username, NotificationMessages[event].eventBody(auctionName, args)),
        attachments: [{   
            filename: 'logo.jpg',
            content: 'https://i.ibb.co/YQpG3X0/logo.png',
            path: 'https://i.ibb.co/YQpG3X0/logo.png',
            cid: 'logo' 
        }]
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
    } catch (error) {
        console.error('Error sending email: ' + error);
    }
}
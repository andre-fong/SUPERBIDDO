// email.ts
import nodemailer from 'nodemailer';
import { NotificationEvents, NotificationMessages } from '../../types/notifcation';
import generateEmailTemplate from './emailSend';

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
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
    } catch (error) {
        console.error('Error sending email: ' + error);
    }
}
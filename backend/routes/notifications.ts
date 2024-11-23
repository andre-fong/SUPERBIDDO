import express from "express";
import { sendEmail } from "../utils/email";

export const router = express.Router();

let onlineClients = [];

export function sendNotification(accountId: string, message: string) {
    onlineClients.forEach(client => {
        if (client.accountId === accountId) {
            client.res.json({ message });
            client.res.end();
        }
    });
}

// setInterval(() => {
//     console.log(onlineClients.length);
//     // sendNotification("41d98c2c-2a8d-4b4d-9342-a4e235a1526a", "Hello from the server");
// }, 5000);
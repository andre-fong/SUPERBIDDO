import express from "express";
import { sendEmail } from "../utils/email";

export const router = express.Router();

let onlineClients = [];

router.get("/:accountId", (req, res) => {
    const accountId = req.params.accountId;
    // Add the response object to the auction's client list
    if (!onlineClients.some(client => client.accountId === accountId)) {
        onlineClients.push({ accountId, res });
    }

    // Handle connection close
    req.on("close", () => {
        onlineClients = onlineClients.filter(client => client.res !== res);
    });
    return;
});

export function sendNotification(accountId: string, message: string) {
    onlineClients.forEach(client => {
        if (client.accountId === accountId) {
            client.res.json({ message });
            client.res.end();
        }
    });
}

setInterval(() => {
    console.log(onlineClients.length);
    sendNotification("41d98c2c-2a8d-4b4d-9342-a4e235a1526a", "Hello from the server");
}, 5000);
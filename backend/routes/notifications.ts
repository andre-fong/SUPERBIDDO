import express from "express";
import { sendEmail } from "../utils/email";

export const router = express.Router();

let onlineClients = [];

router.get("/:accountId", (req, res) => {
    const accountId = req.params.accountId;

    console.log(`Client connected: ${accountId}`);
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

// setInterval(() => {
//     console.log(onlineClients.length);
//     sendNotification("3bcf7c0d-e06d-4948-be4f-efec0c37319f", "Hello");
// }, 5000);
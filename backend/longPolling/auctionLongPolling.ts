import camelize from "camelize";
import { pool } from "../configServices/dbConfig";
import { Response } from "express";
import fetch from "node-fetch"; // Import node-fetch

export function handleCloseAuctionRequest(
  auctionId: string,
  clients: Response[]
) {
  fetch(`${process.env.BACKEND_URL}/api/v1/auctions/${auctionId}`).then(
    (res) => {
      if (res.status === 200) {
        res.json().then((auction) => {
          for (let client of clients) {
            client.status(200).json(auction);
          }
        });
      }
    }
  );
}

import express, { Request } from "express";
import { pool } from "../configServices/dbConfig.js";
import camelize from "camelize";
import { unauthorized, ServerError, BusinessError } from "../utils/errors.js";
import { closeLpRequest } from "../longPolling/longPolling.js";
import {
  postBidNotification,
  notificationMiddleware,
} from "../middlewares/notifications.js";

export const router = express.Router({ mergeParams: true });

router.post(
  "/",
  notificationMiddleware(postBidNotification),
  async (
    req: Request<
      {
        auctionId: string;
      },
      Bid,
      BidInput,
      {
        page?: string;
        pageSize?: string;
      }
    >,
    res
  ) => {
    const { auctionId } = req.params;
    const { amount, bidderId } = req.body;

    // bidderId must be the same as the authenticated user
    if (req.session.accountId !== bidderId) {
      throw unauthorized();
    }

    const bidRecord = camelize(
      await pool
        .query<BidDb>(
          ` INSERT INTO bid (auction_id, bidder_id, amount)
            VALUES ($1, $2, $3)
            RETURNING *`,
          [auctionId, bidderId, amount]
        )
        .catch((err) => {
          console.log(err);
          switch (err.constraint) {
            case "bid_fk_auction":
              throw new BusinessError(404, "Auction not found");
            case "auction_ended":
              throw new BusinessError(409, "Auction has ended");
            case "auction_not_started":
              throw new BusinessError(409, "Auction has not started");
            case "already_leading":
              throw new BusinessError(
                409,
                "You are already the leading bidder"
              );
            case "bid_fk_bidder":
              throw new BusinessError(404, "Bidder not found");
            case "bidder_same_as_auctioneer":
              throw new BusinessError(409, "Cannot bid on own auction");
            case "bid_amount_insufficient":
              throw new BusinessError(409, "Bid too low", err.hint);
            default:
              throw new ServerError(500, "Error inserting bid");
          }
        })
    ).rows[0];

    const bidderRecord = camelize(
      await pool.query<
        Omit<
          AccountDb,
          "passhash" | "address_formatted" | "latitude" | "longitude"
        >
      >(
        ` SELECT account_id, username, email FROM account WHERE account_id = $1`,
        [bidderId]
      )
    ).rows[0];

    const bidder: Account = bidderRecord;

    const bid: Bid = {
      bidId: bidRecord.bidId,
      auctionId: bidRecord.auctionId,
      bidder: bidder,
      amount: parseFloat(bidRecord.amount),
      timestamp: bidRecord.timestamp,
    };

    closeLpRequest(auctionId);

    // add user action for bidding on auction
    if (req.session.accountId) {
      await pool.query<UserActionDb>(
        ` WITH auction_game AS (
            SELECT game FROM bundle WHERE auction_id = $1
            UNION
            SELECT game FROM card WHERE auction_id = $1
            LIMIT 1
          )
          INSERT INTO recommendation (account_id, game, price, action)
          VALUES ($2, (SELECT game FROM auction_game), $3, 'bid')
          RETURNING *`,
        [auctionId, req.session.accountId, parseFloat(bidRecord.amount)]
      );
    }

    res.status(201).json(bid);
  }
);

router.get(
  "/",
  async (
    req: Request<
      {
        auctionId: string;
      },
      { bids: Bid[]; totalNumBids: number },
      never,
      {
        page?: string;
        pageSize?: string;
      }
    >,
    res
  ) => {
    const { auctionId } = req.params;
    const { page = "1", pageSize = "10" } = req.query;
    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    const bidRecords = camelize(
      await pool.query<BidDb & AccountDb & { total: number }>(
        ` WITH total AS (
            SELECT COUNT(*) AS totalNumBids FROM bid WHERE auction_id = $1
          )
          SELECT bid.*, account.account_id, account.username, account.email, 
          total.totalNumBids FROM bid
          JOIN account ON account.account_id = bid.bidder_id
          JOIN total ON true
          WHERE auction_id = $1
          ORDER BY timestamp DESC
          LIMIT $2 OFFSET $3`,
        [auctionId, limit, offset]
      )
    ).rows;

    const bids: Bid[] = bidRecords.map((bidRecord) => {
      return {
        bidId: bidRecord.bidId,
        auctionId: bidRecord.auctionId,
        bidder: {
          accountId: bidRecord.bidderId,
          email: bidRecord.email,
          username: bidRecord.username,
        },
        amount: parseFloat(bidRecord.amount),
        timestamp: bidRecord.timestamp,
      };
    });

    res.json({
      bids: bids,
      totalNumBids: bidRecords[0] ? bidRecords[0].total : 0,
    });

    // // Check if the client is polling for updates
    // if (poll) {
    //   // Ensure the auction exists
    //   if (!currentBids[auctionId]) {
    //     return res.status(404).send("Auction not found");
    //   }

    //   // Initialize the auction's client list if it doesn't exist
    //   if (!auctionClients[auctionId]) {
    //     auctionClients[auctionId] = [];
    //   }

    //   // Add the response object to the auction's client list
    //   auctionClients[auctionId].push({ res });

    //   // Handle connection close
    //   req.on("close", () => {
    //     auctionClients[auctionId] = auctionClients[auctionId].filter(
    //       (client) => client.res !== res
    //     );
    //   });
    //   return;
    // } else {
    //   // Return the current state of the auction
    //   res.json(formatBids(currentBids[auctionId]));
    // }
  }
);

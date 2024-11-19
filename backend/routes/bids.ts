import express, { Request } from "express";
import { pool } from "../configServices/dbConfig.js";
import camelize from "camelize";
import { unauthorized, ServerError, BusinessError } from "../utils/errors.js";
import { closeLpRequest } from "../longPolling/longPolling.js";

export const router = express.Router({ mergeParams: true });

// Object to store clients per auction
let auctionClients = {};

// TODO: ts types, and check if this fcn is time efficient
function formatBids(bids) {
  let bidders = {};
  for (let bid of bids) {
    if (!bidders[bid.bidder]) {
      bidders[bid.bidder] = { bids: 0, highBid: 0 };
    }
    bidders[bid.bidder].bids++;
    if (bid.amount > bidders[bid.bidder].highBid) {
      bidders[bid.bidder].highBid = bid.amount;
    }
  }

  let formattedBids = [];
  for (let bidder in bidders) {
    formattedBids.push({
      bidder,
      bids: bidders[bidder].bids,
      highBid: bidders[bidder].highBid,
      lastBidTime: bids[bids.length - 1].date,
    });
  }

  formattedBids.sort((a, b) => b.highBid - a.highBid);

  return formattedBids;
}

router.post(
  "/",
  express.json(),
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
            case "bid_fk_bidder":
              throw new BusinessError(400, "Invalid bidder ID");
            case "bidder_same_as_auctioneer":
              throw new BusinessError(400, "Cannot bid on own auction");
            case "bid_amount_insufficient":
              throw new BusinessError(400, "Bid too low", err.hint);
            default:
              throw new ServerError(500, "Error inserting bid");
          }
        })
    ).rows[0];

    const bidderRecord = camelize(
      await pool.query<AccountDb>(
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

    console.log(bids);
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

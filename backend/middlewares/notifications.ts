import { Request, Response, NextFunction } from "express";
import { io } from "../index.js";
import camelize from "camelize";
import { pool } from "../configServices/dbConfig.js";
import schedule from "node-schedule";
import moment from "moment";
import { sendEmail } from "../utils/emailInfo/email.js";
import { NotificationEvents } from "../types/notifcation.js";

// override res.json to call handlerFn then call original json
export function notificationMiddleware(
  handlerFn: (req: Request, res: Response, body: any) => void
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    res.json = function (body) {
      handlerFn(req, res, body);
      return originalJson.call(this, body);
    };
    next();
  };
}

type ReminderJobs = {
  [auctionId: string]: {
    auctionEnd: schedule.Job;
    auctionSoonEnd: schedule.Job | null;
  };
};

let reminderJobs = {} as ReminderJobs;

async function getAllBiddersWithEmail(auctionId: string) {
  return await pool.query(
    `SELECT DISTINCT bid.bidder_id, account.email, account.username
     FROM bid 
     JOIN account ON bid.bidder_id = account.account_id 
     WHERE auction_id = $1`,
    [auctionId]
  );
}

async function getTopBidder(auctionId: string) {
  return await pool.query(
    `SELECT bid.bidder_id, account.email, account.username 
     FROM bid 
     JOIN account ON bid.bidder_id = account.account_id 
     WHERE auction_id = $1 
     ORDER BY amount DESC 
     LIMIT 1`,
    [auctionId]
  );
}

function sendNotification(event: NotificationEvents, accountId: string, email: string, auctionName: string, username: string) {
  if (io.sockets.adapter.rooms.has(accountId)) {
    io.to(accountId).emit(event, auctionName);
  } else {
    sendEmail(email, event, auctionName, username);
  }
}

function scheduleBidEndReminder(
  auctionId: string,
  auctionName: string,
  auctioneerId: string,
  auctioneerEmail: string,
  auctioneerUsername: string,
  reminderDate: Date
) {
  return schedule.scheduleJob(
    true ? new Date(new Date().getTime() + 30 * 1000) : reminderDate,
    () => {
      const allBidders = getAllBiddersWithEmail(auctionId);
      const topBidder = getTopBidder(auctionId);
      Promise.all([allBidders, topBidder]).then(
        ([allBiddersResult, topBidderResult]) => {
          const topBidder =
            topBidderResult.rows.length > 0
              ? topBidderResult.rows[0]
              : null;

          allBiddersResult.rows.forEach((row) => {
            if (row.bidder_id !== topBidder.bidder_id) {
              sendNotification(NotificationEvents.AuctionBidLost, row.bidder_id, row.email, auctionName, row.username);
            }
          });

          if (topBidder) {
            sendNotification(NotificationEvents.AuctionBidWon, topBidder.bidder_id, topBidder.email, auctionName, topBidder.username);
          }
        }
      );
      console.log(auctioneerEmail)
      sendNotification(NotificationEvents.AuctionOwningEnded, auctioneerId, auctioneerEmail, auctionName, auctioneerUsername);
      delete reminderJobs[auctionId];
    }
  );
}

// 4 minutes
const disableSkip = false;

function scheduleAuctionSoonEndReminder(
  auctionId: string,
  auctionName: string,
  reminderDate: Date
) {
  return disableSkip || reminderDate.getTime() - 4 * 60 * 1000 >= 0
    ? schedule.scheduleJob(
        true
          ? new Date(new Date().getTime() + 20 * 1000)
          : new Date(reminderDate.getTime() - 4 * 60 * 1000),
        () => {
          getAllBiddersWithEmail(auctionId).then((allBiddersResult) => {
            console.log(allBiddersResult.rows);
            allBiddersResult.rows.forEach((row) => {
              console.log("Sending email to", row.email);
              sendNotification(NotificationEvents.AuctionEndingSoon, row.bidder_id, row.email, auctionName, row.username);
            });
          });
          delete reminderJobs[auctionId].auctionSoonEnd;
        }
      )
    : null;
}

export async function postBidNotification(
  req: Request,
  res: Response,
  body: any
) {
  const bidRecord = camelize(
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
        LIMIT 1 OFFSET 1`,
      [body.auctionId]
    )
  ).rows[0];

  if (!bidRecord) {
    return;
  }

  const outbidBidder: Bid = {
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
  const auction = camelize(
    await pool.query<{
      auctioneerid: string;
      name: string;
      auctioneeremail: string;
      auctioneerusername: string;
    }>(
      `SELECT auction.auctioneer_id, auction.name, account.email, account.username
       FROM auction
       JOIN account ON auction.auctioneer_id = account.account_id
       WHERE auction_id = $1`,
      [body.auctionId]
    )
  ).rows[0];

  sendNotification(NotificationEvents.AuctionOutbidded, outbidBidder.bidder.accountId, outbidBidder.bidder.email, auction.name, outbidBidder.bidder.username);
  sendNotification(NotificationEvents.AuctionReceivedBid, auction.auctioneerid, auction.auctioneeremail, auction.name, auction.auctioneerusername);
}

export async function postAuctionNotification(
  req: Request,
  res: Response,
  body: any
) {
  // don't schedule if error
  if (!body.auctionId) {
    return;
  }
  const endDate = new Date(body.endTime);
  const reminderDate = moment(endDate).toDate();

  const auctionEndJob = scheduleBidEndReminder(
    body.auctionId,
    body.name,
    body.auctioneer.accountId,
    body.auctioneer.email,
    body.auctioneer.username,
    reminderDate
  );
  const auctionSoonEndJob = scheduleAuctionSoonEndReminder(
    body.auctionId,
    body.name,
    reminderDate
  );

  reminderJobs[body.auctionId] = {
    auctionEnd: auctionEndJob,
    auctionSoonEnd: auctionSoonEndJob,
  };
}

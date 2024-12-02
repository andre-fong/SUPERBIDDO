import { Request, Response, NextFunction } from "express";
import { io } from "../index.js";
import camelize from "camelize";
import { pool } from "../configServices/dbConfig.js";
import schedule from "node-schedule";
import moment from "moment";
import { sendEmail } from "../utils/emailInfo/email.js";
import { NotificationEvents } from "../types/notifcation.js";

const neverDate = new Date('9999-12-31T23:59:59');

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
    const originalSendStatus = res.sendStatus;
    res.sendStatus = function (status) {
      handlerFn(req, res, status);
      return originalSendStatus.call(this, status);
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
    `SELECT bid.bidder_id, account.email, account.username, bid.amount 
     FROM bid 
     JOIN account ON bid.bidder_id = account.account_id 
     WHERE auction_id = $1 
     ORDER BY amount DESC 
     LIMIT 1`,
    [auctionId]
  );
}

async function getAuctionName(auctionId: string) {
  const result = await pool.query(
    `SELECT name 
     FROM auction 
     WHERE auction_id = $1`,
    [auctionId]
  );
  return result.rows.length > 0 ? result.rows[0].name : null;
}

function sendNotification(event: NotificationEvents, accountId: string, email: string, auctionName: string, username: string, args: any = {}) {
  if (!accountId || !email || !auctionName) {
    return;
  }
  
  if (io.sockets.adapter.rooms.has(accountId)) {
    io.to(accountId).emit(event, auctionName);
  } else {
    sendEmail(email, event, auctionName, username, args);
  }
}

async function getAllWatchersWithEmail(auctionId: string) {
  return await pool.query(
    `SELECT DISTINCT watch.account_id, account.email, account.username
     FROM watch 
     JOIN account ON watch.account_id = account.account_id 
     WHERE auction_id = $1`,
    [auctionId]
  );
}

function scheduleBidEndReminder(
  auctionId: string,
  auctioneerId: string,
  auctioneerEmail: string,
  auctioneerUsername: string,
  reminderDate: Date | null
) {
  //false ? new Date(new Date().getTime() + 30 * 1000) 
  return schedule.scheduleJob(
    reminderDate ? reminderDate : neverDate,
    async () => {
      const allBidders = getAllBiddersWithEmail(auctionId);
      const topBidder = getTopBidder(auctionId);
      const watchers = getAllWatchersWithEmail(auctionId);

      //im getting the auction name since the user might change the auctionname
      const auctionName = await getAuctionName(auctionId);
      Promise.all([allBidders, topBidder, watchers]).then(
        ([allBiddersResult, topBidderResult, watchersResults]) => {
          const topBidder =
            topBidderResult.rows.length > 0
              ? topBidderResult.rows[0]
              : null;

          allBiddersResult.rows.forEach((row) => {
            if (row.bidder_id !== topBidder.bidder_id) {
              sendNotification(NotificationEvents.AuctionBidLost, row.bidder_id, row.email, auctionName, row.username);
            }
          });

          watchersResults.rows.forEach((row) => {
            sendNotification(NotificationEvents.AuctionWatchingEnded, row.account_id, row.email, auctionName, row.username);
          });

          if (topBidder) {
            sendNotification(NotificationEvents.AuctionBidWon, topBidder.bidder_id, topBidder.email, auctionName, topBidder.username, {email: auctioneerEmail, amount: topBidder.amount});
          }
        }
      );
      sendNotification(NotificationEvents.AuctionOwningEnded, auctioneerId, auctioneerEmail, auctionName, auctioneerUsername);
      delete reminderJobs[auctionId];
    }
  );
}

function scheduleAuctionSoonEndReminder(
  auctionId: string,
  reminderDate: Date | null
) {
  //        false
  //? new Date(new Date().getTime() + 20 * 1000)
  return !reminderDate || reminderDate.getTime() - 4 * 60 * 1000 >= 0
    ? schedule.scheduleJob(
        reminderDate ? new Date(reminderDate.getTime() - 4 * 60 * 1000)
          : neverDate,
        () => {
          Promise.all([getAllBiddersWithEmail(auctionId), getAuctionName(auctionId), getAllWatchersWithEmail(auctionId)]).then(
            ([allBiddersResult, auctionName, watching]) => {
              allBiddersResult.rows.forEach((row) => {
                sendNotification(NotificationEvents.AuctionEndingSoon, row.bidder_id, row.email, auctionName, row.username);
              });
              watching.rows.forEach((row) => {
                sendNotification(NotificationEvents.AuctionWatchingEndingSoon, row.account_id, row.email, auctionName, row.username);
              });
              delete reminderJobs[auctionId].auctionSoonEnd;
            }
            );
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

  const outbidBidder: Bid = bidRecord && {
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
      email: string;
      username: string;
    }>(
      `SELECT auction.auctioneer_id as auctioneerid, auction.name, account.email, account.username
       FROM auction
       JOIN account ON auction.auctioneer_id = account.account_id
       WHERE auction_id = $1`,
      [body.auctionId]
    )
  ).rows[0];

  const allWatchers = await getAllWatchersWithEmail(body.auctionId);

  allWatchers.rows.forEach((row) => {
    sendNotification(NotificationEvents.AuctionWatchingReceivedBid, row.account_id, row.email, auction.name, row.username);
  });

  if (outbidBidder) {
    sendNotification(NotificationEvents.AuctionOutbidded, outbidBidder.bidder.accountId, outbidBidder.bidder.email, auction.name, outbidBidder.bidder.username);
  }

  if (auction) {
    sendNotification(NotificationEvents.AuctionReceivedBid, auction.auctioneerid, auction.email, auction.name, auction.username);
  }
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

  const reminderDate = body.endTime ? moment(new Date(body.endTime)).toDate(): null;

  const auctionEndJob = scheduleBidEndReminder(
    body.auctionId,
    body.auctioneer.accountId,
    body.auctioneer.email,
    body.auctioneer.username,
    reminderDate
  );
  const auctionSoonEndJob = scheduleAuctionSoonEndReminder(
    body.auctionId,
    reminderDate
  );
  
  reminderJobs[body.auctionId] = {
    auctionEnd: auctionEndJob,
    auctionSoonEnd: auctionSoonEndJob,
  };
}

export async function patchAuctionNotification(
  req: Request,
  res: Response,
  body: any
) {
  if (!reminderJobs[req.params.auctionId]) {
    return;
  }


  if (!body.endTime) {
    reminderJobs[req.params.auctionId].auctionEnd.reschedule(neverDate);
    reminderJobs[req.params.auctionId].auctionSoonEnd.reschedule(neverDate);
    return;
  }

  const reminderDate = moment(new Date(body.endTime)).toDate();

  reminderJobs[req.params.auctionId].auctionEnd.reschedule(reminderDate);
  reminderJobs[req.params.auctionId].auctionSoonEnd.reschedule(
    new Date(reminderDate.getTime() - 4 * 60 * 1000)
  );
}

export async function deleteAuctionNotification(
  req: Request,
  res: Response,
  body: any
) {
  if (reminderJobs[req.params.auctionId]) {
    reminderJobs[req.params.auctionId].auctionEnd.cancel();
    reminderJobs[req.params.auctionId].auctionSoonEnd.cancel();
    delete reminderJobs[req.params.auctionId];
  }
}


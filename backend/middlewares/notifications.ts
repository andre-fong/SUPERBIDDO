import { Request, Response, NextFunction } from "express";
import { io } from "../index.js";
import camelize from "camelize";
import { pool } from "../configServices/dbConfig.js";
import schedule from 'node-schedule';
import moment from 'moment';
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

async function getAllBidders(auctionId: string) {
  return await pool.query(
    `SELECT DISTINCT bidder_id FROM bid WHERE auction_id = $1`,
    [auctionId]
  );
}

async function getTopBidder(auctionId: string) {
  return await pool.query(
    `SELECT bidder_id FROM bid WHERE auction_id = $1 ORDER BY amount DESC LIMIT 1`,
    [auctionId]
  );
}

function scheduleBidEndReminder(auctionId: string, auctionName: string, auctioneerId: string, reminderDate: Date) {
  return schedule.scheduleJob(true ? new Date(new Date().getTime() + 40 * 1000) : reminderDate, () => {
    const allBidders = getAllBidders(auctionId);
    const topBidder = getTopBidder(auctionId);
    Promise.all([allBidders, topBidder]).then(([allBiddersResult, topBidderResult]) => {
      const topBidderId = topBidderResult.rows.length > 0 ? topBidderResult.rows[0].bidder_id : null;

      allBiddersResult.rows.forEach((row) => {
        if (row.bidder_id !== topBidderId) {
          io.to(row.bidder_id).emit("auction_bid_lost", auctionName);
        }
      });

      if (topBidderId) {
        io.to(topBidderId).emit("auction_bid_won", auctionName);
      }
    });
    console.log(auctioneerId)
    io.to(auctioneerId).emit("auction_owning_ended", auctionName);
    delete reminderJobs[auctionId];
  });
}

// 4 minutes
function scheduleAuctionSoonEndReminder(auctionId: string, auctionName: string, reminderDate: Date) {
  return reminderDate.getTime() - (4 * 60 * 1000) >= 0
    ? schedule.scheduleJob(true ? new Date(new Date().getTime() + 30 * 1000) : new Date(reminderDate.getTime() - (4 * 60 * 1000)), () => {
        console.log("auction ending soon");
        getAllBidders(auctionId).then((allBiddersResult) => {
          allBiddersResult.rows.forEach((row) => {
            io.to(row.bidder_id).emit("auction_ending_soon", auctionName);
          });
        });
        delete reminderJobs[auctionId].auctionSoonEnd;
      })
    : null;
}

export async function postBidNotification(req: Request, res: Response, body: any) {
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

  const outbidBidder: Bid = 
     {
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
  ;

  const auction = camelize(
    await pool.query<{
      auctioneerId: number;
      name: string
    }>(
      `SELECT auctioneer_id, name
       FROM auction
       WHERE auction_id = $1`,
      [body.auctionId]
    )
  ).rows[0];

  //Why is there a red line here?
  console.log("auctioneer id: " + auction.auctioneerId);

  io.to(outbidBidder.bidder.accountId).emit("auction_outbidded", auction.name);
  io.to(auction.auctioneerId).emit("auction_recieved_bid", auction.name);
}

export async function postAuctionNotification(req: Request, res: Response, body: any) {
  const endDate = new Date(body.endTime);
  const reminderDate = moment(endDate).toDate();

  const auctionEndJob = scheduleBidEndReminder(body.auctionId, body.name, body.auctioneer.accountId, reminderDate);
  const auctionSoonEndJob = scheduleAuctionSoonEndReminder(body.auctionId, body.name, reminderDate);

  reminderJobs[body.auctionId] = {
    auctionEnd: auctionEndJob,
    auctionSoonEnd: auctionSoonEndJob,
  };
}

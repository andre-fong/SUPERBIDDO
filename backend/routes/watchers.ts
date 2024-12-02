import express, { Request } from "express";
import { BusinessError, ServerError, unauthorized } from "../utils/errors.js";
import { pool } from "../configServices/dbConfig.js";
import camelize from "camelize";

export const router = express.Router({ mergeParams: true });

router.post(
  "/",
  async (
    req: Request<
      {
        auctionId: string;
      },
      { watcherId: string },
      { watcherId: string },
      {}
    >,
    res
  ) => {
    const { watcherId } = req.body;
    const { auctionId } = req.params;

    if (req.session.accountId !== watcherId) {
      throw unauthorized();
    }

    const auctionOwner = camelize(
      await pool.query(
        `SELECT auctioneer_id
         FROM auction
         WHERE auction_id = $1 
         AND end_time > now()`,
        [auctionId]
      )
    ).rows;

    if (auctionOwner.length === 0) {
      throw new BusinessError(404, "Auction not found");
    }

    if (auctionOwner[0].auctioneerId === req.session.accountId) {
      throw new BusinessError(409, "Cannot watch own auction");
    }

    const watchingRecord = camelize(
      await pool
        .query<{ account_id: string; auction_id: string }>(
          `INSERT INTO watch (account_id, auction_id)
         VALUES ($1, $2)
         RETURNING *`,
          [watcherId, auctionId]
        )
        .catch((err) => {
          if (err.constraint === "watch_pk") {
            throw new BusinessError(409, "Already watching auction");
          }
          throw new ServerError(500, "Failed to watch auction");
        })
    ).rows[0];

    res.status(201).json({ watcherId: watchingRecord.accountId });
  }
);

router.delete(
  "/:watcherId",
  async (
    req: Request<
      {
        auctionId: string;
        watcherId: string;
      },
      {},
      {},
      {}
    >,
    res
  ) => {
    const { auctionId, watcherId } = req.params;

    if (req.session.accountId !== watcherId) {
      throw unauthorized();
    }

    const watchingRecord = camelize(
      await pool.query(
        `DELETE FROM watch
         WHERE account_id = $1 AND auction_id = $2
         RETURNING *`,
        [watcherId, auctionId]
      )
    ).rows;

    if (watchingRecord.length === 0) {
      throw new BusinessError(404, "Not watching auction");
    }

    res.status(204).end();
  }
);

router.get("/:auctionId/:accountId", async (req, res, next) => {
  const { auctionId, accountId } = req.params;

  if (req.session.accountId !== accountId) {
    throw unauthorized();
  }

  const watchingRecord = camelize(
    await pool.query(
      `SELECT auction_id
         FROM watch
         WHERE account_id = $1 
         AND auction_id = $2`,
      [accountId, auctionId]
    )
  ).rows;

  res.status(200).json(watchingRecord);
});

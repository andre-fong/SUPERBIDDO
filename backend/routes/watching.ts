
import express from 'express';
import { BusinessError, unauthorized } from '../utils/errors.js';
import { pool } from '../configServices/dbConfig.js';
import camelize from 'camelize';


export const router = express.Router();

//TODO: maybe types and validation
router.post('/', async (req, res, next) => {
    const { accountId, auctionId } = req.body;

    if (req.session.accountId !== accountId) {
        throw unauthorized();
    }

    const auctionOwner = camelize(
        await pool.query(
        `SELECT auctioneer_id
         FROM auction
         WHERE auction_id = $1`,
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
        await pool.query(
        `INSERT INTO watch (account_id, auction_id)
         VALUES ($1, $2)
         RETURNING *`,
        [accountId, auctionId]
      )
    ).rows;

    res.status(201).json(watchingRecord[0]);
});

router.delete('/:auctionId', async (req, res, next) => {
    const { accountId } = req.body;
    const { auctionId } = req.params;

    if (req.session.accountId !== accountId) {
        throw unauthorized();
    }

    const watchingRecord = camelize(
        await pool.query(
        `DELETE FROM watch
         WHERE account_id = $1 AND auction_id = $2
         RETURNING *`,
        [accountId, auctionId]
      )
    ).rows;

    if (watchingRecord.length === 0) {
        throw new BusinessError(404, "Not watching auction");
    }

    res.status(204).end();
});

router.get('/:auctionId/:accountId', async (req, res, next) => {
    const { auctionId, accountId } = req.params;

    if (req.session.accountId !== accountId) {
        throw unauthorized();
    }

    const watchingRecord = camelize(
        await pool.query(
        `SELECT auction_id
         FROM watch
         WHERE account_id = $1 AND auction_id = $2`,
        [accountId, auctionId]
      )
    ).rows;

    res.status(200).json(watchingRecord);
});
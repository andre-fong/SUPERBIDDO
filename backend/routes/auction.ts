import express from "express";
import { pool } from "../configServices/dbConfig.js";
import camelize from "camelize";
import * as dotenv from "dotenv";
import { sessionNotFound, invalidLogin } from "../utils/errors.js";

dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

export const router = express.Router();

router.get("/", async (req, res, next) => {
  if (!req.session.accountUid) {
    next(sessionNotFound);
    return;
  }
  req.session.touch();
  res.json(req.session);
});

router.post("/", async (req, res, next) => {
  // yaml definition of endpoint
  // post:
  //     summary: Create a new auction.
  //     requestBody:
  //       required: true
  //       content:
  //         application/json:
  //           schema:
  //             $ref: "#/components/schemas/Auction"
  //     responses:
  //       201:
  //         description: The newly created auction.
  //         content:
  //           application/json:
  //             schema:
  //               $ref: "#/components/schemas/Auction"
  //       400:
  //         $ref: "#/components/responses/BadRequest"
  //       401:
  //         $ref: "#/components/responses/Unauthorized"
  // components:
  //   schemas:
  //     Auction:
  //     type: object
  //     required:
  //       - auctionId
  //       - auctioneerId
  //       - name
  //       - startPrice
  //       - spread
  //       - startTime
  //       - endTime
  //       - currentPrice
  //     oneOf:
  //       - required:
  //           - cards
  //       - required:
  //           - bundle
  //     properties:
  //       auctionId:
  //         readOnly: true
  //         type: string
  //         format: uuid
  //       auctioneerId:
  //         type: string
  //         format: uuid
  //       name:
  //         type: string
  //         maxLength: 100
  //       description:
  //         type: string
  //         maxLength: 500
  //       startPrice:
  //         type: number
  //         format: float
  //         minimum: 0
  //       spread:
  //         type: number
  //         format: float
  //         minimum: 0
  //       startTime:
  //         type: string
  //         format: date-time
  //       endTime:
  //         type: string
  //         format: date-time
  //       currentPrice:
  //         readOnly: true
  //         type: number
  //         format: float
  //         minimum: 0
  //       cards:
  //         type: array
  //         items:
  //           $ref: "#/components/schemas/Card"
  //       bundle:
  //         $ref: "#/components/schemas/Bundle"
  //   Card:
  //     type: object
  //     required:
  //       - cardId
  //       - auctionId
  //       - game
  //       - name
  //       - manufacturer
  //       - quality
  //       - rarity
  //       - set
  //       - isFoil
  //   Bundle:
  //     type: object
  //     required:
  //       - bundleId
  //       - auctionId
  //       - game
  //       - name
  //       - manufacturer
  //       - set
  //     properties:
  //       bundleId:
  //         type: string
  //         format: uuid
  //       auctionId:
  //         type: string
  //         format: uuid
  //       game:
  //         type: string
  //         maxLength: 100
  //       name:
  //         type: string
  //         maxLength: 100
  //       description:
  //         type: string
  //         maxLength: 500
  //       manufacturer:
  //         type: string
  //         maxLength: 100
  //       set:
  //         type: string
  //         maxLength: 100

  // endpoint code
  const {
    auctioneerId,
    name,
    description,
    startPrice,
    spread,
    startTime,
    endTime,
    cards,
    bundle,
  } = req.body.auction;

  // can only post auctions for self
  if (auctioneerId !== req.session.accountUid) {
    next(invalidLogin);
    return;
  }

  await pool.query(`BEGIN`);
  const auctionRes = await camelize(
    pool.query(
      ` INSERT INTO auction (auctioneer_id, name, description, start_price, spread, start_time, end_time)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
      [auctioneerId, name, description, startPrice, spread, startTime, endTime]
    )
  ).rows[0];

  const isBundle = cards ? false : true;

  if (isBundle) {
    const bundleRes = await pool.query(
      ` INSERT INTO bundle (auction_id, game, name, manufacturer, set)
        VALUES ($1, $2, $3, $4, $5)`,
      [
        auctionRes.auctionId,
        bundle.game,
        bundle.name,
        bundle.manufacturer,
        bundle.set,
      ]
    ).rows[0];
    await pool.query(`COMMIT`);
    res.status(201).json({ ...auctionRes, bundle: bundleRes });
    return;
  }

  const valuesString = cards
    .map(
      (_, idx) =>
        `($${idx * 8 + 1}, $${idx * 8 + 2}, $${idx * 8 + 3}, $${
          idx * 8 + 4
        }, $${idx * 8 + 5}, $${idx * 8 + 6}, $${idx * 8 + 7}, $${idx * 8 + 8})`
    )
    .join(", ");
  // insert all cards in one db query still using camelize and db params
  // ex. if 2 cards, values = ($1, $2, $3, $4, $5, $6, $7, $8), ($9, $10, $11, $12, $13, $14, $15, $16);
  // const cardsRes = camelize(
  //   await pool.query(
  //     ` INSERT INTO card (auction_id, game, name, manufacturer, quality, rarity, set, is_foil)
  //       VALUES ${valuesString}
  //       RETURNING *`,
  //     cards.reduce((acc, card) => acc.push(...card), [])
  //   )
});

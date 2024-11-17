import express from "express";
import { pool } from "../configServices/dbConfig.js";
import camelize from "camelize";
import {
  sessionNotFound,
  unauthorized,
  ServerError,
  BusinessError,
} from "../utils/errors.js";

export const router = express.Router();

router.get("/:auctionId", async (req, res) => {
  const auctionId = req.params.auctionId;

  // get auction record
  const auctionRecord = camelize(
    await pool.query<AuctionDb & BidDb & { is_bundle: boolean }>(
      ` SELECT auction.*, top_bid.bid_id, top_bid.bidder_id, top_bid.amount, 
        top_bid.timestamp, COALESCE(is_bundle.is_bundle, FALSE) AS is_bundle
        FROM auction
        LEFT JOIN (
          SELECT *
          FROM bid
          WHERE auction_id = $1
          ORDER BY timestamp DESC
          LIMIT 1
        ) top_bid USING (auction_id)
        LEFT JOIN (
          SELECT auction_id, true as is_bundle
          FROM bundle
          WHERE auction_id = $1
        ) is_bundle USING (auction_id)
        WHERE auction_id = $1`,
      [auctionId]
    )
  ).rows[0];

  if (!auctionRecord) {
    throw new BusinessError(404, "Auction not found");
  }

  if (auctionRecord.isBundle) {
    const bundleRecord = camelize(
      await pool.query<BundleDb>(
        ` SELECT *
          FROM bundle
          WHERE auction_id = $1`,
        [auctionId]
      )
    ).rows[0];

    // bundle should exist based on auctionRecord.is_bundle
    if (!bundleRecord) {
      throw new ServerError(500, "Error fetching auction");
    }

    const auction: Auction = {
      auctionId: auctionRecord.auctionId,
      auctioneerId: auctionRecord.auctioneerId,
      name: auctionRecord.name,
      description: auctionRecord.description,
      startPrice: auctionRecord.startPrice,
      spread: auctionRecord.spread,
      startTime: auctionRecord.startTime,
      endTime: auctionRecord.endTime,
      currentPrice: auctionRecord.currentPrice,
      topBid: auctionRecord.bidId
        ? {
            bidId: auctionRecord.bidId,
            auctionId: auctionRecord.auctionId,
            bidderId: auctionRecord.bidderId,
            amount: auctionRecord.amount,
            timestamp: auctionRecord.timestamp,
          }
        : null,
      bundle: bundleRecord,
    };
    res.json(auction);
    return;
  }

  const cardsRecords = camelize(
    await pool.query<CardDb>(
      ` SELECT *
        FROM card
        WHERE auction_id = $1`,
      [auctionId]
    )
  ).rows;

  // cards should exist based on !auctionRecord.is_bundle
  if (!cardsRecords) {
    throw new ServerError(500, "Error fetching auction");
  }

  const auction: Auction = {
    auctionId: auctionRecord.auctionId,
    auctioneerId: auctionRecord.auctioneerId,
    name: auctionRecord.name,
    description: auctionRecord.description,
    startPrice: auctionRecord.startPrice,
    spread: auctionRecord.spread,
    startTime: auctionRecord.startTime,
    endTime: auctionRecord.endTime,
    currentPrice: auctionRecord.currentPrice,
    topBid: auctionRecord.bidId
      ? {
          bidId: auctionRecord.bidId,
          auctionId: auctionRecord.auctionId,
          bidderId: auctionRecord.bidderId,
          amount: auctionRecord.amount,
          timestamp: auctionRecord.timestamp,
        }
      : null,
    cards: cardsRecords,
  };

  res.json(auction);
});

router.post("/", async (req, res) => {
  const auctionInput: AuctionInput = req.body;

  // can only post auctions for self
  // if (auctionInput.auctioneerId !== req.session.accountId) {
  //   throw unauthorized();
  // }

  // validate context dependent fields
  // (openapi cannot define fields based on other fields)

  // must start in the future
  if (new Date(auctionInput.startTime).getTime() < Date.now()) {
    throw new BusinessError(
      400,
      "Invalid auction start time",
      "Auction must start in the future"
    );
  }

  // must last at least 5 minutes
  if (
    new Date(auctionInput.endTime).getTime() -
      new Date(auctionInput.startTime).getTime() <
    5 * 60 * 1000
  ) {
    throw new BusinessError(
      400,
      "Invalid auction end time",
      "Auction must last at least 5 minutes"
    );
  }

  // use transaction to rollback if any insert fails
  await pool.query(`BEGIN`);
  // insert auction first since cards/bundle reference auction
  const auctionRecord = camelize(
    await pool.query<AuctionDb>(
      ` INSERT INTO auction (auctioneer_id, name, description, start_price, spread, start_time, end_time)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
      [
        auctionInput.auctioneerId,
        auctionInput.name,
        auctionInput.description,
        auctionInput.startPrice,
        auctionInput.spread,
        auctionInput.startTime,
        auctionInput.endTime,
      ]
    )
  ).rows[0];

  // if auction insert fails, rollback
  if (!auctionRecord) {
    await pool.query(`ROLLBACK`);
    console.error("Error inserting auction into database");
    throw new ServerError(500, "Error creating auction");
  }

  // openapi schema ensures exactly one of cards/bundle is present
  const isBundle = auctionInput.cards ? false : true;

  if (isBundle) {
    const bundleInput = auctionInput.bundle;
    const bundleRecord = camelize(
      await pool.query<BundleDb>(
        ` INSERT INTO bundle (auction_id, game, name, description, manufacturer, set)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *`,
        [
          auctionRecord.auctionId,
          bundleInput.game,
          bundleInput.name,
          bundleInput.description,
          bundleInput.manufacturer,
          bundleInput.set,
        ]
      )
    ).rows[0];

    // if bundle insert fails, rollback
    if (!bundleRecord) {
      await pool.query(`ROLLBACK`);
      console.error("Error inserting bundle into database");
      throw new ServerError(500, "Error creating auction - bundle");
    }

    await pool.query(`COMMIT`);

    const auction: Auction = {
      ...auctionRecord,
      topBid: null,
      bundle: bundleRecord,
    };

    res.status(201).json(auction);
    return;
  }

  // openapi schema ensures exactly one of cards/bundle is present
  const cardsInput = auctionInput.cards;

  // generate string of variables ($1, $2, ... $9), ($10, $11, ... $18) ... for query
  const valuesString = cardsInput
    .map(
      (_, i) =>
        `(${Array.from({ length: 9 }, (_, j) => `$${i * 9 + j + 1}`).join(
          ", "
        )})`
    )
    .join(", ");

  const cardsRecord = camelize(
    await pool.query<CardDb>(
      ` INSERT INTO card (auction_id, game, name, description, manufacturer, quality, rarity, set, is_foil)
        VALUES ${valuesString}
        RETURNING *`,
      cardsInput.flatMap((card) => [
        auctionRecord.auctionId,
        card.game,
        card.name,
        card.description,
        card.manufacturer,
        card.quality,
        card.rarity,
        card.set,
        card.isFoil,
      ])
    )
  ).rows;

  // if card insert fails, rollback
  if (!cardsRecord) {
    await pool.query(`ROLLBACK`);
    console.error("Error inserting cards into database");
    throw new ServerError(500, "Error creating auction - cards");
  }

  await pool.query(`COMMIT`);

  const auction: Auction = {
    ...auctionRecord,
    topBid: null,
    cards: cardsRecord,
  };

  res.status(201).json(auction);
});

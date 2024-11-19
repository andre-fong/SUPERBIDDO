import express from "express";
import { pool } from "../configServices/dbConfig.js";
import camelize from "camelize";
import { unauthorized, ServerError, BusinessError } from "../utils/errors.js";

export const router = express.Router();

router.get("/:auctionId", async (req, res) => {
  const auctionId = req.params.auctionId;

  // get auction record
  const auctionRecord = camelize(
    await pool.query<
      AuctionDb &
        BidDb & { auctioneer_username: string; auctioneer_email: string } & {
          bidder_username: string;
          bidder_email: string;
        } & {
          num_bids: string;
          is_bundle: boolean;
        }
    >(
      ` WITH bid_agg AS (
          SELECT MAX(amount) AS max_bid_amount, COUNT(*) AS num_bids, auction_id
          FROM bid
          WHERE auction_id = $1
          GROUP BY auction_id
        ),
        filled_auction AS (
          SELECT auction.auction_id, account.account_id as auctioneer_id, 
          account.username as auctioneer_username, 
          account.email as auctioneer_email, auction.name, auction.description,
          auction.start_price, auction.spread, auction.start_time, 
          auction.end_time
        FROM auction
          JOIN account ON account.account_id = auction.auctioneer_id
          WHERE auction_id = $1
        ),
        top_bid AS (
          SELECT bid.bid_id, bid.bidder_id, 
          account.username as bidder_username, account.email as bidder_email,
          bid.amount, bid.timestamp
          FROM bid
          JOIN account ON account.account_id = bid.bidder_id
          WHERE auction_id = $1
          AND bid.amount = (SELECT max_bid_amount FROM bid_agg)
        )
        SELECT filled_auction.*, top_bid.*, 
        COALESCE(bid_agg.num_bids, 0) as num_bids, is_bundle.is_bundle
        FROM filled_auction
        LEFT JOIN top_bid ON true
        LEFT JOIN bid_agg USING (auction_id)
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
      auctioneer: {
        accountId: auctionRecord.auctioneerId,
        username: auctionRecord.auctioneerUsername,
        email: auctionRecord.auctioneerEmail,
      },
      name: auctionRecord.name,
      description: auctionRecord.description,
      startPrice: parseFloat(auctionRecord.startPrice),
      spread: parseFloat(auctionRecord.spread),
      minNewBidPrice: auctionRecord.bidId
        ? parseFloat(auctionRecord.amount) + parseFloat(auctionRecord.spread)
        : parseFloat(auctionRecord.startPrice) +
          parseFloat(auctionRecord.spread),
      startTime: auctionRecord.startTime,
      endTime: auctionRecord.endTime,
      topBid: auctionRecord.bidId
        ? {
            bidId: auctionRecord.bidId,
            auctionId: auctionRecord.auctionId,
            bidder: {
              accountId: auctionRecord.bidderId,
              username: auctionRecord.bidderUsername,
              email: auctionRecord.bidderEmail,
            },
            amount: parseFloat(auctionRecord.amount),
            timestamp: auctionRecord.timestamp,
          }
        : null,
      numBids: parseInt(auctionRecord.numBids),
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
    auctioneer: {
      accountId: auctionRecord.auctioneerId,
      username: auctionRecord.auctioneerUsername,
      email: auctionRecord.auctioneerEmail,
    },
    name: auctionRecord.name,
    description: auctionRecord.description,
    startPrice: parseFloat(auctionRecord.startPrice),
    spread: parseFloat(auctionRecord.spread),
    minNewBidPrice: auctionRecord.bidId
      ? parseFloat(auctionRecord.amount) + parseFloat(auctionRecord.spread)
      : parseFloat(auctionRecord.startPrice) + parseFloat(auctionRecord.spread),
    startTime: auctionRecord.startTime,
    endTime: auctionRecord.endTime,
    topBid: auctionRecord.bidId
      ? {
          bidId: auctionRecord.bidId,
          auctionId: auctionRecord.auctionId,
          bidder: {
            accountId: auctionRecord.bidderId,
            username: auctionRecord.bidderUsername,
            email: auctionRecord.bidderEmail,
          },
          amount: parseFloat(auctionRecord.amount),
          timestamp: auctionRecord.timestamp,
        }
      : null,
    numBids: parseInt(auctionRecord.numBids),
    cards: cardsRecords,
  };

  res.json(auction);
});

router.post("/", async (req, res) => {
  const auctionInput: AuctionInput = req.body;

  // can only post auctions for self
  if (auctionInput.auctioneerId !== req.session.accountId) {
    throw unauthorized();
  }

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

  const auctioneerRecord = camelize(
    await pool.query<AccountDb>(
      ` SELECT username, email
        FROM account
        WHERE account_id = $1`,
      [auctionInput.auctioneerId]
    )
  ).rows[0];

  if (!auctioneerRecord) {
    await pool.query(`ROLLBACK`);
    console.error("Error fetching auctioneer");
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
      auctionId: auctionRecord.auctionId,
      auctioneer: {
        accountId: auctionRecord.auctioneerId,
        username: auctioneerRecord.username,
        email: auctioneerRecord.email,
      },
      name: auctionRecord.name,
      description: auctionRecord.description,
      startPrice: parseFloat(auctionRecord.startPrice),
      spread: parseFloat(auctionRecord.spread),
      minNewBidPrice:
        parseFloat(auctionRecord.startPrice) + parseFloat(auctionRecord.spread),
      startTime: auctionRecord.startTime,
      endTime: auctionRecord.endTime,
      topBid: null,
      numBids: 0,
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
    auctionId: auctionRecord.auctionId,
    auctioneer: {
      accountId: auctionRecord.auctioneerId,
      username: auctioneerRecord.username,
      email: auctioneerRecord.email,
    },
    name: auctionRecord.name,
    description: auctionRecord.description,
    startPrice: parseFloat(auctionRecord.startPrice),
    spread: parseFloat(auctionRecord.spread),
    minNewBidPrice:
      parseFloat(auctionRecord.startPrice) + parseFloat(auctionRecord.spread),
    startTime: auctionRecord.startTime,
    endTime: auctionRecord.endTime,
    topBid: null,
    numBids: 0,
    cards: cardsRecord,
  };

  res.status(201).json(auction);
});

import express from "express";
import { pool } from "../configServices/dbConfig.js";
import camelize from "camelize";
import { unauthorized, ServerError, BusinessError } from "../utils/errors.js";
import { addLpClient } from "../longPolling/longPolling.js";

export const router = express.Router();

router.get("/", async (req, res) => {
  const {
    auctioneerId,
    bidderId,
    savedBy,
    name,
    minMinNewBidPrice,
    maxMinNewBidPrice,
    minStartTime,
    maxStartTime,
    minEndTime,
    maxEndTime,
    cardGame,
    cardName,
    cardManufacturer,
    cardQuality,
    cardRarity,
    cardSet,
    cardIsFoil,
    bundleGame,
    bundleName,
    bundleManufacturer,
    bundleSet,
    isBundle,
    sortBy,
    page = "1",
    pageSize = "20",
  } = req.query as {
    auctioneerId: string;
    bidderId: string;
    savedBy: string;
    name: string;
    minMinNewBidPrice: string;
    maxMinNewBidPrice: string;
    minStartTime: string;
    maxStartTime: string;
    minEndTime: string;
    maxEndTime: string;
    cardGame: string | string[];
    cardName: string | string[];
    cardManufacturer: string | string[];
    cardQuality: string | string[];
    cardRarity: string | string[];
    cardSet: string | string[];
    cardIsFoil: string;
    bundleGame: string | string[];
    bundleName: string | string[];
    bundleManufacturer: string | string[];
    bundleSet: string | string[];
    isBundle: string;
    sortBy: string;
    page: string;
    pageSize: string;
  };

  const conditions = [];
  const values = [];

  function addCondition(sqlTemplate: string, value: string | string[]) {
    if (!value) {
      return;
    }
    if (!Array.isArray(value)) {
      conditions.push(sqlTemplate.replace(/\?/g, `$${values.length + 1}`));
      values.push(value);
      return;
    }
    const orConditions = value.map((_, i) =>
      sqlTemplate.replace(/\?/g, `$${values.length + i + 1}`)
    );
    conditions.push(`(${orConditions.join(" OR ")})`);
    values.push(...value);
  }

  addCondition(`auctioneer_id = ?`, auctioneerId);
  addCondition(
    `auction_id IN (SELECT auction_id FROM bid WHERE bidder_id = ?)`,
    bidderId
  );
  addCondition(
    `auction_id IN (SELECT auction_id FROM saved_auction WHERE account_id = ?)`,
    savedBy
  );
  // TODO - search by name similarity
  // addCondition(`name ILIKE ?`, `%${name}%`);
  // auction_id in auctions where the max bid is high enough OR the start price is high enough
  addCondition(
    `auction_id IN (
      (SELECT auction_id FROM bid GROUP BY auction_id HAVING MAX(amount) >= ? - spread)
      UNION 
      (SELECT auction_id FROM auction WHERE start_price >= ? - spread)
    )`,
    minMinNewBidPrice
  );
  addCondition(
    `auction_id NOT IN (
      (SELECT auction_id FROM bid GROUP BY auction_id HAVING MAX(amount) >= ? - spread)
      UNION 
      (SELECT auction_id FROM auction WHERE start_price >= ? - spread)
    )`,
    maxMinNewBidPrice
  );
  addCondition(`start_time >= ?`, minStartTime);
  addCondition(`start_time <= ?`, maxStartTime);
  addCondition(`end_time >= ?`, minEndTime);
  addCondition(`end_time <= ?`, maxEndTime);
  addCondition(
    `auction_id IN (SELECT auction_id FROM card WHERE game = ?)`,
    cardGame
  );
  addCondition(
    `auction_id IN (SELECT auction_id FROM card WHERE name = ?)`,
    cardName
  );
  addCondition(
    `auction_id IN (SELECT auction_id FROM card WHERE manufacturer = ?)`,
    cardManufacturer
  );
  addCondition(
    `auction_id IN (SELECT auction_id FROM card WHERE quality = ?)`,
    cardQuality
  );
  addCondition(
    `auction_id IN (SELECT auction_id FROM card WHERE rarity = ?)`,
    cardRarity
  );
  addCondition(
    `auction_id IN (SELECT auction_id FROM card WHERE set = ?)`,
    cardSet
  );
  addCondition(
    `auction_id IN (SELECT auction_id FROM card WHERE is_foil = ?)`,
    cardIsFoil
  );
  addCondition(
    `auction_id IN (SELECT auction_id FROM bundle WHERE game = ?)`,
    bundleGame
  );
  addCondition(
    `auction_id IN (SELECT auction_id FROM bundle WHERE name = ?)`,
    bundleName
  );
  addCondition(
    `auction_id IN (SELECT auction_id FROM bundle WHERE manufacturer = ?)`,
    bundleManufacturer
  );
  addCondition(
    `auction_id IN (SELECT auction_id FROM bundle WHERE set = ?)`,
    bundleSet
  );
  addCondition(`auction_id IN (SELECT auction_id FROM bundle)`, isBundle);

  const whereClause = conditions.length
    ? ` WHERE ${conditions.join(" AND ")}`
    : "";

  const orderBy = (() => {
    switch (sortBy) {
      case "startPriceAsc":
        return ` ORDER BY start_price ASC`;
      case "startPriceDesc":
        return ` ORDER BY start_price DESC`;
      case "currentBidAsc":
        return ` ORDER BY amount ASC NULLS FIRST`;
      case "currentBidDesc":
        return ` ORDER BY amount DESC NULLS LAST`;
      case "minNewBidPriceAsc":
        return ` ORDER BY (COALESCE(amount, start_price) + spread) ASC`;
      case "minNewBidPriceDesc":
        return ` ORDER BY (COALESCE(amount, start_price) + spread) DESC`;
      case "startTimeAsc":
        return ` ORDER BY start_time ASC`;
      case "startTimeDesc":
        return ` ORDER BY start_time DESC`;
      case "endTimeAsc":
        return ` ORDER BY end_time ASC`;
      case "endTimeDesc":
        return ` ORDER BY end_time DESC`;
      default:
        return "";
    }
  })();

  const limit = ` LIMIT $${values.length + 1}`;
  values.push(parseInt(pageSize));
  const offset = ` OFFSET $${values.length + 1}`;
  values.push((parseInt(page) - 1) * parseInt(pageSize));

  const auctionRecords = camelize(
    await pool.query<
      AuctionDb &
        BidDb & { auctioneer_username: string; auctioneer_email: string } & {
          bidder_username: string;
          bidder_email: string;
        } & {
          num_bids: string;
          is_bundle: boolean;
        } & { cards: CardDb[] } & { bundle: BundleDb }
    >(
      ` WITH bid_agg AS (
          SELECT MAX(amount) AS max_bid_amount, COUNT(*) AS num_bids, auction_id
          FROM bid
          GROUP BY auction_id
        ),
        filled_auctions AS (
          SELECT auction.auction_id, account.account_id as auctioneer_id, 
          account.username as auctioneer_username, 
          account.email as auctioneer_email, auction.name, auction.description,
          auction.start_price, auction.spread, auction.start_time, 
          auction.end_time
          FROM auction
          JOIN account ON account.account_id = auction.auctioneer_id
        ),
        top_bids AS (
          SELECT bid.bid_id, bid.auction_id, bid.bidder_id, 
          account.username as bidder_username, account.email as bidder_email,
          bid.amount, bid.timestamp
          FROM bid
          JOIN account ON account.account_id = bid.bidder_id
          WHERE bid.amount = (SELECT max_bid_amount FROM bid_agg WHERE auction_id = bid.auction_id)
        ),
        cards_agg AS (
          SELECT auction_id, JSON_AGG(card.*) as cards
          FROM card
          GROUP BY auction_id
        ),
        bundle_agg AS (
          SELECT auction_id, JSON_AGG(bundle.*) as bundle
          FROM bundle
          GROUP BY auction_id
        )
        SELECT filled_auctions.*, top_bids.bid_id, top_bids.bidder_id, 
        top_bids.bidder_username, top_bids.bidder_email, top_bids.amount, top_bids.timestamp,
        COALESCE(bid_agg.num_bids, 0) as num_bids, is_bundle.is_bundle,
        cards_agg.cards, bundle_agg.bundle
        FROM filled_auctions
        LEFT JOIN top_bids USING (auction_id)
        LEFT JOIN bid_agg USING (auction_id)
        LEFT JOIN (
          SELECT auction_id, true as is_bundle
          FROM bundle
        ) is_bundle USING (auction_id)
        LEFT JOIN cards_agg USING (auction_id)
        LEFT JOIN bundle_agg USING (auction_id)
        ${whereClause}
        ${orderBy}
        ${limit}
        ${offset}
        `,
      values
    )
  ).rows;

  const auctions: Auction[] = auctionRecords.map((auctionRecord) => {
    if (auctionRecord.isBundle) {
      const bundleRecord = auctionRecord.bundle[0];
      const bundle: Bundle = {
        bundleId: bundleRecord.bundleId,
        game: bundleRecord.game,
        name: bundleRecord.name,
        description: bundleRecord.description,
        manufacturer: bundleRecord.manufacturer,
        set: bundleRecord.set,
      };

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
        bundle: bundle,
      };
      return auction;
    }

    const cardsRecords = auctionRecord.cards;
    const cards: Card[] = cardsRecords.map((cardRecord) => {
      const card: Card = {
        cardId: cardRecord.cardId,
        game: cardRecord.game,
        name: cardRecord.name,
        description: cardRecord.description,
        manufacturer: cardRecord.manufacturer,
        quality: cardRecord.quality,
        rarity: cardRecord.rarity,
        set: cardRecord.set,
        isFoil: cardRecord.isFoil,
      };
      return card;
    });

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
      cards: cards,
    };
    return auction;
  });

  const totalNumAuctions = camelize(
    await pool.query<{ count: string }>(
      ` SELECT COUNT(*) FROM
      (SELECT auction_id FROM auction ${whereClause} LIMIT 1001)
      as count`,
      values.slice(0, values.length - 2)
    )
  ).rows[0].count;

  res.json({
    auctions: auctions,
    totalNumAuctions: parseInt(totalNumAuctions),
  });
});

router.get("/:auctionId", async (req, res) => {
  const auctionId = req.params.auctionId;

  // TODO can pass longPoll object of current state with more than just bid
  // and hold response if state matches entirely
  const longPollMaxBidId = req.query.longPollMaxBidId;

  if (longPollMaxBidId) {
    const currentMaxBidIdRecord = camelize(
      await pool.query<{ bid_id: string }>(
        `SELECT bid_id FROM bid WHERE auction_id = $1 ORDER BY amount DESC LIMIT 1`,
        [auctionId]
      )
    ).rows[0];

    // no bids on auction or no auction
    if (!currentMaxBidIdRecord) {
      const auctionRecord = camelize(
        await pool.query<AuctionDb>(
          `SELECT * FROM auction WHERE auction_id = $1`,
          [auctionId]
        )
      ).rows[0];

      if (!auctionRecord) {
        throw new BusinessError(404, "Auction not found");
      }

      // no bids on auction - poll if client state is no bids
      if (longPollMaxBidId === "null") {
        addLpClient(auctionId, res);
        return;
      }

      // bid id provided is not a bid
      throw new BusinessError(404, "Bid not found");
    }
    // auction exists and has bids
    const currentMaxBidId = currentMaxBidIdRecord.bidId;
    const pollUpdateReady = longPollMaxBidId !== currentMaxBidId;

    if (!pollUpdateReady) {
      // add client to auctionClients
      addLpClient(auctionId, res);
      return;
    }
  }

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

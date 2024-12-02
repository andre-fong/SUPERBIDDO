import express from "express";
import { pool } from "../configServices/dbConfig.js";
import camelize from "camelize";
import { unauthorized, ServerError, BusinessError } from "../utils/errors.js";
import { addLpClient } from "../longPolling/longPolling.js";
import {
  postAuctionNotification,
  notificationMiddleware,
  deleteAuctionNotification,
  patchAuctionNotification,
} from "../middlewares/notifications.js";
import { getPriceRangeBounds } from "../utils/recommendations/userActions.js";
import { deleteImage, generateImageName, preserveImage } from "./images.js";

export const router = express.Router();

router.get("/", async (req, res) => {
  const {
    recommendedFor,
    includeBidStatusFor,
    includeWatchingFor,
    auctioneerId,
    watchedBy,
    name,
    minMinNewBidPrice,
    maxMinNewBidPrice,
    minStartTime,
    maxStartTime,
    minEndTime,
    maxEndTime,
    auctionStatus,
    bidStatus,
    cardGame,
    cardName,
    cardManufacturer,
    cardQualityUngraded: cardQualityUngradedQ,
    minCardQualityPsa: minCardQualityPsaQ,
    maxCardQualityPsa: maxCardQualityPsaQ,
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
    recommendedFor: string;
    includeBidStatusFor: string;
    includeWatchingFor: string;
    auctioneerId: string;
    bidderId: string;
    watchedBy: string;
    name: string;
    minMinNewBidPrice: string;
    maxMinNewBidPrice: string;
    minStartTime: string;
    maxStartTime: string;
    minEndTime: string;
    maxEndTime: string;
    auctionStatus: string;
    bidStatus: string;
    cardGame: string | string[];
    cardName: string | string[];
    cardManufacturer: string | string[];
    cardQualityUngraded: string | string[];
    minCardQualityPsa: string;
    maxCardQualityPsa: string;
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

  if (includeBidStatusFor && req.session.accountId !== includeBidStatusFor) {
    throw unauthorized();
  }

  if (includeWatchingFor && req.session.accountId !== includeWatchingFor) {
    throw unauthorized();
  }

  // idea: when adding where clause for one, union with all cards of other
  // quality type. If the other wasn't passed, we want to block these, so if
  // it wasn't passed, set it to something that will make that where clause
  // get nothing (except the union with all of the other type)
  // :vomit: but it works

  const cardQualityUngraded =
    !cardQualityUngradedQ && !(!minCardQualityPsaQ && !maxCardQualityPsaQ)
      ? "impossible"
      : cardQualityUngradedQ;
  const minCardQualityPsa =
    cardQualityUngradedQ && !minCardQualityPsaQ && !maxCardQualityPsaQ
      ? "10"
      : minCardQualityPsaQ;
  const maxCardQualityPsa =
    cardQualityUngradedQ && !minCardQualityPsaQ && !maxCardQualityPsaQ
      ? "0"
      : maxCardQualityPsaQ;

  const conditions = [];
  const values = [];
  const priceRangeConditions = [];

  function addCondition(sqlTemplate: string, value: string | string[]) {
    if (value === undefined) {
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

  function clearWhereConditions() {
    conditions.length = 0;
    values.length = 0;
    priceRangeConditions.length = 0;
  }

  function addPriceRangeConditions(priceRanges: PriceRange[]) {
    priceRanges.forEach((priceRange) => {
      const lowerBound = getPriceRangeBounds(priceRange)[0].toString();
      const upperBound = getPriceRangeBounds(priceRange)[1].toString();

      priceRangeConditions.push(
        ` (auction_id IN (
            (SELECT auction_id FROM bid GROUP BY auction_id HAVING MAX(amount) >= $${
              values.length + 1
            } - spread)
            UNION 
            (SELECT auction_id FROM auction WHERE start_price >= $${
              values.length + 1
            } - spread)
          ) AND
          auction_id NOT IN (
            (SELECT auction_id FROM bid GROUP BY auction_id HAVING MAX(amount) >= $${
              values.length + 2
            } - spread)
            UNION
            (SELECT auction_id FROM auction WHERE start_price >= $${
              values.length + 2
            } - spread)
          ))`
      );
      values.push(lowerBound, upperBound);
    });
  }

  // return auctions based on user's viewing and bidding history using a
  // content-based recommendation system
  if (recommendedFor) {
    if (recommendedFor !== req.session.accountId) {
      throw unauthorized();
    }
    const approxNumAuctionsToReturn = 10;

    // top 3 most frequently viewed/bidded price ranges for each game
    const userActionData = camelize(
      await pool.query<UserActionDataDb>(
        ` WITH price_ranges AS (
            SELECT game,
              CASE
                WHEN price BETWEEN 0 AND 10 THEN 'zero_to_ten'
                WHEN price BETWEEN 10 AND 25 THEN 'ten_to_twenty_five'
                WHEN price BETWEEN 25 AND 50 THEN 'twenty_five_to_fifty'
                WHEN price BETWEEN 50 AND 100 THEN 'fifty_to_hundred'
                WHEN price BETWEEN 100 AND 300 THEN 'hundred_to_three_hundred'
                WHEN price BETWEEN 300 AND 1000 THEN 'three_hundred_to_thousand'
                WHEN price BETWEEN 1000 AND 5000 THEN 'thousand_to_five_thousand'
                WHEN price BETWEEN 5000 AND 10000 THEN 'five_thousand_to_ten_thousand'
                WHEN price > 10000 THEN 'ten_thousand_plus'
              END AS price_range,
              CASE
                WHEN action = 'bid' THEN 5
                WHEN action = 'view' THEN 1
              END AS action
            FROM recommendation
            WHERE account_id = $1
          ),
          game_rows AS (
            SELECT 
              game, 
              price_range, 
              SUM(action) as frequency
            FROM price_ranges
            GROUP BY game, price_range
          ),
          game_rows_ranked AS (
            SELECT 
              game, 
              price_range, 
              frequency,
              ROW_NUMBER() OVER (PARTITION BY game ORDER BY frequency DESC) as row_num
            FROM game_rows
          )
          SELECT game, price_range, frequency
          FROM game_rows_ranked
          WHERE row_num <= 3`,
        [recommendedFor]
      )
    ).rows;

    // need to parse frequency as it is a string
    const numMTGHits = userActionData
      .filter((row) => row.game === "MTG")
      .reduce((acc, row) => acc + parseInt(row.frequency), 0);
    const numPokemonHits = userActionData
      .filter((row) => row.game === "Pokemon")
      .reduce((acc, row) => acc + parseInt(row.frequency), 0);
    const numYugiohHits = userActionData
      .filter((row) => row.game === "Yugioh")
      .reduce((acc, row) => acc + parseInt(row.frequency), 0);
    const totalHits = numMTGHits + numPokemonHits + numYugiohHits;

    // calculate number of auctions to return for each game
    const numAuctionsToReturn = {
      MTG: Math.ceil((numMTGHits / totalHits) * approxNumAuctionsToReturn),
      Pokemon: Math.ceil(
        (numPokemonHits / totalHits) * approxNumAuctionsToReturn
      ),
      Yugioh: Math.ceil(
        (numYugiohHits / totalHits) * approxNumAuctionsToReturn
      ),
    };

    // if user has no viewing/bidding history, return 3 random auctions for each game
    if (totalHits === 0) {
      numAuctionsToReturn.MTG = 3;
      numAuctionsToReturn.Pokemon = 3;
      numAuctionsToReturn.Yugioh = 3;
    }

    const auctionRecords: {
      auctionId: string;
      auctioneerId: string;
      auctioneerUsername: string;
      auctioneerEmail: string;
      auctioneerAddressFormatted?: string;
      auctioneerLatitude?: number;
      auctioneerLongitude?: number;
      name: string;
      description: string;
      startPrice: string;
      spread: string;
      startTime: Date;
      endTime: Date;
      bidId: string;
      bidderId: string;
      bidderUsername: string;
      bidderEmail: string;
      amount: string;
      timestamp: Date;
      numBids: string;
      isBundle: boolean;
      cards: {
        cardId: string;
        auctionId: string;
        game: Game;
        name: string;
        description: string;
        manufacturer: string;
        qualityUngraded: QualityUngraded;
        qualityPsa: QualityPsaDb;
        rarity: CardRarity<Game>;
        set: string;
        isFoil: boolean;
        imageUrl: string;
      }[];
      bundle: {
        bundleId: string;
        auctionId: string;
        game: Game;
        name: string;
        description: string;
        manufacturer: string;
        set: string;
        imageUrl: string;
      };
      auctionStatus: AuctionStatus;
      bidStatus?: BidStatus;
      watching?: boolean;
    }[] = [];

    for (const game of ["MTG", "Pokemon", "Yugioh"]) {
      clearWhereConditions();

      // limit auctions to those in the top 3 most frequently viewed/bidded
      addPriceRangeConditions(
        userActionData
          .filter((row) => row.game === game)
          .map((row) => row.priceRange)
      );

      // add filters for ongoing auctions, game
      addCondition(
        `CASE
          WHEN start_time <= NOW() AND end_time >= NOW() THEN 'Ongoing'
          ELSE 'Not ongoing'
        END = ?`,
        "Ongoing"
      );
      addCondition(
        `(auction_id IN (SELECT auction_id FROM card WHERE game = ?)
        OR auction_id IN (SELECT auction_id FROM bundle WHERE game = ?))`,
        game
      );

      const wherePriceRanges = priceRangeConditions.length
        ? ` WHERE (${priceRangeConditions.join(" OR ")})`
        : "";

      const whereClause = conditions.length
        ? priceRangeConditions.length > 0
          ? ` AND ${conditions.join(" AND ")}`
          : ` WHERE ${conditions.join(" AND ")}`
        : "";

      const limit = ` LIMIT $${values.length + 1}`;
      values.push(numAuctionsToReturn[game]);

      // QUERY START
      auctionRecords.push(
        ...camelize(
          await pool.query<
            AuctionDb &
              BidDb & {
                auctioneer_username: string;
                auctioneer_email: string;
                auctioneer_address_formatted?: string;
                auctioneer_latitude?: number;
                auctioneer_longitude?: number;
              } & {
                bidder_username: string;
                bidder_email: string;
              } & {
                num_bids: string;
                is_bundle: boolean;
              } & { cards: CardDb<Game>[] } & { bundle: BundleDb } & {
                auction_status: AuctionStatus;
              } & {
                bid_status?: BidStatus;
                watching?: boolean;
              }
          >(
            ` WITH bid_agg AS (
              SELECT MAX(amount) AS max_bid_amount, COUNT(*) AS num_bids, auction_id
              FROM bid
              GROUP BY auction_id
            ),
            filled_auction AS (
              SELECT auction.auction_id, account.account_id as auctioneer_id, 
              account.username as auctioneer_username, 
              account.email as auctioneer_email, 
              account.address_formatted as auctioneer_address_formatted,
              account.latitude as auctioneer_latitude,
              account.longitude as auctioneer_longitude,
              auction.name, auction.description,
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
            ),
            auction_status AS (
              SELECT auction_id,
              CASE
                WHEN start_time IS NULL THEN 'Not scheduled'
                WHEN end_time < NOW() THEN 
                  CASE 
                    WHEN (
                      SELECT COUNT(*) 
                      FROM bid 
                      WHERE auction_id = auction.auction_id
                      ) > 0 
                    THEN 'Successful' 
                    ELSE 'Unsuccessful' 
                  END
                WHEN start_time < NOW() THEN 'Ongoing'
                ELSE 'Scheduled'
              END AS auction_status
              FROM auction
            )
            SELECT filled_auction.*, top_bids.bid_id, top_bids.bidder_id, 
            top_bids.bidder_username, top_bids.bidder_email, top_bids.amount, top_bids.timestamp,
            COALESCE(bid_agg.num_bids, 0) as num_bids, COALESCE(is_bundle.is_bundle, false) as is_bundle,
            auction_status.auction_status,
            cards_agg.cards, bundle_agg.bundle
            ${
              includeWatchingFor
                ? `, auction_id IN (SELECT auction_id FROM watch WHERE account_id = $${
                    values.length + 1
                  }) as watching`
                : ""
            }
            FROM filled_auction
            LEFT JOIN top_bids USING (auction_id)
            LEFT JOIN bid_agg USING (auction_id)
            LEFT JOIN (
              SELECT auction_id, true as is_bundle
              FROM bundle
            ) is_bundle USING (auction_id)
            LEFT JOIN cards_agg USING (auction_id)
            LEFT JOIN bundle_agg USING (auction_id)
            LEFT JOIN auction_status USING (auction_id)
            ${wherePriceRanges}
            ${whereClause}
            ORDER BY num_bids DESC
            ${limit}
            `,
            [...values, ...(includeWatchingFor ? [includeWatchingFor] : [])]
          )
        ).rows
      );
    }

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
          imageUrl: bundleRecord.imageUrl,
        };

        const auction: Auction = {
          auctionId: auctionRecord.auctionId,
          auctioneer: {
            accountId: auctionRecord.auctioneerId,
            username: auctionRecord.auctioneerUsername,
            email: auctionRecord.auctioneerEmail,
            address: {
              addressFormatted: auctionRecord.auctioneerAddressFormatted,
              latitude: auctionRecord.auctioneerLatitude,
              longitude: auctionRecord.auctioneerLongitude,
            },
          },
          name: auctionRecord.name,
          description: auctionRecord.description,
          startPrice: parseFloat(auctionRecord.startPrice),
          spread: parseFloat(auctionRecord.spread),
          minNewBidPrice: auctionRecord.bidId
            ? parseFloat(auctionRecord.amount) +
              parseFloat(auctionRecord.spread)
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
          auctionStatus: auctionRecord.auctionStatus,
          bundle: bundle,
          ...(includeWatchingFor ? { watching: auctionRecord.watching } : {}),
        };
        return auction;
      }

      const cardsRecords = auctionRecord.cards;
      const cards: Card<Game>[] = cardsRecords.map((cardRecord) => {
        const card: Card<Game> = {
          cardId: cardRecord.cardId,
          game: cardRecord.game,
          name: cardRecord.name,
          description: cardRecord.description,
          manufacturer: cardRecord.manufacturer,
          ...(cardRecord.qualityUngraded
            ? { qualityUngraded: cardRecord.qualityUngraded }
            : { qualityPsa: parseInt(cardRecord.qualityPsa) as QualityPsa }),
          rarity: cardRecord.rarity,
          set: cardRecord.set,
          isFoil: cardRecord.isFoil,
          imageUrl: cardRecord.imageUrl,
        };
        return card;
      });

      const auction: Auction = {
        auctionId: auctionRecord.auctionId,
        auctioneer: {
          accountId: auctionRecord.auctioneerId,
          username: auctionRecord.auctioneerUsername,
          email: auctionRecord.auctioneerEmail,
          address: {
            addressFormatted: auctionRecord.auctioneerAddressFormatted,
            latitude: auctionRecord.auctioneerLatitude,
            longitude: auctionRecord.auctioneerLongitude,
          },
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
        auctionStatus: auctionRecord.auctionStatus,
        cards: cards,
        ...(includeWatchingFor ? { watching: auctionRecord.watching } : {}),
      };
      return auction;
    });

    // In this context, total num auctions means the total number of recommended auctions returned
    res.json({ auctions, totalNumAuctions: auctions.length });
    return;
  }
  // End of recommendation system

  const bidStatusCte = getBidStatusCte(includeBidStatusFor, values.length + 1);
  if (includeBidStatusFor) {
    values.push(includeBidStatusFor);
  }

  const watchingCte = getWatchingCte(includeWatchingFor, values.length + 1);
  if (includeWatchingFor) {
    values.push(includeWatchingFor);
  }

  addCondition(`auctioneer_id = ?`, auctioneerId);
  addCondition(
    `auction_id IN (SELECT auction_id FROM watch WHERE account_id = ?)`,
    watchedBy
  );
  // pg_trgm strict_word_similarity
  addCondition(`name <<% ?`, name);
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
    `CASE
      WHEN start_time IS NULL THEN 'Not scheduled'
      WHEN end_time < NOW() THEN 
        CASE 
          WHEN (
            SELECT COUNT(*) 
            FROM bid 
            WHERE auction_id = filled_auction.auction_id
            ) > 0 
          THEN 'Successful' 
          ELSE 'Unsuccessful' 
        END
      WHEN start_time < NOW() THEN 'Ongoing'
      ELSE 'Scheduled'
    END = ?`,
    auctionStatus
  );
  if (includeBidStatusFor) {
    addCondition(
      `auction_id IN (SELECT auction_id FROM (${bidStatusCte}) WHERE bid_status = ?)`,
      bidStatus
    );
  }
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
    `auction_id IN (SELECT auction_id FROM card WHERE quality_ungraded = ?
     UNION SELECT auction_id FROM card WHERE quality_psa IS NOT NULL)`,
    cardQualityUngraded
  );
  addCondition(
    `auction_id IN (SELECT auction_id FROM card WHERE quality_psa >= ?
     UNION SELECT auction_id FROM card WHERE quality_ungraded IS NOT NULL)`,
    minCardQualityPsa
  );
  addCondition(
    `auction_id IN (SELECT auction_id FROM card WHERE quality_psa <= ?
     UNION SELECT auction_id FROM card WHERE quality_ungraded IS NOT NULL)`,
    maxCardQualityPsa
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
  addCondition(`(auction_id IN (SELECT auction_id FROM bundle) = ?)`, isBundle);

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
      case "numBidsAsc":
        return ` ORDER BY num_bids ASC`;
      case "numBidsDesc":
        return ` ORDER BY num_bids DESC`;
      default:
        // if no sortBy and name is included, order by similarity
        if (name) {
          values.push(name);
          return ` ORDER BY name <<<-> $${values.length}`;
        }
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
        BidDb & {
          auctioneer_username: string;
          auctioneer_email: string;
          auctioneer_address_formatted?: string;
          auctioneer_latitude?: number;
          auctioneer_longitude?: number;
        } & {
          bidder_username: string;
          bidder_email: string;
        } & {
          num_bids: string;
          is_bundle: boolean;
        } & { cards: CardDb<Game>[] } & { bundle: BundleDb } & {
          auction_status: AuctionStatus;
        } & {
          bid_status?: BidStatus;
          watching?: boolean;
        }
    >(
      ` WITH bid_agg AS (
          SELECT MAX(amount) AS max_bid_amount, COUNT(*) AS num_bids, auction_id
          FROM bid
          GROUP BY auction_id
        ),
        filled_auction AS (
          SELECT auction.auction_id, account.account_id as auctioneer_id, 
          account.username as auctioneer_username, 
          account.email as auctioneer_email, 
          account.address_formatted as auctioneer_address_formatted,
          account.latitude as auctioneer_latitude,
          account.longitude as auctioneer_longitude,
          auction.name, auction.description,
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
        ),
        auction_status AS (
          SELECT auction_id,
          CASE
            WHEN start_time IS NULL THEN 'Not scheduled'
            WHEN end_time < NOW() THEN 
              CASE 
                WHEN (
                  SELECT COUNT(*) 
                  FROM bid 
                  WHERE auction_id = auction.auction_id
                  ) > 0 
                THEN 'Successful' 
                ELSE 'Unsuccessful' 
              END
            WHEN start_time < NOW() THEN 'Ongoing'
            ELSE 'Scheduled'
          END AS auction_status
          FROM auction
        ) ${includeBidStatusFor ? `, bid_status AS (${bidStatusCte})` : ""}
        ${includeWatchingFor ? `, watching AS (${watchingCte})` : ""}
        SELECT filled_auction.*, top_bids.bid_id, top_bids.bidder_id, 
        top_bids.bidder_username, top_bids.bidder_email, top_bids.amount, top_bids.timestamp,
        COALESCE(bid_agg.num_bids, 0) as num_bids, COALESCE(is_bundle.is_bundle, false) as is_bundle,
        auction_status.auction_status,
        cards_agg.cards, bundle_agg.bundle
        ${includeBidStatusFor ? `, bid_status.bid_status` : ""}
        ${includeWatchingFor ? `, watching.watching` : ""}
        FROM filled_auction
        LEFT JOIN top_bids USING (auction_id)
        LEFT JOIN bid_agg USING (auction_id)
        LEFT JOIN (
          SELECT auction_id, true as is_bundle
          FROM bundle
        ) is_bundle USING (auction_id)
        LEFT JOIN cards_agg USING (auction_id)
        LEFT JOIN bundle_agg USING (auction_id)
        LEFT JOIN auction_status USING (auction_id)
        ${includeBidStatusFor ? `LEFT JOIN bid_status USING (auction_id)` : ""}
        ${includeWatchingFor ? `LEFT JOIN watching USING (auction_id)` : ""}
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
        imageUrl: bundleRecord.imageUrl,
      };

      const auction: Auction = {
        auctionId: auctionRecord.auctionId,
        auctioneer: {
          accountId: auctionRecord.auctioneerId,
          username: auctionRecord.auctioneerUsername,
          email: auctionRecord.auctioneerEmail,
          address: {
            addressFormatted: auctionRecord.auctioneerAddressFormatted,
            latitude: auctionRecord.auctioneerLatitude,
            longitude: auctionRecord.auctioneerLongitude,
          },
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
        auctionStatus: auctionRecord.auctionStatus,
        ...(includeBidStatusFor ? { bidStatus: auctionRecord.bidStatus } : {}),
        ...(includeWatchingFor ? { watching: auctionRecord.watching } : {}),
        bundle: bundle,
      };
      return auction;
    }

    const cardsRecords = auctionRecord.cards;
    const cards: Card<Game>[] = cardsRecords.map((cardRecord) => {
      const card: Card<Game> = {
        cardId: cardRecord.cardId,
        game: cardRecord.game,
        name: cardRecord.name,
        description: cardRecord.description,
        manufacturer: cardRecord.manufacturer,
        ...(cardRecord.qualityUngraded
          ? { qualityUngraded: cardRecord.qualityUngraded }
          : { qualityPsa: parseInt(cardRecord.qualityPsa) as QualityPsa }),
        rarity: cardRecord.rarity,
        set: cardRecord.set,
        isFoil: cardRecord.isFoil,
        imageUrl: cardRecord.imageUrl,
      };
      return card;
    });

    const auction: Auction = {
      auctionId: auctionRecord.auctionId,
      auctioneer: {
        accountId: auctionRecord.auctioneerId,
        username: auctionRecord.auctioneerUsername,
        email: auctionRecord.auctioneerEmail,
        address: {
          addressFormatted: auctionRecord.auctioneerAddressFormatted,
          latitude: auctionRecord.auctioneerLatitude,
          longitude: auctionRecord.auctioneerLongitude,
        },
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
      auctionStatus: auctionRecord.auctionStatus,
      ...(includeBidStatusFor ? { bidStatus: auctionRecord.bidStatus } : {}),
      ...(includeWatchingFor ? { watching: auctionRecord.watching } : {}),
      cards: cards,
    };
    return auction;
  });

  const totalNumAuctions = camelize(
    await pool.query<{ count: string }>(
      ` ${includeBidStatusFor ? `WITH bid_status AS (${bidStatusCte})` : ""} 
      ${
        includeWatchingFor && includeBidStatusFor
          ? `, watched AS (${watchingCte})`
          : ""
      }  
      ${
        includeWatchingFor && !includeBidStatusFor
          ? `WITH watched AS (${watchingCte})`
          : ""
      }
      SELECT COUNT(*) FROM
      (SELECT auction_id FROM auction AS filled_auction ${whereClause} LIMIT 1001)
      as count`,
      // capped at 1001 to prevent large queries
      values.slice(
        0,
        values.length - 2 - (name && !sortBy ? 1 : 0) // exclude page, and pageSize (-2).
        // subtract 1 if name and not sortBy (ordered by name similarity by default, but no ordering here)
      )
    )
  ).rows[0].count;

  res.json({
    auctions: auctions,
    totalNumAuctions: parseInt(totalNumAuctions),
  });
});

router.get("/:auctionId", async (req, res) => {
  const auctionId = req.params.auctionId;

  const includeBidStatusFor = req.query.includeBidStatusFor as string;
  const includeWatchingFor = req.query.includeWatchingFor as string;

  if (includeBidStatusFor && req.session.accountId !== includeBidStatusFor) {
    throw unauthorized();
  }

  if (includeWatchingFor && req.session.accountId !== includeWatchingFor) {
    throw unauthorized();
  }

  const bidStatusCte = getBidStatusCte(includeBidStatusFor, 2);

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
        BidDb & {
          auctioneer_username: string;
          auctioneer_email: string;
          auctioneer_address_formatted?: string;
          auctioneer_latitude?: number;
          auctioneer_longitude?: number;
        } & {
          bidder_username: string;
          bidder_email: string;
        } & {
          num_bids: string;
          is_bundle: boolean;
        } & {
          auction_status: AuctionStatus;
        } & {
          bid_status?: BidStatus;
          watching?: boolean;
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
          account.email as auctioneer_email, 
          account.address_formatted as auctioneer_address_formatted,
          account.latitude as auctioneer_latitude,
          account.longitude as auctioneer_longitude,
          auction.name, auction.description,
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
        ), 
        auction_status AS (
          SELECT auction_id,
          CASE
            WHEN start_time IS NULL THEN 'Not scheduled'
            WHEN end_time < NOW() THEN 
              CASE 
                WHEN (
                  SELECT COUNT(*) 
                  FROM bid 
                  WHERE auction_id = auction.auction_id
                  ) > 0 
                THEN 'Successful' 
                ELSE 'Unsuccessful' 
              END
            WHEN start_time < NOW() THEN 'Ongoing'
            ELSE 'Scheduled'
          END AS auction_status
          FROM auction
        ) ${includeBidStatusFor ? `, bid_status AS (${bidStatusCte})` : ""}
        SELECT filled_auction.*, top_bid.*, 
        COALESCE(bid_agg.num_bids, 0) as num_bids, is_bundle.is_bundle,
        auction_status.auction_status
        ${includeBidStatusFor ? `, bid_status.bid_status` : ""}
        ${
          includeWatchingFor
            ? `, 
        auction_id IN (SELECT auction_id FROM watch WHERE account_id = $${
          includeBidStatusFor ? 3 : 2
        }) as watching`
            : ""
        }
        FROM filled_auction
        LEFT JOIN top_bid ON true
        LEFT JOIN bid_agg USING (auction_id)
        LEFT JOIN (
          SELECT auction_id, true as is_bundle
          FROM bundle
          WHERE auction_id = $1
        ) is_bundle USING (auction_id)
        LEFT JOIN auction_status USING (auction_id)
        ${includeBidStatusFor ? `LEFT JOIN bid_status USING (auction_id)` : ""}
        WHERE auction_id = $1`,
      [
        auctionId,
        ...(includeBidStatusFor
          ? includeWatchingFor
            ? [includeBidStatusFor, includeWatchingFor]
            : [includeBidStatusFor]
          : includeWatchingFor
          ? [includeWatchingFor]
          : []),
      ]
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
        address: {
          addressFormatted: auctionRecord.auctioneerAddressFormatted,
          latitude: auctionRecord.auctioneerLatitude,
          longitude: auctionRecord.auctioneerLongitude,
        },
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
      auctionStatus: auctionRecord.auctionStatus,
      ...(includeBidStatusFor ? { bidStatus: auctionRecord.bidStatus } : {}),
      ...(includeWatchingFor ? { watching: auctionRecord.watching } : {}),
      bundle: bundleRecord,
    };

    // if not long polling, add user action for viewing auction
    if (!longPollMaxBidId && req.session.accountId) {
      await pool.query<UserActionDb>(
        ` INSERT INTO recommendation (account_id, game, price, action)
          VALUES ($1, $2, $3, 'view')
          RETURNING *`,
        [req.session.accountId, auction.bundle.game, auction.minNewBidPrice]
      );
    }

    res.json(auction);
    return;
  }

  const cardsRecords = camelize(
    await pool.query<CardDb<Game>>(
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

  const cards: Card<Game>[] = cardsRecords.map((cardRecord) => {
    const card: Card<Game> = {
      cardId: cardRecord.cardId,
      game: cardRecord.game,
      name: cardRecord.name,
      description: cardRecord.description,
      manufacturer: cardRecord.manufacturer,
      ...(cardRecord.qualityUngraded
        ? { qualityUngraded: cardRecord.qualityUngraded }
        : { qualityPsa: parseInt(cardRecord.qualityPsa) as QualityPsa }),
      rarity: cardRecord.rarity,
      set: cardRecord.set,
      isFoil: cardRecord.isFoil,
      imageUrl: cardRecord.imageUrl,
    };
    return card;
  });

  const auction: Auction = {
    auctionId: auctionRecord.auctionId,
    auctioneer: {
      accountId: auctionRecord.auctioneerId,
      username: auctionRecord.auctioneerUsername,
      email: auctionRecord.auctioneerEmail,
      address: {
        addressFormatted: auctionRecord.auctioneerAddressFormatted,
        latitude: auctionRecord.auctioneerLatitude,
        longitude: auctionRecord.auctioneerLongitude,
      },
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
    auctionStatus: auctionRecord.auctionStatus,
    ...(includeBidStatusFor ? { bidStatus: auctionRecord.bidStatus } : {}),
    ...(includeWatchingFor ? { watching: auctionRecord.watching } : {}),
    cards: cards,
  };

  // if not long polling, add user action for viewing auction
  if (!longPollMaxBidId && req.session.accountId) {
    await pool.query<UserActionDb>(
      ` INSERT INTO recommendation (account_id, game, price, action)
        VALUES ($1, $2, $3, 'view')
        RETURNING *`,
      [req.session.accountId, auction.cards[0].game, auction.minNewBidPrice]
    );
  }

  res.json(auction);
});

router.patch(
  "/:auctionId",
  notificationMiddleware(patchAuctionNotification),
  async (req, res) => {
    const auctionId = req.params.auctionId;

    const auctionRecord = camelize(
      await pool.query<
        AuctionDb & { cards?: CardDb<Game>[]; bundle?: BundleDb }
      >(
        ` WITH cards_agg AS (
            SELECT auction_id, JSON_AGG(card.*) as cards
            FROM card 
            GROUP BY auction_id
          ),
          bundle_agg AS (
            SELECT auction_id, JSON_AGG(bundle.*) as bundle
            FROM bundle
            GROUP BY auction_id
          )
          SELECT *
          FROM auction
          LEFT JOIN cards_agg USING (auction_id)
          LEFT JOIN bundle_agg USING (auction_id)
          WHERE auction_id = $1`,
        [auctionId]
      )
    ).rows[0];

    if (!auctionRecord) {
      throw new BusinessError(404, "Auction not found");
    }

    if (
      !req.session.accountId ||
      auctionRecord.auctioneerId !== req.session.accountId
    ) {
      throw unauthorized();
    }

    if (
      auctionRecord.startTime &&
      new Date(auctionRecord.startTime).getTime() < Date.now()
    ) {
      throw new BusinessError(
        409,
        "Cannot modify auction",
        "Auction has already started"
      );
    }

    const newAuctionDetails = {
      auctionId: auctionId,
      name: req.body.name || auctionRecord.name,
      description: req.body.description || auctionRecord.description,
      startPrice:
        req.body.startPrice !== undefined
          ? req.body.startPrice
          : auctionRecord.startPrice,
      spread: req.body.spread || auctionRecord.spread,
      startTime:
        req.body.startTime !== undefined
          ? req.body.startTime
          : auctionRecord.startTime,
      endTime:
        req.body.endTime !== undefined
          ? req.body.endTime
          : auctionRecord.endTime,
    };

    const newCardDetails = auctionRecord.cards
      ? {
          cardId: auctionRecord.cards[0].cardId,
          cardName: req.body.cardName || auctionRecord.cards[0].name,
          cardDescription:
            req.body.cardDescription || auctionRecord.cards[0].description,
          cardManufacturer:
            req.body.cardManufacturer || auctionRecord.cards[0].manufacturer,
          cardQualityUngraded:
            req.body.cardQualityUngraded || req.body.cardQualityPsa
              ? req.body.cardQualityUngraded
              : auctionRecord.cards[0].qualityUngraded,
          cardQualityPsa:
            req.body.cardQualityPsa || req.body.cardQualityUngraded
              ? req.body.cardQualityPsa
              : auctionRecord.cards[0].qualityPsa,
          cardRarity: req.body.cardRarity || auctionRecord.cards[0].rarity,
          cardSet: req.body.cardSet || auctionRecord.cards[0].set,
          cardIsFoil:
            req.body.cardIsFoil !== undefined
              ? req.body.cardIsFoil
              : auctionRecord.cards[0].isFoil,
          cardGame: req.body.cardGame || auctionRecord.cards[0].game,
        }
      : null;

    const newBundleDetails = auctionRecord.bundle
      ? {
          bundleId: auctionRecord.bundle[0].bundleId,
          bundleName: req.body.bundleName || auctionRecord.bundle[0].name,
          bundleDescription:
            req.body.bundleDescription || auctionRecord.bundle[0].description,
          bundleManufacturer:
            req.body.bundleManufacturer || auctionRecord.bundle[0].manufacturer,
          bundleSet: req.body.bundleSet || auctionRecord.bundle[0].set,
          bundleGame: req.body.bundleGame || auctionRecord.bundle[0].game,
        }
      : null;

    if (
      newAuctionDetails.startTime &&
      new Date(newAuctionDetails.startTime).getTime() < Date.now()
    ) {
      throw new BusinessError(
        409,
        "Invalid auction start time",
        "Auction must start in the future"
      );
    }

    if (
      (newAuctionDetails.startTime && !newAuctionDetails.endTime) ||
      (!newAuctionDetails.startTime && newAuctionDetails.endTime)
    ) {
      throw new BusinessError(
        400,
        "Invalid auction start/end time",
        "Start and end time must both be provided or both be null"
      );
    }

    if (
      newAuctionDetails.startTime &&
      newAuctionDetails.endTime &&
      new Date(newAuctionDetails.endTime).getTime() -
        new Date(newAuctionDetails.startTime).getTime() <
        5 * 60 * 1000
    ) {
      throw new BusinessError(
        400,
        "Invalid auction start/end time",
        "Auction must last at least 5 minutes"
      );
    }

    if (
      newCardDetails &&
      newCardDetails.cardQualityPsa &&
      newCardDetails.cardQualityUngraded
    ) {
      throw new BusinessError(
        400,
        "Invalid card quality",
        "Cannot have both ungraded and PSA quality"
      );
    }

    switch (newCardDetails && newCardDetails.cardGame) {
      case "MTG": {
        const rarities = [
          "Common",
          "Uncommon",
          "Rare",
          "Mythic Rare",
          "Special / Bonus Cards",
          "Basic Land",
          "Masterpiece Series",
          "Promos",
          "Extended Art",
          "Borderless",
        ];
        if (!rarities.includes(newCardDetails.cardRarity)) {
          throw new BusinessError(
            400,
            "Invalid card rarity",
            "Invalid rarity for MTG card"
          );
        }
        break;
      }
      case "Pokemon": {
        const rarities = [
          "Common",
          "Uncommon",
          "Rare",
          "Holo Rare",
          "Reverse Holo",
          "Rare Holo V",
          "Ultra Rare",
          "Full Art",
          "Secret Rare",
          "Amazing Rare",
          "Rainbow Rare",
          "Gold Secret Rare",
          "Promos",
          "Radiant Collection",
        ];
        if (!rarities.includes(newCardDetails.cardRarity)) {
          throw new BusinessError(
            400,
            "Invalid card rarity",
            "Invalid rarity for Pokemon card"
          );
        }
        break;
      }
      case "Yugioh": {
        const rarities = [
          "Common",
          "Rare",
          "Super Rare",
          "Ultra Rare",
          "Secret Rare",
          "Ultimate Rare",
          "Ghost Rare",
          "Starlight Rare",
          "Collector's Rare",
          "Prismatic Secret Rare",
          "Parallel Rare",
          "Platinum Rare",
        ];
        if (!rarities.includes(newCardDetails.cardRarity)) {
          throw new BusinessError(
            400,
            "Invalid card rarity",
            "Invalid rarity for Yugioh card"
          );
        }
        break;
      }
    }

    // if one quality is provided, set the other to null
    if (newCardDetails && newCardDetails.cardQualityPsa) {
      newCardDetails.cardQualityUngraded = null;
    }

    if (newCardDetails && newCardDetails.cardQualityUngraded) {
      newCardDetails.cardQualityPsa = null;
    }

    const auctioneerRecord = camelize(
      await pool.query<AccountDb>(
        ` SELECT *
          FROM account
          WHERE account_id = $1`,
        [req.session.accountId]
      )
    ).rows[0];

    const auctioneer: Account & {
      address: Address;
    } = {
      accountId: auctioneerRecord.accountId,
      username: auctioneerRecord.username,
      email: auctioneerRecord.email,
      address: {
        addressFormatted: auctioneerRecord.addressFormatted,
        latitude: auctioneerRecord.latitude,
        longitude: auctioneerRecord.longitude,
      },
    };

    await pool.query(`BEGIN`);

    const updatedAuctionRecord = camelize(
      await pool.query<AuctionDb>(
        ` UPDATE auction
          SET name = $1, description = $2, start_price = $3, spread = $4, start_time = $5, end_time = $6
          WHERE auction_id = $7
          RETURNING *`,
        [
          newAuctionDetails.name,
          newAuctionDetails.description,
          newAuctionDetails.startPrice,
          newAuctionDetails.spread,
          newAuctionDetails.startTime,
          newAuctionDetails.endTime,
          auctionId,
        ]
      )
    ).rows[0];

    if (!updatedAuctionRecord) {
      await pool.query(`ROLLBACK`);
      throw new ServerError(500, "Error updating auction");
    }

    if (newCardDetails) {
      const updatedCardRecord = camelize(
        await pool.query<CardDb<Game>>(
          ` UPDATE card
            SET name = $1, description = $2, manufacturer = $3, quality_ungraded = $4, quality_psa = $5, rarity = $6, set = $7, is_foil = $8, game = $9
            WHERE card_id = $10
            RETURNING *`,
          [
            newCardDetails.cardName,
            newCardDetails.cardDescription,
            newCardDetails.cardManufacturer,
            newCardDetails.cardQualityUngraded,
            newCardDetails.cardQualityPsa,
            newCardDetails.cardRarity,
            newCardDetails.cardSet,
            newCardDetails.cardIsFoil,
            newCardDetails.cardGame,
            newCardDetails.cardId,
          ]
        )
      ).rows[0];

      if (!updatedCardRecord) {
        await pool.query(`ROLLBACK`);
        throw new ServerError(500, "Error updating card");
      }

      await pool.query(`COMMIT`);

      const auction: Auction = {
        auctionId: updatedAuctionRecord.auctionId,
        auctioneer: auctioneer,
        name: updatedAuctionRecord.name,
        description: updatedAuctionRecord.description,
        startPrice: parseFloat(updatedAuctionRecord.startPrice),
        spread: parseFloat(updatedAuctionRecord.spread),
        minNewBidPrice:
          parseFloat(updatedAuctionRecord.startPrice) +
          parseFloat(updatedAuctionRecord.spread),
        startTime: updatedAuctionRecord.startTime,
        endTime: updatedAuctionRecord.endTime,
        topBid: null,
        numBids: 0,
        auctionStatus: updatedAuctionRecord.startTime
          ? "Scheduled"
          : "Not scheduled",
        cards: [
          {
            cardId: updatedCardRecord.cardId,
            game: updatedCardRecord.game,
            name: updatedCardRecord.name,
            description: updatedCardRecord.description,
            manufacturer: updatedCardRecord.manufacturer,
            ...(updatedCardRecord.qualityUngraded
              ? { qualityUngraded: updatedCardRecord.qualityUngraded }
              : {
                  qualityPsa: parseInt(
                    updatedCardRecord.qualityPsa
                  ) as QualityPsa,
                }),
            rarity: updatedCardRecord.rarity,
            set: updatedCardRecord.set,
            isFoil: updatedCardRecord.isFoil,
            imageUrl: updatedCardRecord.imageUrl,
          },
        ],
      };

      res.json(auction);
    }

    if (newBundleDetails) {
      const updatedBundleRecord = camelize(
        await pool.query<BundleDb>(
          ` UPDATE bundle
            SET name = $1, description = $2, manufacturer = $3, set = $4, game = $5
            WHERE bundle_id = $6
            RETURNING *`,
          [
            newBundleDetails.bundleName,
            newBundleDetails.bundleDescription,
            newBundleDetails.bundleManufacturer,
            newBundleDetails.bundleSet,
            newBundleDetails.bundleGame,
            newBundleDetails.bundleId,
          ]
        )
      ).rows[0];

      if (!updatedBundleRecord) {
        await pool.query(`ROLLBACK`);
        throw new ServerError(500, "Error updating bundle");
      }

      await pool.query(`COMMIT`);

      const auction: Auction = {
        auctionId: updatedAuctionRecord.auctionId,
        auctioneer: auctioneer,
        name: updatedAuctionRecord.name,
        description: updatedAuctionRecord.description,
        startPrice: parseFloat(updatedAuctionRecord.startPrice),
        spread: parseFloat(updatedAuctionRecord.spread),
        minNewBidPrice:
          parseFloat(updatedAuctionRecord.startPrice) +
          parseFloat(updatedAuctionRecord.spread),
        startTime: updatedAuctionRecord.startTime,
        endTime: updatedAuctionRecord.endTime,
        topBid: null,
        numBids: 0,
        auctionStatus: updatedAuctionRecord.startTime
          ? "Scheduled"
          : "Not scheduled",
        bundle: {
          bundleId: updatedBundleRecord.bundleId,
          game: updatedBundleRecord.game,
          name: updatedBundleRecord.name,
          description: updatedBundleRecord.description,
          manufacturer: updatedBundleRecord.manufacturer,
          set: updatedBundleRecord.set,
          imageUrl: updatedBundleRecord.imageUrl,
        },
      };

      res.json(auction);
    }
  }
);

router.delete(
  "/:auctionId",
  notificationMiddleware(deleteAuctionNotification),
  async (req, res) => {
    const auctionId = req.params.auctionId;
    const auctionRecord = camelize(
      await pool.query<AuctionDb>(
        ` SELECT *
          FROM auction
          WHERE auction_id = $1`,
        [auctionId]
      )
    ).rows[0];

    if (!auctionRecord) {
      throw new BusinessError(404, "Auction not found");
    }

    if (
      !req.session.accountId ||
      auctionRecord.auctioneerId !== req.session.accountId
    ) {
      throw unauthorized();
    }

    if (
      auctionRecord.startTime &&
      new Date(auctionRecord.startTime).getTime() < Date.now()
    ) {
      throw new BusinessError(
        409,
        "Cannot delete auction",
        "Auction has already started"
      );
    }

    const imageUrl = camelize(
      await pool.query<{ image_url: string }>(
        ` SELECT image_url
          FROM bundle
          WHERE auction_id = $1
          UNION
          SELECT image_url
          FROM card
          WHERE auction_id = $1`,
        [auctionId]
      )
    ).rows[0].imageUrl;

    if (!imageUrl) {
      throw new ServerError(500, "Error deleting auction");
    }

    // only need to delete from auction table - cascade will delete from cards/bundle
    const deletedAuctionRecord = camelize(
      await pool.query<AuctionDb>(
        ` DELETE FROM auction
          WHERE auction_id = $1
          RETURNING *`,
        [auctionId]
      )
    ).rows[0];

    if (!deletedAuctionRecord) {
      throw new ServerError(500, "Error deleting auction");
    }

    // will throw error if gcs error
    try {
      await deleteImage(imageUrl, req.session.accountId);
    } catch (err) {
      console.log(err);
      // auction was deleted, but there may be an orphaned image in gcs
      // throw new ServerError(500, "Error deleting auction");
    }

    res.sendStatus(204);
  }
);

router.post(
  "/",
  notificationMiddleware(postAuctionNotification),
  async (req, res) => {
    const auctionInput: AuctionInput = req.body;
    // can only post auctions for self
    if (auctionInput.auctioneerId !== req.session.accountId) {
      throw unauthorized();
    }

    // validate context dependent fields
    // (openapi cannot define fields based on other fields)

    // must start in the future
    if (
      auctionInput.startTime &&
      new Date(auctionInput.startTime).getTime() < Date.now()
    ) {
      throw new BusinessError(
        409,
        "Invalid auction start time",
        "Auction must start in the future"
      );
    }

    // must last at least 5 minutes
    if (
      auctionInput.startTime &&
      auctionInput.endTime &&
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

    // start of imageUrl(s) name must match auctioneerId
    // (check that image actually exists happens later when trying to preserve))
    if (auctionInput.bundle) {
      if (
        !generateImageName(auctionInput.bundle.imageUrl).startsWith(
          req.session.accountId
        )
      ) {
        throw new BusinessError(
          409,
          "Invalid image url",
          "Image must be uploaded by auctioneer. Upload an image by posting to api/v_/images first."
        );
      }
    } else {
      if (auctionInput.cards) {
        if (
          auctionInput.cards.some(
            (card) =>
              !generateImageName(card.imageUrl).startsWith(
                req.session.accountId
              )
          )
        ) {
          throw new BusinessError(
            409,
            "Invalid image url",
            "Images must be uploaded by auctioneer. Upload images by posting to api/v_/images first."
          );
        }
      }
    }

    // auctioneer must have an address to post auction
    const auctioneerRecord = camelize(
      await pool.query<AccountDb>(
        ` SELECT *
          FROM account
          WHERE account_id = $1`,
        [auctionInput.auctioneerId]
      )
    ).rows[0];

    if (!auctioneerRecord) {
      throw new ServerError(500, "Error creating auction");
    }

    if (!auctioneerRecord.addressFormatted) {
      throw new BusinessError(
        409,
        "Auctioneer missing address",
        "Auctioneer must have an address to post an auction."
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
          ` INSERT INTO bundle (auction_id, game, name, description, manufacturer, set, image_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *`,
          [
            auctionRecord.auctionId,
            bundleInput.game,
            bundleInput.name,
            bundleInput.description,
            bundleInput.manufacturer,
            bundleInput.set,
            bundleInput.imageUrl,
          ]
        )
      ).rows[0];

      // if bundle insert fails, rollback
      if (!bundleRecord) {
        await pool.query(`ROLLBACK`);
        console.error("Error inserting bundle into database");
        throw new ServerError(500, "Error creating auction - bundle");
      }

      try {
        await preserveImage(bundleInput.imageUrl, req.session.accountId);
      } catch (err) {
        await pool.query(`ROLLBACK`);
        throw new BusinessError(
          404,
          "Image not found",
          `Could not find referenced image at ${bundleInput.imageUrl}. Upload an image by posting to api/v_/images first.`
        );
      }

      await pool.query(`COMMIT`);

      const auction: Auction = {
        auctionId: auctionRecord.auctionId,
        auctioneer: {
          accountId: auctionRecord.auctioneerId,
          username: auctioneerRecord.username,
          email: auctioneerRecord.email,
          address: {
            addressFormatted: auctioneerRecord.addressFormatted,
            latitude: auctioneerRecord.latitude,
            longitude: auctioneerRecord.longitude,
          },
        },
        name: auctionRecord.name,
        description: auctionRecord.description,
        startPrice: parseFloat(auctionRecord.startPrice),
        spread: parseFloat(auctionRecord.spread),
        minNewBidPrice:
          parseFloat(auctionRecord.startPrice) +
          parseFloat(auctionRecord.spread),
        startTime: auctionRecord.startTime,
        endTime: auctionRecord.endTime,
        topBid: null,
        numBids: 0,
        auctionStatus: auctionInput.startTime ? "Scheduled" : "Not scheduled",
        bundle: bundleRecord,
      };

      res.status(201).json(auction);
      return;
    }

    // openapi schema ensures exactly one of cards/bundle is present
    const cardsInput = auctionInput.cards;

    // generate string of variables ($1, $2, ... $11), ($12, $11, ... $22) ... for query
    const valuesString = cardsInput
      .map(
        (_, i) =>
          `(${Array.from({ length: 11 }, (_, j) => `$${i * 11 + j + 1}`).join(
            ", "
          )})`
      )
      .join(", ");

    const cardsRecord = camelize(
      await pool.query<CardDb<Game>>(
        ` INSERT INTO card (
        auction_id, game, name, description, manufacturer, quality_ungraded, 
        quality_psa, rarity, set, is_foil, image_url)
        VALUES ${valuesString}
        RETURNING *`,
        cardsInput.flatMap((card) => [
          auctionRecord.auctionId,
          card.game,
          card.name,
          card.description,
          card.manufacturer,
          card.qualityUngraded,
          card.qualityPsa,
          card.rarity,
          card.set,
          card.isFoil,
          card.imageUrl,
        ])
      )
    ).rows;

    const cards: Card<Game>[] = await Promise.all(
      cardsRecord.map(async (cardRecord) => {
        const card: Card<Game> = {
          cardId: cardRecord.cardId,
          game: cardRecord.game,
          name: cardRecord.name,
          description: cardRecord.description,
          manufacturer: cardRecord.manufacturer,
          ...(cardRecord.qualityUngraded
            ? { qualityUngraded: cardRecord.qualityUngraded }
            : { qualityPsa: parseInt(cardRecord.qualityPsa) as QualityPsa }),
          rarity: cardRecord.rarity,
          set: cardRecord.set,
          isFoil: cardRecord.isFoil,
          imageUrl: cardRecord.imageUrl,
        };

        try {
          await preserveImage(cardRecord.imageUrl, req.session.accountId);
        } catch (err) {
          await pool.query(`ROLLBACK`);
          // can be auth error
          if (err instanceof BusinessError) {
            throw err;
          }
          console.error(err);
          // or image not found
          throw new BusinessError(
            404,
            "Image not found",
            `Could not find referenced image at ${cardRecord.imageUrl}. Upload an image by posting to api/v_/images first.`
          );
        }

        return card;
      })
    );

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
        address: {
          addressFormatted: auctioneerRecord.addressFormatted,
          latitude: auctioneerRecord.latitude,
          longitude: auctioneerRecord.longitude,
        },
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
      auctionStatus: auctionInput.startTime ? "Scheduled" : "Not scheduled",
      cards: cards,
    };

    res.status(201).json(auction);
  }
);

// generate CTE for bid status based on bidder_id.
// valNum is the parameter number which will supply the bidder_id
function getBidStatusCte(bidderId: string, valNum: number) {
  if (!bidderId) {
    return null;
  }
  return `
    SELECT auction_id,
    CASE
      WHEN bidder_max_bid IS NULL THEN 
        CASE 
          WHEN end_time < NOW() THEN 'Not bid (ended)' 
          ELSE 'Not bid' 
        END
      WHEN bidder_max_bid = max_bid THEN 
        CASE 
          WHEN end_time < NOW() THEN 'Won' 
          ELSE 'Leading' 
        END
      WHEN bidder_max_bid < max_bid THEN
        CASE 
          WHEN end_time < NOW() THEN 'Lost' 
          ELSE 'Outbid' 
        END
      ELSE 'error'
    END AS bid_status
    FROM (
    SELECT auction_id, end_time, max_bid_amount as max_bid,
    (SELECT MAX(amount) FROM bid WHERE auction_id = bid_agg.auction_id AND bidder_id = $${valNum}) as bidder_max_bid
    FROM auction
    LEFT JOIN (
          SELECT MAX(amount) AS max_bid_amount, COUNT(*) AS num_bids, auction_id
          FROM bid
          GROUP BY auction_id
        ) bid_agg USING(auction_id)
    ) bid_status`;
}

// generate CTE for watched based on account_id.
// valNum is the parameter number which will supply the account_id
function getWatchingCte(accountId: string, valNum: number) {
  if (!accountId) {
    return null;
  }
  return `
    SELECT auction_id,
    auction_id IN (
      SELECT auction_id
      FROM watch
      WHERE account_id = $${valNum}
      ) AS watching
    FROM auction`;
}

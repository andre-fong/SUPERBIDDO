import { PageName } from "@/types/pageTypes";
import React, { useEffect, useState, useRef, useMemo } from "react";
import styles from "@/styles/auction.module.css";
import { User } from "@/types/userTypes";
import { AuctionBidHistory } from "@/types/auctionTypes";
import { ErrorType, Severity } from "@/types/errorTypes";
import {
  pollForAuctionUpdates,
  getAuctionBids,
  submitBid,
} from "@/utils/fetchFunctions";
import InfoIcon from "@mui/icons-material/InfoOutlined";
import HelpIcon from "@mui/icons-material/HelpOutlineOutlined";
import PlaceIcon from "@mui/icons-material/Place";
import StarIcon from "@mui/icons-material/Star";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import { useTimer } from "react-timer-hook";
import InnerImageZoom from "react-inner-image-zoom";
import Slider from "react-slick";
import { fetchAuction } from "@/utils/fetchFunctions";
import type { Auction, BidDetails } from "@/types/backendAuctionTypes";

function auctionPollingStart(
  auctionId: string,
  setToast: (err: ErrorType) => void,
  bidId: string,
  signal: AbortSignal,
  updateAuction: (auction: Auction) => void
) {
  pollForAuctionUpdates(setToast, auctionId, signal, bidId).then(
    (newAuction: Auction) => {
      if (!newAuction) {
        return;
      }

      updateAuction(newAuction);
      auctionPollingStart(
        auctionId,
        setToast,
        newAuction.topBid?.bidId || "null",
        signal,
        updateAuction
      );
    }
  );
}

/**
 * Formats ALL bids into a more readable format for frontend UI
 * @param bids Bid history array (important that ALL bids are present, not a subset of the full history)
 */
function formatBids(bids: BidDetails[]): AuctionBidHistory[] {
  const bidders: {
    [key: string]: { bids: number; highBid: number; lastBidTime: string };
  } = {};
  for (const bid of bids) {
    const username = bid.bidder.username;
    if (!bidders[username]) {
      bidders[username] = { bids: 0, highBid: 0, lastBidTime: bid.timestamp };
    }
    bidders[username].bids++;
    if (bid.amount > bidders[username].highBid) {
      bidders[username].highBid = bid.amount;
      bidders[username].lastBidTime = bid.timestamp;
    }
  }

  const formattedBids = [];
  for (const bidder in bidders) {
    formattedBids.push({
      bidder,
      bids: bidders[bidder].bids,
      highBid: bidders[bidder].highBid,
      lastBidTime: bidders[bidder].lastBidTime,
    });
  }

  formattedBids.sort((a, b) => b.highBid - a.highBid);

  return formattedBids;
}

function handleQualityTooltip(
  qualityType: "PSA" | "Ungraded",
  quality: string | number
) {
  if (qualityType === "PSA") {
    switch (quality) {
      case 1:
        return "Poor: Card is heavily damaged and may be missing pieces. Heavy creasing, discoloration, or other destructive effects may be present.";
      case 2:
        return "Good: Card is intact and shows signs of surface wear. Card corners may show accelerated rounding and and surface discoloration.";
      case 3:
        return "Very Good: Card corners have some rounding and some surface wear is visible. Card may have minor creasing or discoloration.";
      case 4:
        return "Very Good - Excellent: Card corners have little rounding and surface wear is minimal. Card may have minor creasing or discoloration.";
      case 5:
        return "Excellent: Card corners have very minor rounding, minor chipping on edges, and surface wear is minimal.";
      case 6:
        return "Excellent - Mint: Card is in excellent condition with little to no visible wear. Very light scratches or slight edge notches may be present.";
      case 7:
        return "Near Mint: Card is in excellent condition with little to no visible wear. Very slight corner fraying or minor printing blemishes may be present. Most of the original gloss is retained.";
      case 8:
        return "Near Mint - Mint: Card is in super high-end condition that appears Mint at first glance. The card can exhibit slight fraying at one or two corners, a minor printing imperfection, or slightly off-white borders.";
      case 9:
        return "Mint: Card is in superb condition, only exhibiting one of the following minor flaws: a slight wax stain on reverse, slight off-white borders, or slight printing imperfection.";
      case 10:
        return "Gem Mint: Card is in perfect condition with four sharp corners, sharp focus, and full original gloss.";
      default:
        return "Quality not specified.";
    }
  } else {
    switch (quality) {
      case "Damaged":
        return "D (Ungraded): Card is heavily damaged and may be missing pieces. Heavy creasing, discoloration, or other destructive effects may be present.";
      case "Heavily Played":
        return "HP (Ungraded): Card is intact and shows signs of surface wear. Card corners may show accelerated rounding and and surface discoloration.";
      case "Moderately Played":
        return "MP (Ungraded): Card corners have some rounding and some surface wear is visible. Card may have minor creasing or discoloration.";
      case "Lightly Played":
        return "LP (Ungraded): Card corners have little rounding and surface wear is minimal. Card may have minor creasing or discoloration.";
      case "Near Mint":
        return "NM (Ungraded): Card is in excellent condition with little to no visible wear. Very light scratches or slight edge notches may be present.";
      case "Mint":
        return "M (Ungraded): Card is in superb condition, only exhibiting one of the following minor flaws: a slight wax stain on reverse, slight off-white borders, or slight printing imperfection.";
      default:
        return "Quality not specified.";
    }
  }
}

const pageSize = 999999999;

const gameMap = {
  MTG: "Magic: The Gathering",
  Yugioh: "Yu-Gi-Oh!",
  Pokemon: "Pokémon",
};

export default function Auction({
  setCurPage,
  user,
  setToast,
  context,
}: {
  setCurPage: (page: PageName, context?: string) => void;
  user: User | null;
  setToast: (err: ErrorType) => void;
  context: string;
}) {
  const [auctionLoading, setAuctionLoading] = useState<boolean>(true);
  const [viewingBids, setViewingBids] = useState<boolean>(false);
  const [bidCount, setBidCount] = useState<number>(0);
  const [bidsLoading, setBidsLoading] = useState<boolean>(true);
  const [isBidding, setIsBidding] = useState<boolean>(false);
  const [auctionEnded, setAuctionEnded] = useState<boolean>(false);
  const [auctionName, setAuctionName] = useState<string>("");
  const [isBundle, setIsBundle] = useState<boolean>(false);
  const [qualityType, setQualityType] = useState<"PSA" | "Ungraded">("PSA");
  const [quality, setQuality] = useState<string | number>("");
  const [game, setGame] = useState<string>("");
  const [listingName, setListingName] = useState<string>("");
  const [set, setSet] = useState<string>("");
  const [rarity, setRarity] = useState<string>("");
  const [foil, setFoil] = useState<boolean>(false);
  const [manufacturer, setManufacturer] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [sellerAccountId, setSellerAccountId] = useState<string>("");
  const [sellerUsername, setSellerUsername] = useState<string>("");
  const [spread, setSpread] = useState<number>(0);
  const [startPrice, setStartPrice] = useState<number>(0);
  /**
   * Current minimum bid amount a user would have to make to outbid the current top bid
   */
  const [curMinBid, setCurMinBid] = useState<number>(0);
  const [winning, setWinning] = useState<boolean>(false);
  const [watching, setWatching] = useState<boolean>(false);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  /**
   * Current bid for long polling
   */
  const [curBid, setCurBid] = useState<number>(0);
  const [bids, setBids] = useState<AuctionBidHistory[]>([]);
  const curAuctionId = useRef<string>("");

  const unscheduled = useMemo(() => !startTime, [startTime]);
  /**
   * Whether the auction is in the future, true if unscheduled
   */
  const inFuture = useMemo(() => {
    if (!startTime) {
      return true;
    }
    return new Date(startTime) > new Date();
  }, [startTime]);
  const inPast = useMemo(() => {
    if (!endTime) {
      return false;
    }
    return new Date(endTime) < new Date();
  }, [endTime]);

  useEffect(() => {
    if (!curAuctionId.current) {
      return;
    }
    setBidsLoading(true);
    getAuctionBids(setToast, curAuctionId.current, 1, pageSize).then(
      (newBids: BidDetails[]) => {
        if (!newBids) {
          return;
        }
        setBids(formatBids(newBids));
        setBidsLoading(false);
      }
    );
    setBidsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curBid]);

  const { totalSeconds, seconds, minutes, hours, days, restart } = useTimer({
    expiryTimestamp: new Date(),
    onExpire: () => setAuctionEnded(true),
  });

  //THIS IS ONLY FOR NEW BIDS
  function setAuctionData(auction: Auction) {
    setBidsLoading(true);
    setCurMinBid(auction.minNewBidPrice);
    setBidCount(auction.numBids);
    setCurBid(auction.topBid?.amount || 0);
    setWinning(
      !user ? false : auction.topBid?.bidder?.accountId === user.accountId
    );
    setBidsLoading(false);
  }

  // This useEffect should only run once, since it initiates the long polling
  useEffect(() => {
    const auctionContext = JSON.parse(context);
    const abortController = new AbortController();
    const signal = abortController.signal;

    fetchAuction(setToast, auctionContext.auctionId).then(
      (auction: Auction) => {
        if (!auction) {
          return;
        }
        console.log(auction);
        const auctionIsBundle = auction.bundle !== undefined;

        curAuctionId.current = auction.auctionId;
        setAuctionName(auction.name);
        setIsBundle(auctionIsBundle);
        setGame(
          auctionIsBundle
            ? auction.bundle.game
            : auction.cards?.at(0)?.game || ""
        );
        setListingName(
          auctionIsBundle
            ? auction.bundle.name
            : auction.cards?.at(0)?.name || ""
        );
        setSet(
          auctionIsBundle ? auction.bundle.set : auction.cards?.at(0)?.set || ""
        );
        setManufacturer(
          auctionIsBundle
            ? auction.bundle.manufacturer
            : auction.cards?.at(0)?.manufacturer || ""
        );
        setDescription(auction.description || "");
        setSellerAccountId(auction.auctioneer.accountId);
        setSellerUsername(auction.auctioneer.username);

        if (!auctionIsBundle) {
          const qualityType = auction.cards?.at(0)?.qualityUngraded
            ? "Ungraded"
            : "PSA";
          setQualityType(qualityType);
          setQuality(
            qualityType === "PSA"
              ? auction.cards?.at(0)?.qualityPsa || 0
              : auction.cards?.at(0)?.qualityUngraded || ""
          );
          setRarity(auction.cards?.at(0)?.rarity || "");
          setFoil(auction.cards?.at(0)?.isFoil || false);
        }

        if (auction.endTime) setEndTime(new Date(auction.endTime));
        if (auction.startTime) setStartTime(new Date(auction.startTime));
        if (auction.startTime && auction.endTime)
          restart(
            new Date(auction.startTime) > new Date()
              ? new Date(auction.startTime)
              : new Date(auction.endTime)
          );

        setSpread(auction.spread);
        setStartPrice(auction.startPrice);
        setAuctionData(auction);

        auctionPollingStart(
          auctionContext.auctionId,
          setToast,
          auction.topBid?.bidId || "null",
          signal,
          (newAuction: Auction) => {
            setAuctionData(newAuction);
          }
        );
        setAuctionLoading(false);
      }
    );

    return () => {
      abortController.abort();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // /**
  //  * Handles submitting a new bid
  //  */
  function handleBidSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (auctionEnded || winning) {
      console.warn("Cannot bid on an ended or winning auction");
      return;
    }

    if (!user) {
      setToast({
        severity: Severity.Critical,
        message: "You must be logged in to bid",
      });
      return;
    }

    submitBid(
      setToast,
      curAuctionId.current,
      parseFloat((e.currentTarget as HTMLFormElement).bid_amount.value),
      user?.accountId
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function SampleNextArrow(props: any) {
    const { className, style, onClick } = props;
    return (
      <div
        className={className}
        style={{
          ...style,
          display: "block",
          background: "gray",
          borderRadius: "50%",
          paddingTop: "1px",
          right: "20px",
          zIndex: 999,
        }}
        onClick={onClick}
      />
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function SamplePrevArrow(props: any) {
    const { className, style, onClick } = props;
    return (
      <div
        className={className}
        style={{
          ...style,
          display: "block",
          background: "gray",
          borderRadius: "50%",
          paddingTop: "1px",
          left: "20px",
          zIndex: 999,
        }}
        onClick={onClick}
      />
    );
  }

  const [tabIndex, setTabIndex] = useState(0);

  return (
    <>
      <div
        role="presentation"
        onClick={(e) => e.preventDefault()}
        style={{
          marginLeft: "clamp(30px, 10vw, 300px)",
          marginBottom: "-15px",
        }}
      >
        <Breadcrumbs aria-label="breadcrumb" sx={{ marginBottom: "15px" }}>
          <Link
            underline="hover"
            color="inherit"
            href="/"
            onClick={() => setCurPage("home")}
          >
            Home
          </Link>
          <Link
            underline="hover"
            color="inherit"
            href="/"
            onClick={() => setCurPage("results", context)}
          >
            Auctions
          </Link>
          {auctionLoading ? (
            <Skeleton variant="text" width={100} />
          ) : (
            <p style={{ color: "black" }}>{auctionName}</p>
          )}
        </Breadcrumbs>
      </div>

      <main className={styles.main}>
        <div className={styles.hero_container}>
          <div className={styles.card_container}>
            <div className={styles.slick_container}>
              <Slider
                // className={styles.slick_container}
                dots
                dotsClass={`${styles.slick_dots} slick-dots`}
                // infinite
                speed={500}
                slidesToShow={1}
                slidesToScroll={1}
                nextArrow={<SampleNextArrow />}
                prevArrow={<SamplePrevArrow />}
              >
                <div className={styles.zoom_card_container}>
                  <InnerImageZoom
                    className={styles.card}
                    src="https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/4f7705ec-8c49-4eed-a56e-c21f3985254c/dah43cy-a8e121cb-934a-40f6-97c7-fa2d77130dd5.png/v1/fill/w_1024,h_1420/pokemon_card_backside_in_high_resolution_by_atomicmonkeytcg_dah43cy-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTQyMCIsInBhdGgiOiJcL2ZcLzRmNzcwNWVjLThjNDktNGVlZC1hNTZlLWMyMWYzOTg1MjU0Y1wvZGFoNDNjeS1hOGUxMjFjYi05MzRhLTQwZjYtOTdjNy1mYTJkNzcxMzBkZDUucG5nIiwid2lkdGgiOiI8PTEwMjQifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.9GzaYS7sd8RPY5FlHca09J9ZQZ9D9zI69Ru-BsbkLDA"
                    zoomSrc="https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/4f7705ec-8c49-4eed-a56e-c21f3985254c/dah43cy-a8e121cb-934a-40f6-97c7-fa2d77130dd5.png/v1/fill/w_1024,h_1420/pokemon_card_backside_in_high_resolution_by_atomicmonkeytcg_dah43cy-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTQyMCIsInBhdGgiOiJcL2ZcLzRmNzcwNWVjLThjNDktNGVlZC1hNTZlLWMyMWYzOTg1MjU0Y1wvZGFoNDNjeS1hOGUxMjFjYi05MzRhLTQwZjYtOTdjNy1mYTJkNzcxMzBkZDUucG5nIiwid2lkdGgiOiI8PTEwMjQifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.9GzaYS7sd8RPY5FlHca09J9ZQZ9D9zI69Ru-BsbkLDA"
                    zoomType="hover"
                  />
                </div>
                <div className={styles.zoom_card_container}>
                  <InnerImageZoom
                    className={styles.card}
                    src="https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/4f7705ec-8c49-4eed-a56e-c21f3985254c/dah43cy-a8e121cb-934a-40f6-97c7-fa2d77130dd5.png/v1/fill/w_1024,h_1420/pokemon_card_backside_in_high_resolution_by_atomicmonkeytcg_dah43cy-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTQyMCIsInBhdGgiOiJcL2ZcLzRmNzcwNWVjLThjNDktNGVlZC1hNTZlLWMyMWYzOTg1MjU0Y1wvZGFoNDNjeS1hOGUxMjFjYi05MzRhLTQwZjYtOTdjNy1mYTJkNzcxMzBkZDUucG5nIiwid2lkdGgiOiI8PTEwMjQifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.9GzaYS7sd8RPY5FlHca09J9ZQZ9D9zI69Ru-BsbkLDA"
                    zoomSrc="https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/4f7705ec-8c49-4eed-a56e-c21f3985254c/dah43cy-a8e121cb-934a-40f6-97c7-fa2d77130dd5.png/v1/fill/w_1024,h_1420/pokemon_card_backside_in_high_resolution_by_atomicmonkeytcg_dah43cy-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTQyMCIsInBhdGgiOiJcL2ZcLzRmNzcwNWVjLThjNDktNGVlZC1hNTZlLWMyMWYzOTg1MjU0Y1wvZGFoNDNjeS1hOGUxMjFjYi05MzRhLTQwZjYtOTdjNy1mYTJkNzcxMzBkZDUucG5nIiwid2lkdGgiOiI8PTEwMjQifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.9GzaYS7sd8RPY5FlHca09J9ZQZ9D9zI69Ru-BsbkLDA"
                    zoomType="hover"
                  />
                </div>
              </Slider>
            </div>
          </div>

          <div className={styles.info_container}>
            {auctionLoading ? (
              <>
                <Skeleton
                  variant="text"
                  sx={{ fontSize: "2em", width: "100%" }}
                />
                <Skeleton
                  variant="text"
                  sx={{ fontSize: "2em", width: "100%" }}
                />
              </>
            ) : (
              <div className={styles.title_row}>
                <h1 className={styles.title}>
                  {auctionName}

                  <div
                    className={styles.auction_status}
                    style={{
                      backgroundColor:
                        unscheduled || inPast
                          ? "var(--primary)"
                          : inFuture
                          ? "var(--accent)"
                          : "green",
                    }}
                  >
                    {unscheduled
                      ? "Unscheduled"
                      : inPast
                      ? "Ended"
                      : inFuture
                      ? "Scheduled"
                      : "Ongoing"}
                  </div>
                </h1>
              </div>
            )}

            <div className={styles.auction_main_data}>
              <div className={styles.high_bid}>
                {bidsLoading ? (
                  <Skeleton
                    variant="text"
                    sx={{ fontSize: "1.7em" }}
                    width={60}
                  />
                ) : (
                  <p
                    className={
                      winning
                        ? `${styles.green_highlight} ${styles.high_bid_amt}`
                        : styles.high_bid_amt
                    }
                  >
                    $ {bidCount > 0 ? curBid.toFixed(2) : curMinBid.toFixed(2)}
                  </p>
                )}
                {winning ? (
                  <p
                    className={`${styles.green_highlight} ${styles.main_data_label}`}
                  >
                    {auctionEnded ? "YOUR WINNING BID" : "YOUR HIGH BID"}
                  </p>
                ) : bidCount > 0 ? (
                  <p className={styles.main_data_label}>HIGH BID</p>
                ) : (
                  <p className={styles.main_data_label}>STARTING BID</p>
                )}
              </div>

              {bidsLoading && (
                <div className={styles.closing_in}>
                  <Skeleton
                    variant="text"
                    sx={{ fontSize: "1.7em" }}
                    width={60}
                  />
                  <div className={styles.main_data_label_row}>
                    <p className={styles.main_data_label}>
                      {inFuture ? "STARTING IN" : "CLOSING IN"}
                    </p>
                    <Tooltip
                      title="Once the auction timer ends, all following bids will be blocked and the highest bidder will win the item."
                      placement="left"
                      arrow
                    >
                      <HelpIcon
                        className={styles.help_icon}
                        fontSize="inherit"
                      />
                    </Tooltip>
                  </div>
                </div>
              )}

              {!unscheduled && !inPast && (
                <div className={styles.closing_in}>
                  <p className={styles.closing_in_amt}>
                    {days > 0 && `${days}d `}
                    {hours > 0 && `${hours}h `}
                    {minutes > 0 && `${minutes}m `}
                    {seconds}s
                  </p>

                  <div className={styles.main_data_label_row}>
                    <p className={styles.main_data_label}>
                      {inFuture ? "STARTING IN" : "CLOSING IN"}
                    </p>
                    <Tooltip
                      title="Once the auction timer ends, all following bids will be blocked and the highest bidder will win the item."
                      placement="left"
                      arrow
                    >
                      <HelpIcon
                        className={styles.help_icon}
                        fontSize="inherit"
                      />
                    </Tooltip>
                  </div>
                </div>
              )}
              <button
                className={styles.num_bids}
                onClick={() => setViewingBids(true)}
              >
                {bidsLoading ? (
                  <Skeleton
                    variant="text"
                    sx={{ fontSize: "1.7rem" }}
                    width={60}
                  />
                ) : (
                  <p className={styles.num_bids_amt}>{bidCount}</p>
                )}
                <p className={styles.main_data_label}>
                  {bidCount === 1 ? "BID" : "BIDS"}
                </p>
              </button>
            </div>

            <div className={styles.button_row}>
              {!auctionLoading && sellerAccountId === user?.accountId ? (
                <Button
                  variant="outlined"
                  fullWidth
                  color="info"
                  size="large"
                  disabled={!(unscheduled || (inFuture && !auctionEnded))}
                  onClick={() => setCurPage("editAuction", context)}
                >
                  Edit Auction
                </Button>
              ) : !user ? (
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  onClick={() =>
                    setCurPage(
                      "login",
                      JSON.stringify({
                        next: "auction",
                        auctionId: curAuctionId.current,
                      })
                    )
                  }
                >
                  Log in to bid!
                </Button>
              ) : (
                !inPast && (
                  <>
                    {!inFuture && (
                      <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        disabled={bidsLoading || winning || auctionEnded}
                        onClick={() => setIsBidding(true)}
                      >
                        {auctionEnded
                          ? "Auction Ended"
                          : winning
                          ? "Winning Bid!"
                          : bidsLoading
                          ? "Bid"
                          : `Bid $ ${(
                              (bidCount > 0 ? curBid : curMinBid) + spread
                            ).toFixed(2)}`}
                      </Button>
                    )}

                    {bidsLoading ? (
                      <Button
                        variant="outlined"
                        fullWidth
                        size="large"
                        disabled
                      >
                        Watch
                      </Button>
                    ) : watching ? (
                      <Button
                        variant="contained"
                        startIcon={<StarIcon />}
                        fullWidth
                        size="large"
                      >
                        Watching
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        startIcon={<StarIcon />}
                        fullWidth
                        size="large"
                      >
                        Watch
                      </Button>
                    )}
                  </>
                )
              )}
            </div>

            <div className={styles.auction_secondary_data}>
              {!isBundle && (
                <>
                  <p className={styles.secondary_data_label}>Quality: </p>
                  {auctionLoading ? (
                    <Skeleton
                      variant="text"
                      sx={{ fontSize: "1.2rem", width: "10ch" }}
                    />
                  ) : (
                    <div className={styles.condition_row}>
                      <p className={styles.condition}>
                        {qualityType === "PSA" ? `PSA ${quality}` : quality}
                      </p>
                      <Tooltip
                        title={handleQualityTooltip(qualityType, quality)}
                        placement="top"
                        arrow
                      >
                        <InfoIcon
                          className={styles.info_icon}
                          fontSize="small"
                        />
                      </Tooltip>
                    </div>
                  )}
                </>
              )}
              <p className={styles.secondary_data_label}>Location: </p>
              {auctionLoading ? (
                <Skeleton
                  variant="text"
                  sx={{ fontSize: "1.2rem", width: "10ch" }}
                />
              ) : (
                <div className={styles.location_row}>
                  <p className={styles.location}>Toronto, ON</p>
                  <button
                    className={styles.view_map}
                    title="View location on Google Maps"
                  >
                    <PlaceIcon fontSize="small" />
                  </button>
                </div>
              )}

              {unscheduled || !startTime || !endTime ? (
                <>
                  <p className={styles.secondary_data_label}>Status: </p>
                  <p className={styles.start_date}>Unscheduled</p>
                </>
              ) : (
                <>
                  <p className={styles.secondary_data_label}>Start date: </p>
                  {auctionLoading ? (
                    <Skeleton
                      variant="text"
                      sx={{ fontSize: "1.2rem", width: "10ch" }}
                    />
                  ) : (
                    <p
                      className={styles.start_date}
                      title={startTime.toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        weekday: "long",
                        hour: "numeric",
                        minute: "numeric",
                      })}
                    >
                      {startTime.toLocaleDateString(undefined, {
                        weekday: "long",
                        hour: "numeric",
                        minute: "numeric",
                      })}
                    </p>
                  )}
                  <p className={styles.secondary_data_label}>End date: </p>
                  {auctionLoading ? (
                    <Skeleton
                      variant="text"
                      sx={{ fontSize: "1.2rem", width: "10ch" }}
                    />
                  ) : (
                    <p
                      className={styles.end_date}
                      title={endTime.toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        weekday: "long",
                        hour: "numeric",
                        minute: "numeric",
                      })}
                    >
                      {endTime.toLocaleDateString(undefined, {
                        weekday: "long",
                        hour: "numeric",
                        minute: "numeric",
                      })}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className={styles.account_row}>
              {/* PFP image */}
              {/* TODO: Replace with downloaded default pfp (or api) */}
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/2048px-Default_pfp.svg.png"
                alt="Profile Picture"
                className={styles.TEMP_pfp}
              />
              {auctionLoading ? (
                <Skeleton
                  variant="text"
                  sx={{ fontSize: "1.5rem", width: "10ch" }}
                />
              ) : (
                <p className={styles.username}>
                  {sellerUsername}{" "}
                  {sellerAccountId === user?.accountId && (
                    <span className={styles.user_num_listings}>(You)</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        <Tabs
          value={tabIndex}
          onChange={(e, newValue) => setTabIndex(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          aria-label="auction details tabs"
          sx={{ marginTop: "30px" }}
        >
          <Tab
            label="Listing Details"
            id="auction-tab-1"
            aria-controls="auction-tabpanel-1"
          />
          <Tab
            label="About Seller"
            id="auction-tab-2"
            aria-controls="auction-tabpanel-2"
          />
          <Tab
            label="Payment Details"
            id="auction-tab-3"
            aria-controls="auction-tabpanel-3"
          />
        </Tabs>

        {tabIndex === 0 && !auctionLoading && (
          <>
            <section className={styles.listing_details_container}>
              {/* TODO: Fill in details */}
              <div className={styles.listing_details_left}>
                {!isBundle && (
                  <div className={styles.detail_row}>
                    <p className={styles.detail_title}>Quality</p>
                    <p className={styles.detail}>
                      {qualityType === "PSA" ? `PSA ${quality}` : quality}
                    </p>
                  </div>
                )}
                <div className={styles.detail_row}>
                  <p className={styles.detail_title}>Game</p>
                  <p className={styles.detail}>
                    {Object.keys(gameMap).includes(game)
                      ? gameMap[game as "Pokemon" | "MTG" | "Yugioh"]
                      : game}
                  </p>
                </div>
                <div className={styles.detail_row}>
                  <p className={styles.detail_title}>
                    {isBundle ? "Bundle Name" : "Card Name"}
                  </p>
                  <p className={styles.detail}>{listingName}</p>
                </div>
                <div className={styles.detail_row}>
                  <p className={styles.detail_title}>Set</p>
                  <p className={styles.detail}>{set}</p>
                </div>
              </div>
              <div className={styles.listing_details_right}>
                {!isBundle && (
                  <>
                    <div className={styles.detail_row}>
                      <p className={styles.detail_title}>Rarity</p>
                      <p className={styles.detail}>{rarity}</p>
                    </div>
                    <div className={styles.detail_row}>
                      <p className={styles.detail_title}>Foil</p>
                      <p className={styles.detail}>{foil ? "Yes" : "No"}</p>
                    </div>
                  </>
                )}
                <div className={styles.detail_row}>
                  <p className={styles.detail_title}>Manufacturer</p>
                  <p className={styles.detail}>{manufacturer}</p>
                </div>
              </div>
            </section>

            {description && (
              <>
                <p className={styles.description_title}>
                  Seller&apos;s Description
                </p>
                <p className={styles.description}>{description}</p>
              </>
            )}
          </>
        )}

        {tabIndex === 1 && !auctionLoading && (
          <section className={styles.auctioneer_details_container}>
            <div className={styles.auctioneer_row}>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/2048px-Default_pfp.svg.png"
                alt="Profile Picture"
                className={styles.TEMP_auctioneer_pfp}
              />
              <div className={styles.auctioneer_info}>
                <p className={styles.auctioneer_username}>{sellerUsername}</p>
                <p className={styles.auctioneer_num_listings}>
                  SuperBiddo auctioneer
                </p>
              </div>
            </div>

            <div className={styles.auctioneer_divider} />

            <div className={styles.auctioneer_location}>
              <PlaceIcon fontSize="large" />
              <p className={styles.auctioneer_location_text}>Toronto, ON</p>
            </div>
          </section>
        )}

        {tabIndex === 2 && !auctionLoading && (
          <section className={styles.payment_details_container}>
            <div className={styles.detail_row}>
              <p className={styles.detail_title}>Payment Type</p>
              <p className={styles.detail}>CAD</p>
            </div>
            <div className={styles.detail_row}>
              <p className={styles.detail_title}>Payment Terms</p>
              <p className={styles.detail}>
                Buyer must pay for their winning auction by e-transfer via the
                seller&apos;s email, or pay during pick up on the buyer and
                seller&apos;s own discussed terms.
              </p>
            </div>
          </section>
        )}

        <section className={styles.terms_and_conditions_container}>
          <h2 className={styles.terms_title}>Terms and Conditions</h2>
          <ul className={styles.terms}>
            <li>
              All bids are <span className={styles.bold}>FINAL</span> and cannot
              be retracted. Please ensure you are bidding on the correct item
              before placing a bid.
            </li>
            <li>
              The seller and SuperBiddo reserves the right to cancel any bid or
              auction at any time.
            </li>
            <li>
              By participating in this auction, you agree to the terms and
              conditions set forth by the seller and SuperBiddo.
            </li>
          </ul>
        </section>
      </main>

      <Dialog
        open={viewingBids}
        onClose={() => setViewingBids(false)}
        fullWidth
        disableScrollLock={true}
      >
        <div className={styles.bids_container}>
          <h2 className={styles.bids_title}>Bid History</h2>
          <h3 className={styles.bids_listing_title}>{auctionName}</h3>

          <div className={styles.bids_info}>
            <div className={styles.starting_bid}>
              <p className={styles.starting_bid_amt}>
                $ {(startPrice + spread).toFixed(2)}
              </p>
              <p className={styles.bid_info_label}>STARTING PRICE</p>
            </div>
            <div className={styles.spread}>
              <p className={styles.spread_amt}>$ {spread.toFixed(2)}</p>
              <p className={styles.bid_info_label}>SPREAD</p>
            </div>
            <div className={styles.bid_count}>
              <p className={styles.bid_count_amt}>{bidCount}</p>
              <p className={styles.bid_info_label}>
                {bidCount === 1 ? "BID" : "BIDS"}
              </p>
            </div>
          </div>

          {/* MUI TABLE */}
          <TableContainer component={Paper}>
            <Table aria-label="bids table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Bidder</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Bids
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    High Bid ($)
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Last Bid Time
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {bids.map((bid, index) => (
                  <TableRow
                    key={bid.bidder}
                    sx={{
                      backgroundColor: index === 0 ? "#e8f5e9" : "inherit",
                    }}
                  >
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "25ch",
                      }}
                    >
                      {bid.bidder}
                    </TableCell>
                    <TableCell align="center">{bid.bids}</TableCell>
                    <TableCell align="center">
                      {bid.highBid.toFixed(2)}
                    </TableCell>
                    <TableCell
                      align="right"
                      title={new Date(bid.lastBidTime).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                          second: "numeric",
                        }
                      )}
                    >
                      {new Date(bid.lastBidTime).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        second: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <div className={styles.bids_close_row}>
            <Button
              variant="contained"
              sx={{ width: "30%" }}
              onClick={() => setViewingBids(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={isBidding && !winning && !auctionEnded}
        onClose={() => setIsBidding(false)}
        fullWidth
        disableScrollLock={true}
      >
        <form
          className={styles.confirm_bid_container}
          onSubmit={handleBidSubmit}
        >
          <div className={styles.confirm_title_row}>
            <h2 className={styles.confirm_title}>Confirm Bid</h2>
            {totalSeconds < 300 && (
              <p className={styles.closing_in_amt}>
                {days > 0 && `${days}d `}
                {hours > 0 && `${hours}h `}
                {minutes > 0 && `${minutes}m `}
                {seconds}s
              </p>
            )}
          </div>
          <p className={styles.confirm_msg}>
            Are you sure you want to place a bid for
          </p>

          <TextField
            label="Bid Amount"
            variant="outlined"
            name="bid_amount"
            defaultValue={(
              (bidCount > 0 ? curBid : curMinBid) + spread
            ).toFixed(2)}
            required
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
              },
            }}
          />

          <p className={styles.confirm_msg_end}>
            on <span className={styles.bold}>&quot;{auctionName}&quot;</span>?
          </p>

          <div className={styles.confirm_button_row}>
            <Button
              variant="outlined"
              type="reset"
              sx={{ width: "30%" }}
              onClick={() => setIsBidding(false)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              sx={{ width: "30%" }}
              type="submit"
              onClick={() => setIsBidding(false)}
            >
              Place bid!
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

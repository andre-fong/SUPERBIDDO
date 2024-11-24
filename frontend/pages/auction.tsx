import { PageName } from "@/types/pageTypes";
import React, { useEffect, useState, useRef, useMemo } from "react";
import styles from "@/styles/auction.module.css";
import { User } from "@/types/userTypes";
import { AuctionBidHistory } from "@/types/auctionTypes";
import { ErrorType } from "@/types/errorTypes";
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

const pageSize = 8;

export default function Auction({
  setCurPage,
  user,
  setToast,
  context,
}: {
  setCurPage: (page: PageName, context?: string) => void;
  user: User;
  setToast: (err: ErrorType) => void;
  context: string;
}) {
  const [viewingBids, setViewingBids] = useState<boolean>(false);
  const [bidCount, setBidCount] = useState<number>(0);
  const [bidsLoading, setBidsLoading] = useState<boolean>(true);
  const [isBidding, setIsBidding] = useState<boolean>(false);
  const [auctionEnded, setAuctionEnded] = useState<boolean>(false);
  const [spread, setSpread] = useState<number>(0);
  /**
   * Starting price
   */
  const [curMinBid, setCurMinBid] = useState<number>(0);
  const [winning, setWinning] = useState<boolean>(false);
  const [watching, setWatching] = useState<boolean>(false);
  const [endTime, setEndTime] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<Date>(new Date());
  /**
   * Current bid for long polling
   */
  const [curBid, setCurBid] = useState<number>(0);
  /**
   * Bids history pagination
   */
  const [curPage, setCurHistoryPage] = useState<number>(1);
  const curAuctionId = useRef<string>("");
  const [bids, setBids] = useState<AuctionBidHistory[]>([]);

  useEffect(() => {
    if (!curAuctionId.current) {
      return;
    }
    setBidsLoading(true);
    getAuctionBids(setToast, curAuctionId.current, curPage, pageSize).then(
      (newBids: BidDetails[]) => {
        return [];
        // const newBidsFormatted = newBids.map((bid) => {
        //   return {
        //     bidder: bid.bidder.username,
        //     bids: bidCount,
        //     highBid: curBid,
        //     lastBidTime: bid.timestamp,
        //   }
        // });
        // setBids(newBidsFormatted);
      }
    );
    setBidsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curBid, curPage]);

  const { totalSeconds, seconds, minutes, hours, days, restart } = useTimer({
    expiryTimestamp: new Date(),
    onExpire: () => setAuctionEnded(true),
    autoStart: true,
  });

  //THIS IS ONLY FOR NEW BIDS
  function setAuctionData(auction: Auction) {
    setBidsLoading(true);
    setCurMinBid(auction.minNewBidPrice);
    setBidCount(auction.numBids);
    setCurBid(auction.topBid?.amount || 0);
    setWinning(auction.topBid?.bidder?.accountId === user.accountId);
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
        curAuctionId.current = auction.auctionId;
        setSpread(auction.spread);
        setEndTime(new Date(auction.endTime));
        setStartTime(new Date(auction.startTime));
        setAuctionData(auction);
        restart(new Date(auction.endTime));
        auctionPollingStart(
          auctionContext.auctionId,
          setToast,
          auction.topBid?.bidId || "null",
          signal,
          (newAuction: Auction) => {
            setAuctionData(newAuction);
          }
        );
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

    submitBid(
      setToast,
      curAuctionId.current,
      parseFloat((e.currentTarget as HTMLFormElement).bid_amount.value),
      user.accountId
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
            <h1 className={styles.title}>Charizard Birth Japanese Card VM</h1>

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
              <div className={styles.closing_in}>
                {bidsLoading ? (
                  <Skeleton
                    variant="text"
                    sx={{ fontSize: "1.7em" }}
                    width={60}
                  />
                ) : (
                  <p className={styles.closing_in_amt}>
                    {days > 0 && `${days}d `}
                    {hours > 0 && `${hours}h `}
                    {minutes > 0 && `${minutes}m `}
                    {seconds}s
                  </p>
                )}
                <div className={styles.main_data_label_row}>
                  <p className={styles.main_data_label}>CLOSING IN</p>
                  <Tooltip
                    title="The time remaining will extend by 1 minute if a bid is placed within the last 5 minutes of the auction."
                    placement="left"
                    arrow
                  >
                    <HelpIcon className={styles.help_icon} fontSize="inherit" />
                  </Tooltip>
                </div>
              </div>
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

              {bidsLoading ? (
                <Button variant="outlined" fullWidth size="large" disabled>
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
            </div>

            <div className={styles.auction_secondary_data}>
              <p className={styles.secondary_data_label}>Condition: </p>
              <div className={styles.condition_row}>
                <p className={styles.condition}>Near Mint</p>
                <Tooltip
                  title="Near Mint: Card is in excellent condition with little to no visible wear."
                  placement="top"
                  arrow
                >
                  <InfoIcon className={styles.info_icon} fontSize="small" />
                </Tooltip>
              </div>
              <p className={styles.secondary_data_label}>Location: </p>
              <div className={styles.location_row}>
                <p className={styles.location}>Toronto, ON</p>
                <button
                  className={styles.view_map}
                  title="View location on Google Maps"
                >
                  <PlaceIcon fontSize="small" />
                </button>
              </div>
              <p className={styles.secondary_data_label}>Start date: </p>
              <p className={styles.start_date} title="10/31/2021">
                {startTime.toLocaleDateString("en-US", {})}
              </p>
              <p className={styles.secondary_data_label}>End date: </p>
              <p className={styles.end_date} title="11/31/2021">
                {endTime.toLocaleDateString("en-US", {})}
              </p>
            </div>

            <div className={styles.account_row}>
              {/* PFP image */}
              {/* TODO: Replace with downloaded default pfp (or api) */}
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/2048px-Default_pfp.svg.png"
                alt="Profile Picture"
                className={styles.TEMP_pfp}
              />
              {/* TODO: Make username a link */}
              <p className={styles.username}>
                Account Name{" "}
                <span className={styles.user_num_listings}>(x)</span>
              </p>
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

        {tabIndex === 0 && (
          <>
            <section className={styles.listing_details_container}>
              {/* TODO: Fill in details */}
              <div className={styles.listing_details_left}>
                <div className={styles.detail_row}>
                  <p className={styles.detail_title}>Quality</p>
                  <p className={styles.detail}>Near Mint</p>
                </div>
                <div className={styles.detail_row}>
                  <p className={styles.detail_title}>Game</p>
                  <p className={styles.detail}>Magic: The Gathering</p>
                </div>
                <div className={styles.detail_row}>
                  <p className={styles.detail_title}>Card Name</p>
                  <p className={styles.detail}>Llanowar Elves</p>
                </div>
                <div className={styles.detail_row}>
                  <p className={styles.detail_title}>Set</p>
                  <p className={styles.detail}>Foundations</p>
                </div>
              </div>
              <div className={styles.listing_details_right}>
                <div className={styles.detail_row}>
                  <p className={styles.detail_title}>Rarity</p>
                  <p className={styles.detail}>Common</p>
                </div>
                <div className={styles.detail_row}>
                  <p className={styles.detail_title}>Foil</p>
                  <p className={styles.detail}>Yes</p>
                </div>
                <div className={styles.detail_row}>
                  <p className={styles.detail_title}>Manufacturer</p>
                  <p className={styles.detail}>Wizards of the Coast (WOTC)</p>
                </div>
              </div>
            </section>

            <p className={styles.description_title}>Description</p>
            <p className={styles.description}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam
              venenatis, ligula eget lacinia ultricies, nunc nisl tincidunt
              turpis, nec varius purus nunc a nunc. Sed auctor, quam nec
            </p>
          </>
        )}

        {tabIndex === 1 && (
          <section className={styles.auctioneer_details_container}>
            <div className={styles.auctioneer_row}>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/2048px-Default_pfp.svg.png"
                alt="Profile Picture"
                className={styles.TEMP_auctioneer_pfp}
              />
              <div className={styles.auctioneer_info}>
                <p className={styles.auctioneer_username}>Account Name</p>
                <p className={styles.auctioneer_num_listings}>0 Listings</p>
              </div>
            </div>

            <div className={styles.auctioneer_divider} />

            <div className={styles.auctioneer_location}>
              <PlaceIcon fontSize="large" />
              <p className={styles.auctioneer_location_text}>Toronto, ON</p>
            </div>
          </section>
        )}

        {tabIndex === 2 && (
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
          <h3 className={styles.bids_listing_title}>
            Charizard FX Rebirth 88/110 Shiny
          </h3>

          <div className={styles.bids_info}>
            <div className={styles.starting_bid}>
              <p className={styles.starting_bid_amt}>
                $ {curMinBid.toFixed(2)}
              </p>
              <p className={styles.bid_info_label}>STARTING BID</p>
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
                    <TableCell align="center">{curBid.toFixed(2)}</TableCell>
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
            on{" "}
            <span className={styles.bold}>
              &quot;Charizard Birth Japanese Card VM&quot;
            </span>
            ?
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

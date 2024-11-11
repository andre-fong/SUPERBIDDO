import { PageName } from "@/types/pageTypes";
import React, { useEffect, useState } from "react";
import styles from "@/styles/auction.module.css";
import { User } from "@/types/userTypes";
import { AuctionBidHistory } from "@/types/auctionTypes";
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

export default function Auction({
  setCurPage,
  user,
}: {
  setCurPage: (page: PageName) => void;
  user: User;
}) {
  const [viewingBids, setViewingBids] = useState<boolean>(false);
  const [bids, setBids] = useState<AuctionBidHistory[]>([]);
  const [bidCount, setBidCount] = useState<number>(0);
  const [bidsLoading, setBidsLoading] = useState<boolean>(true);
  const [isBidding, setIsBidding] = useState<boolean>(false);
  const [auctionEnded, setAuctionEnded] = useState<boolean>(false);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    getAuctionBids("auction1").then((bids: AuctionBidHistory[]) => {
      setBids(bids);
    });
    pollForAuctionUpdates("auction1", signal, setBids);
    // pollForAuctionUpdates("auction2", signal, setBids);

    return () => {
      controller.abort("Polling aborted");
    };
  }, []);

  useEffect(() => {
    setBidCount(bids.reduce((acc, cur) => acc + cur.bids, 0));
  }, [bids]);

  // TODO: Use actual loading data
  useEffect(() => {
    setTimeout(() => {
      setBidsLoading(false);
    }, 3000);

    return () => {
      setBidsLoading(true);
    };
  }, []);

  // TODO: Replace with actual data
  const spread = 0.5;
  const startingBid = 0.5;
  const username = "matt";
  const winning = bids[0]?.bidder === username;
  const watching = false;
  const endTime = new Date();
  endTime.setSeconds(endTime.getSeconds() + 20);
  const { totalSeconds, seconds, minutes, hours, days, isRunning } = useTimer({
    expiryTimestamp: endTime,
    onExpire: () => setAuctionEnded(true),
    autoStart: true,
  });

  /**
   * Handles submitting a new bid
   */
  function handleBidSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (auctionEnded || winning) {
      console.warn("Cannot bid on an ended or winning auction");
      return;
    }
    const formData = new FormData(e.currentTarget);
    const bidAmount = parseFloat(formData.get("bid_amount") as string);
    (e.currentTarget as HTMLFormElement).reset();
    console.log("TRIED SUBMITTED BID WITH AMT " + bidAmount);
    submitBid("auction1", bidAmount, username);
  }

  return (
    <>
      <main className={styles.main}>
        <div className={styles.hero_container}>
          <div className={styles.card_container}>
            {/* TODO: Use carousel */}
            <InnerImageZoom
              className={styles.TEMP_card}
              src="https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/4f7705ec-8c49-4eed-a56e-c21f3985254c/dah43cy-a8e121cb-934a-40f6-97c7-fa2d77130dd5.png/v1/fill/w_1024,h_1420/pokemon_card_backside_in_high_resolution_by_atomicmonkeytcg_dah43cy-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTQyMCIsInBhdGgiOiJcL2ZcLzRmNzcwNWVjLThjNDktNGVlZC1hNTZlLWMyMWYzOTg1MjU0Y1wvZGFoNDNjeS1hOGUxMjFjYi05MzRhLTQwZjYtOTdjNy1mYTJkNzcxMzBkZDUucG5nIiwid2lkdGgiOiI8PTEwMjQifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.9GzaYS7sd8RPY5FlHca09J9ZQZ9D9zI69Ru-BsbkLDA"
              zoomSrc="https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/4f7705ec-8c49-4eed-a56e-c21f3985254c/dah43cy-a8e121cb-934a-40f6-97c7-fa2d77130dd5.png/v1/fill/w_1024,h_1420/pokemon_card_backside_in_high_resolution_by_atomicmonkeytcg_dah43cy-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTQyMCIsInBhdGgiOiJcL2ZcLzRmNzcwNWVjLThjNDktNGVlZC1hNTZlLWMyMWYzOTg1MjU0Y1wvZGFoNDNjeS1hOGUxMjFjYi05MzRhLTQwZjYtOTdjNy1mYTJkNzcxMzBkZDUucG5nIiwid2lkdGgiOiI8PTEwMjQifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.9GzaYS7sd8RPY5FlHca09J9ZQZ9D9zI69Ru-BsbkLDA"
              zoomType="hover"
            />
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
                    $ {bids[0]?.highBid.toFixed(2)}
                  </p>
                )}
                {winning ? (
                  <p
                    className={`${styles.green_highlight} ${styles.main_data_label}`}
                  >
                    YOUR HIGH BID
                  </p>
                ) : (
                  <p className={styles.main_data_label}>HIGH BID</p>
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
                  : `Bid $ ${(bids[0]?.highBid + spread).toFixed(2)}`}
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
                10/31/2021
              </p>
              <p className={styles.secondary_data_label}>End date: </p>
              <p className={styles.end_date} title="11/31/2021">
                11/31/2021
              </p>
            </div>

            <div className={styles.account_row}>
              {/* PFP image */}
              {/* TODO: Replace with downloaded default pfp (or api) */}
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/2048px-Default_pfp.svg.png"
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

        <section className={styles.listing_details_container}></section>

        <section className={styles.auctioneer_details_container}></section>

        <section className={styles.terms_and_conditions_container}></section>
        {/* <section className={styles.payment_details_container}></section>
      <section className={styles.shipping_pickup_details_container}></section> */}
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
                $ {startingBid.toFixed(2)}
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
            defaultValue={(bids[0]?.highBid + spread).toFixed(2)}
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

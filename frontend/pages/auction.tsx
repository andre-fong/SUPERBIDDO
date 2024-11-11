import { PageName } from "@/types/pageTypes";
import React, { useEffect, useState } from "react";
import styles from "@/styles/auction.module.css";
import { User } from "@/types/userTypes";
import { pollForAuctionUpdates } from "@/utils/fetchFunctions";
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

export default function Auction({
  setCurPage,
  user,
}: {
  setCurPage: (page: PageName) => void;
  user: User;
}) {
  const [viewingBids, setViewingBids] = useState<boolean>(false);

  // TODO: Add type for bid history
  const bidHistory = [
    {
      bidder: "v***o",
      bids: 5,
      highBid: 5.5,
      lastBidTime: "10/31/2021",
    },
    {
      bidder: "m**t",
      bids: 3,
      highBid: 5,
      lastBidTime: "10/31/2021",
    },
    {
      bidder: "j***s",
      bids: 2,
      highBid: 4.5,
      lastBidTime: "10/31/2021",
    },
    {
      bidder: "j*****a",
      bids: 1,
      highBid: 4,
      lastBidTime: "10/31/2021",
    },
    {
      bidder: "j***b",
      bids: 1,
      highBid: 3.5,
      lastBidTime: "10/31/2021",
    },
  ];

  return (
    <>
      <main className={styles.main}>
        <div className={styles.hero_container}>
          <div className={styles.card_container}>
            {/* TODO: Replace with interactive image (use react-image-magnify) */}
            <img
              src="https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/4f7705ec-8c49-4eed-a56e-c21f3985254c/dah43cy-a8e121cb-934a-40f6-97c7-fa2d77130dd5.png/v1/fill/w_1024,h_1420/pokemon_card_backside_in_high_resolution_by_atomicmonkeytcg_dah43cy-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTQyMCIsInBhdGgiOiJcL2ZcLzRmNzcwNWVjLThjNDktNGVlZC1hNTZlLWMyMWYzOTg1MjU0Y1wvZGFoNDNjeS1hOGUxMjFjYi05MzRhLTQwZjYtOTdjNy1mYTJkNzcxMzBkZDUucG5nIiwid2lkdGgiOiI8PTEwMjQifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.9GzaYS7sd8RPY5FlHca09J9ZQZ9D9zI69Ru-BsbkLDA"
              className={styles.TEMP_card}
            />
          </div>

          <div className={styles.info_container}>
            <h1 className={styles.title}>Charizard Birth Japanese Card VM</h1>

            <div className={styles.auction_main_data}>
              <div className={styles.high_bid}>
                <p className={styles.high_bid_amt}>$ 5.00</p>
                <p className={styles.main_data_label}>HIGH BID</p>
              </div>
              <div className={styles.closing_in}>
                <p className={styles.closing_in_amt}>15m 30s</p>
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
                <p className={styles.num_bids_amt}>5</p>
                <p className={styles.main_data_label}>BIDS</p>
              </button>
            </div>

            <div className={styles.button_row}>
              {/* BID button */}
              <Button variant="contained" fullWidth size="large">
                Bid $ 6.00
              </Button>
              {/* WATCH button */}
              <Button
                variant="outlined"
                startIcon={<StarIcon />}
                fullWidth
                size="large"
              >
                Watch
              </Button>
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
      >
        <div className={styles.bids_container}>
          <h2 className={styles.bids_title}>Bid History</h2>
          <h3 className={styles.bids_listing_title}>
            Charizard FX Rebirth 88/110 Shiny
          </h3>

          <div className={styles.bids_info}>
            <div className={styles.starting_bid}>
              <p className={styles.starting_bid_amt}>$ 1.00</p>
              <p className={styles.bid_info_label}>STARTING BID</p>
            </div>
            <div className={styles.current_bid}>
              <p className={styles.current_bid_amt}>$ 5.00</p>
              <p className={styles.bid_info_label}>CURRENT BID</p>
            </div>
            <div className={styles.bid_count}>
              <p className={styles.bid_count_amt}>5</p>
              <p className={styles.bid_info_label}>BIDS</p>
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
                {bidHistory.map((bid) => (
                  <TableRow key={bid.bidder}>
                    <TableCell component="th" scope="row">
                      {bid.bidder}
                    </TableCell>
                    <TableCell align="center">{bid.bids}</TableCell>
                    <TableCell align="center">
                      {bid.highBid.toFixed(2)}
                    </TableCell>
                    <TableCell align="right">{bid.lastBidTime}</TableCell>
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
    </>
  );
}

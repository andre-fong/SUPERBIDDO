import { PageName } from "@/types/pageTypes";
import { useState, useEffect } from "react";
import styles from "@/styles/bids.module.css";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import {submitBid} from "@/utils/fetchFunctions";
import { pollForAuctionUpdates } from "@/utils/fetchFunctions";

export default function TEMPbids({
  setCurPage,
}: {
  setCurPage: (page: PageName) => void;
}) {
  /**
   * Needed to prevent default link onClick behavior and use setCurPage
   */
  function goToPage(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, page: PageName) {
    e.preventDefault();
    setCurPage(page);
  }

  function handleBidSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const bidAmount = parseFloat(formData.get("bid_amount") as string);
    console.log("TRIED SUBMITTED BID WITH AMT " + bidAmount);
    submitBid("auction1", bidAmount, "victo");
  }

  useEffect(() => {
    pollForAuctionUpdates('auction1');
    pollForAuctionUpdates('auction2');
  }, []);

  // TODO: use correct type
  const mockBids = [
    {
      username: "user1",
      amount: 5.5,
      date: new Date(),
    },
  ];

  return (
    <main className={styles.main}>

      <div className={styles.breadcrumbs}>
        <Breadcrumbs>
          <Link color="inherit" href="#" onClick={(e) => goToPage(e, "home")}>
            Home
          </Link>
          <Link color="inherit" href="#" onClick={(e) => goToPage(e, "auction")}>
            Auction
          </Link>
          <Typography sx={{ color: 'text.primary' }}>Bids</Typography>
        </Breadcrumbs>
      </div>
      
      <h1 className={styles.title}>Bids</h1>

      <form className={styles.bid_form} onSubmit={handleBidSubmit}>
        <TextField
          name="bid_amount"
          label="Amount"
          variant="outlined"
          type="number"
          className={styles.input}
        />
        <Button variant="contained" color="primary" type="submit">
          Submit
        </Button>
      </form>

      {/* TODO: Refactor and add actual styles */}
      <div className={styles.bids_container}>
        {mockBids.map((bid, index) => (
          <div className={styles.bid_card} key={index}>
            <div className={styles.user_row}>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/2048px-Default_pfp.svg.png"
                className={styles.TEMP_pfp}
              />
              <p className={styles.username}>{bid.username}</p>
            </div>
            <p className={styles.amount}>
              {bid.amount} {bid.currency}
            </p>
            <p className={styles.date}>{bid.date.toString()}</p>
          </div>
        ))}
      </div>
    </main>
  );
}

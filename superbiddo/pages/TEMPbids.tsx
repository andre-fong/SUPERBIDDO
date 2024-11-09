import { PageName } from "@/types/pageTypes";
import { useState } from "react";
import styles from "@/styles/bids.module.css";

export default function TEMPbids({
  setCurPage,
}: {
  setCurPage: (page: PageName) => void;
}) {
  // TODO: use correct type
  const mockBids = [
    {
      username: "user1",
      amount: 5.5,
      currency: "CAD",
      date: new Date(),
    },
  ];

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Bids</h1>

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

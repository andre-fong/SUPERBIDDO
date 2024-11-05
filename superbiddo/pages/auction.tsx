import { PageName } from "@/types/pageTypes";
import React from "react";
import styles from "@/styles/auction.module.css";

export default function Auction({
  setCurPage,
}: {
  setCurPage: (page: PageName) => void;
}) {
  return (
    <main className={styles.main}>
      <div className={styles.hero_container}>
        <div className={styles.card_container}>
          {/* Replace with interactive image (use react-image-magnify) */}
          <div className={styles.TEMP_card}></div>

          {/* BID button */}
          {/* WATCH button */}
        </div>

        <h1 className={styles.title}>Charizard Birth Japanese Card VM</h1>

        <div className={styles.price_row}>
          <div className={styles.price_container}>
            <h2 className={styles.price}>$5.50</h2>
            <p className={styles.currency}>{"CAD"}</p>
          </div>
          <button className={styles.bid_list_button}>{"6"} Bids</button>
        </div>

        <div className={styles.timer_container}>
          <div className={styles.timer_row}>
            <p className={styles.label}>Remaining time: </p>
            <p className={styles.timer}>0d 15h 45s</p>
          </div>

          <p className={styles.end_date}>Saturday, November 2, 9:45:00 PM</p>
        </div>

        <div className={styles.quality_row}>
          <p className={styles.label}>Quality: </p>
          <div className={styles.quality_container}>
            <p className={styles.quality}>Near Mint</p>
            {/* QUALITY TOOLTIP */}
          </div>
        </div>

        <div className={styles.location_row}>
          <p className={styles.label}>Location: </p>
          <div className={styles.location_container}>
            <p className={styles.location}>Toronto, ON</p>
            {/* LOCATION TOOLTIP */}
          </div>
        </div>
      </div>

      <section className={styles.listing_details_container}></section>

      <section className={styles.auctioneer_details_container}></section>

      <section className={styles.terms_and_conditions_container}></section>
      {/* <section className={styles.payment_details_container}></section>
      <section className={styles.shipping_pickup_details_container}></section> */}
    </main>
  );
}

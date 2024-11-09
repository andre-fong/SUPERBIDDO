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
          {/* TODO: Replace with interactive image (use react-image-magnify) */}
          <img
            src="https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/4f7705ec-8c49-4eed-a56e-c21f3985254c/dah43cy-a8e121cb-934a-40f6-97c7-fa2d77130dd5.png/v1/fill/w_1024,h_1420/pokemon_card_backside_in_high_resolution_by_atomicmonkeytcg_dah43cy-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTQyMCIsInBhdGgiOiJcL2ZcLzRmNzcwNWVjLThjNDktNGVlZC1hNTZlLWMyMWYzOTg1MjU0Y1wvZGFoNDNjeS1hOGUxMjFjYi05MzRhLTQwZjYtOTdjNy1mYTJkNzcxMzBkZDUucG5nIiwid2lkdGgiOiI8PTEwMjQifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.9GzaYS7sd8RPY5FlHca09J9ZQZ9D9zI69Ru-BsbkLDA"
            className={styles.TEMP_card}
          />

          {/* BID button */}
          {/* WATCH button */}
        </div>

        <div className={styles.info_container}>
          <h1 className={styles.title}>Charizard Birth Japanese Card VM</h1>

          <div className={styles.account_row}>
            {/* PFP image */}
            {/* TODO: Replace with downloaded default pfp (or api) */}
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/2048px-Default_pfp.svg.png"
              className={styles.TEMP_pfp}
            />
            {/* TODO: Make username a link */}
            <p className={styles.username}>
              Account Name <span className={styles.user_num_listings}>(x)</span>
            </p>
          </div>

          <div className={styles.price_row}>
            <div className={styles.price_container}>
              <h2 className={styles.price}>$ 5.50</h2>
              <p className={styles.currency}>CAD</p>
            </div>
            {/* TODO: Make this summon a modal instead of redirecting to bids page */}
            <button
              className={styles.bid_list_button}
              title="View bids"
              onClick={() => setCurPage("bids")}
            >
              {6} Bids
            </button>
          </div>

          {/* TODO: Refactor to use css grid for cleaner UI */}
          <div className={styles.timer_container}>
            <div className={styles.timer_row}>
              <p className={styles.label}>Remaining Time: </p>
              <p className={styles.timer}>15h 45m</p>
            </div>

            <p className={styles.end_date}>(Saturday Nov 2, 9:45 PM)</p>
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
      </div>

      <section className={styles.listing_details_container}></section>

      <section className={styles.auctioneer_details_container}></section>

      <section className={styles.terms_and_conditions_container}></section>
      {/* <section className={styles.payment_details_container}></section>
      <section className={styles.shipping_pickup_details_container}></section> */}
    </main>
  );
}

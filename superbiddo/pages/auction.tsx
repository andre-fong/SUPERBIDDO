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

        <h1 className={styles.title}>{}</h1>
        <h2></h2>
      </div>
    </main>
  );
}

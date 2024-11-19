import { ErrorType } from "@/types/errorTypes";
import { PageName } from "@/types/pageTypes";
import { User } from "@/types/userTypes";
import { useState } from "react";
import styles from "@/styles/results.module.css";

export default function Results({
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
  //////////////////////////////////////////////////
  //                 MOCK DATA                    //
  //////////////////////////////////////////////////

  const results = 1000;
  const searchQuery = "Charizard";

  return (
    <>
      <main className={styles.main}>
        <div className={styles.left_filters}>
          {/* TODO: Filter accordions */}Left filters
        </div>

        <div className={styles.results}>
          <h1 className={styles.results_num}>
            <span className={styles.bold}>{results}</span> results for &quot;
            <span className={styles.bold}>{searchQuery}</span>&quot;
          </h1>

          <div className={styles.filter_dropdowns}>
            <div className={styles.left_filter_dropdowns}></div>
            <div className={styles.sort}></div>
          </div>

          <div className={styles.filter_selected_options}></div>

          {/* TODO: Render results */}
          <div className={styles.results_grid}></div>

          {/* TODO: Paginate */}
          <div className={styles.pagination}></div>
        </div>
      </main>
    </>
  );
}

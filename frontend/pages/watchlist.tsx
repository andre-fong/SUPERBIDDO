import { ErrorType } from "@/types/errorTypes";
import { PageName } from "@/types/pageTypes";
import { User } from "@/types/userTypes";
import { useState, useEffect } from "react";
import styles from "@/styles/watchlist.module.css";
import { getAuctionSearchResults } from "@/utils/fetchFunctions";
import { Auction } from "@/types/backendAuctionTypes";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Listing from "@/components/listing";

export default function WatchList({
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
  ///////////////////////////////////
  //        Watchlist State        //
  ///////////////////////////////////
  const [resultsLoading, setResultsLoading] = useState(true);
  const [results, setResults] = useState<Auction[]>([]);

  ///////////////////////////////////
  //      Watchlist Functions      //
  ///////////////////////////////////
  function getWatchList() {
    // TODO: Replace this function with a fetchFunctions func that returns watch list
    getAuctionSearchResults(setToast, {}).then(
      (results) => {
        setResults(results.auctions);
        setResultsLoading(false);
      },
      (err) => {
        setToast(err);
        setResultsLoading(false);
      }
    );
  }

  useEffect(() => {
    if (!user) {
      setCurPage("login", JSON.stringify({ next: "watchlist" }));
    }

    getWatchList();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <main className={styles.main}>
        <div className={styles.title_row}>
          <h1 className={styles.title}>Your Watch List</h1>
          <Button variant="contained" onClick={() => setCurPage("results")}>
            Add to watch list
          </Button>
        </div>

        <div className={styles.results_grid}>
          {resultsLoading &&
            [...Array(20).keys()].map((i) => (
              <div className={styles.skeleton} key={i}>
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={300}
                  sx={{ borderRadius: "10px" }}
                />
                <Skeleton
                  width="100%"
                  sx={{ marginTop: "15px", fontSize: "1.3rem" }}
                />
                <Skeleton
                  width="100%"
                  sx={{ marginTop: "3px", fontSize: "1.3rem" }}
                />
                <Skeleton
                  width="50%"
                  sx={{ marginTop: "5px", fontSize: "0.9rem" }}
                />
                <div className={styles.skeleton_price_row}>
                  <Skeleton
                    width="30%"
                    sx={{ fontSize: "2.2rem", marginRight: "15px" }}
                  />
                  <Skeleton width={50} height={25} />
                </div>

                <Skeleton
                  width="50%"
                  sx={{ marginTop: "3px", fontSize: "0.9rem" }}
                />
                <Skeleton
                  width="50%"
                  sx={{ marginTop: "3px", fontSize: "0.9rem" }}
                />
              </div>
            ))}

          {results?.map((auction) => (
            <Listing
              key={auction.auctionId}
              auction={auction}
              setCurPage={setCurPage}
            />
          ))}
        </div>
      </main>
    </>
  );
}

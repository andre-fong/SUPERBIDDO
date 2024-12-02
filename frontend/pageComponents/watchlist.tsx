import { ErrorType } from "@/types/errorTypes";
import { PageName } from "@/types/pageTypes";
import { User } from "@/types/userTypes";
import { useState, useEffect } from "react";
import styles from "@/styles/watchlist.module.css";
import { getAuctionSearchResults } from "@/utils/fetchFunctions";
import {
  AuctionStatus,
  AuctionStatusEnum,
  BiddingStatusEnum,
} from "@/types/auctionTypes";
import { Auction } from "@/types/backendAuctionTypes";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Listing from "@/components/listing";
import Box from "@mui/material/Box";
import Pagination from "@mui/material/Pagination";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";

const resultsPerPage = 20;

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
  const [resultsPage, setResultsPage] = useState(1);
  const [resultsTotalPages, setResultsTotalPages] = useState(0);

  ///////////////////////////////////
  //      Watchlist Functions      //
  ///////////////////////////////////
  function getWatchList(accountId: string) {
    setResultsLoading(true);
    getAuctionSearchResults(
      (err) => {
        setToast(err);
        setResultsLoading(false);
      },
      {
        watchedBy: accountId,
        page: resultsPage,
        pageSize: resultsPerPage,
        auctionStatus: [
          AuctionStatusEnum.NotScheduled,
          AuctionStatusEnum.Ongoing,
          AuctionStatusEnum.Scheduled,
        ],
      }
    ).then((results) => {
      setResults(results.auctions);
      setResultsTotalPages(
        Math.ceil(results.totalNumAuctions / resultsPerPage)
      );
      setResultsLoading(false);
    });
  }

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    page: number
  ): void => {
    setResultsPage(page);
  };

  useEffect(() => {
    if (!user) {
      setCurPage("login", JSON.stringify({ next: "watchlist" }));
      return;
    }

    getWatchList(user.accountId);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultsPage, user]);
  return (
    <>
      <div
        role="presentation"
        onClick={(e) => e.preventDefault()}
        style={{
          marginLeft: "clamp(30px, 10vw, 300px)",
          marginBottom: "-10px",
        }}
      >
        <Breadcrumbs aria-label="breadcrumb" sx={{ marginBottom: "15px" }}>
          <Link
            underline="hover"
            color="inherit"
            href="/"
            onClick={() => setCurPage("home")}
          >
            Home
          </Link>
          <p style={{ color: "black" }}>Watch List</p>
        </Breadcrumbs>
      </div>

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

          {!resultsLoading && results.length === 0 && (
            <div style={{ fontStyle: "italic" }}>No auctions watching</div>
          )}
          {results?.map((auction: Auction) => (
            <Listing
              key={auction.auctionId}
              auction={auction}
              setCurPage={setCurPage}
              accountId={user?.accountId}
              setToast={setToast}
              watchingSet={true}
            />
          ))}
        </div>
        <Box
          display="flex"
          justifyContent="center"
          marginTop={4}
          marginBottom={2}
        >
          {resultsTotalPages > 0 && (
            <Pagination
              count={resultsTotalPages}
              page={resultsPage}
              onChange={handlePageChange}
              color="primary"
            />
          )}
        </Box>
      </main>
    </>
  );
}

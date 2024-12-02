import { PageName } from "@/types/pageTypes";
import styles from "@/styles/listing.module.css";
import IconButton from "@mui/material/IconButton";
import StarIcon from "@mui/icons-material/Star";
import { useTimer } from "react-timer-hook";
import CheckIcon from "@mui/icons-material/Check";
import { Auction } from "@/types/backendAuctionTypes";
import { useState, useMemo, useEffect } from "react";
import Skeleton from "@mui/material/Skeleton";
import Image from "next/image";
import { ErrorType } from "@/types/errorTypes";
import { getImageUrl } from "@/utils/determineFunctions";
import { handleWatching } from "@/utils/watchingFunctions";

export default function Listing({
  auction,
  setCurPage,
  accountId,
  setToast,
  watchingSet,
}: {
  auction: Auction;
  setCurPage: (page: PageName, context?: string) => void;
  accountId: string | undefined;
  setToast: (err: ErrorType) => void;
  watchingSet: boolean;
}) {
  const [ended, setEnded] = useState(false);
  const [isWatching, setIsWatching] = useState(watchingSet);

  const shortAddressMsg = useMemo(() => {
    if (!auction.auctioneer.address)
      return <span className={styles.no_address}>No location provided.</span>;
    const parts = auction.auctioneer.address.addressFormatted.split(", ");
    if (parts.length < 3) {
      return `From ${parts[parts.length - 1]}`;
    }
    return `From ${parts[parts.length - 3]}, ${parts[parts.length - 1]}`;
  }, [auction.auctioneer.address]);

  const imageUrl = useMemo(() => getImageUrl(auction), [auction]);

  const unscheduled = useMemo(() => !auction.startTime, [auction.startTime]);
  const inFuture = useMemo(
    () => new Date(auction.startTime) > new Date(),
    [auction.startTime]
  );
  const inPast = useMemo(
    () => new Date(auction.endTime) < new Date(),
    [auction.endTime]
  );

  const { totalSeconds, seconds, minutes, hours, days } = useTimer({
    expiryTimestamp: new Date(
      inFuture ? auction.startTime : auction.endTime || new Date()
    ),
    onExpire: () => {
      setEnded(true);
    },
    autoStart: true,
  });

  return (
    <div className={styles.container}>
      <div className={styles.img_container}>
        <button
          className={styles.img_button}
          onClick={() =>
            setCurPage(
              "auction",
              JSON.stringify({ auctionId: auction.auctionId })
            )
          }
        >
          <div className={styles.img_relative}>
            {!imageUrl ? (
              <div className={styles.image_skeleton}>
                <Skeleton />
              </div>
            ) : (
              <Image
                src={imageUrl}
                alt={auction.name}
                fill
                sizes="300px"
                style={{ width: "100%", objectFit: "contain" }}
              />
            )}
          </div>
        </button>

        {(!inPast || !auction.endTime) &&
          auction.auctioneer.accountId !== accountId && (
            <div className={styles.star}>
              <IconButton
                sx={{
                  // Filled IconButton: https://github.com/mui/material-ui/issues/37443
                  backgroundColor: "primary.light",
                  color: "white",
                  "&:hover": { backgroundColor: "primary.main" },
                  "&:focus-visible": { backgroundColor: "primary.main" },
                }}
                title={
                  isWatching
                    ? "Remove from your watch list"
                    : "Add this listing to your Watch List"
                }
                onClick={() => {
                  if (!accountId) {
                    setCurPage("login");
                  } else {
                    handleWatching(
                      isWatching,
                      auction.auctionId,
                      accountId || "0",
                      setIsWatching,
                      setToast
                    );
                  }
                }}
              >
                {isWatching ? <CheckIcon /> : <StarIcon />}
              </IconButton>
            </div>
          )}
      </div>

      <button
        className={styles.title}
        title={auction.name}
        onClick={() =>
          setCurPage(
            "auction",
            JSON.stringify({ auctionId: auction.auctionId })
          )
        }
      >
        {auction.name}
      </button>

      <p className={styles.quality}>
        {auction.cards?.at(0)?.qualityPsa &&
          `Graded: PSA ${auction.cards?.at(0)?.qualityPsa}`}
        {auction.cards?.at(0)?.qualityUngraded &&
          `Ungraded: ${auction.cards?.at(0)?.qualityUngraded}`}
        {auction.bundle && `Bundle (${auction.bundle.game})`}
      </p>

      <div className={styles.price_row}>
        <p className={styles.price}>
          ${" "}
          {(
            auction.topBid?.amount || auction.startPrice + auction.spread
          ).toFixed(2)}
        </p>
        <p className={styles.num_bids}>
          {auction.numBids} {auction.numBids !== 1 ? "Bids" : "Bid"}
        </p>
      </div>

      {unscheduled ? (
        <p className={styles.time_remaining}>
          <span className={styles.ended}>Not Scheduled</span>
        </p>
      ) : (
        <p
          className={styles.time_remaining}
          title={
            unscheduled
              ? undefined
              : new Date(
                  inFuture ? auction.startTime : auction.endTime
                ).toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                })
          }
        >
          {ended || inPast ? (
            <span className={styles.ended}>
              {inPast ? "Ended" : inFuture ? "Starting Now" : "Ended"}
            </span>
          ) : (
            <>
              <span
                className={
                  totalSeconds > 10800 || inFuture
                    ? styles.time
                    : `${styles.time} ${styles.time_soon}`
                }
              >
                {inFuture && (
                  <span className={styles.starting_in}>Starting in</span>
                )}{" "}
                {days > 0 && `${days}d `}
                {hours > 0 && `${hours}h `}
                {minutes > 0 && `${minutes}m `}
                {seconds}s
              </span>

              <span>
                {inFuture && <br />} &middot;{" "}
                {new Date(
                  inFuture ? auction.startTime : auction.endTime
                ).toLocaleDateString(undefined, {
                  weekday: "long",
                  hour: "numeric",
                  minute: "numeric",
                })}
              </span>
            </>
          )}
        </p>
      )}

      <p
        className={styles.location}
        title={
          auction.auctioneer.address?.addressFormatted ||
          "No location provided."
        }
      >
        {shortAddressMsg}
      </p>
    </div>
  );
}

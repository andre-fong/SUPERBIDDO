import { PageName } from "@/types/pageTypes";
import styles from "@/styles/listing.module.css";
import Image from "next/image";
import IconButton from "@mui/material/IconButton";
import StarIcon from "@mui/icons-material/Star";
import { useTimer } from "react-timer-hook";

export default function Listing({
  auction,
  setCurPage,
}: {
  auction: Auction;
  setCurPage: (page: PageName, context?: string) => void;
}) {
  const { totalSeconds, seconds, minutes, hours, days } = useTimer({
    expiryTimestamp: new Date(auction.endTime.getTime() + 60000),
    onExpire: () => {
      console.log("Timer expired");
    },
    autoStart: true,
  });

  return (
    <div className={styles.container}>
      <div className={styles.img_container}>
        <button className={styles.img_button}>
          <img
            src="https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/4f7705ec-8c49-4eed-a56e-c21f3985254c/dah43cy-a8e121cb-934a-40f6-97c7-fa2d77130dd5.png/v1/fill/w_1024,h_1420/pokemon_card_backside_in_high_resolution_by_atomicmonkeytcg_dah43cy-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTQyMCIsInBhdGgiOiJcL2ZcLzRmNzcwNWVjLThjNDktNGVlZC1hNTZlLWMyMWYzOTg1MjU0Y1wvZGFoNDNjeS1hOGUxMjFjYi05MzRhLTQwZjYtOTdjNy1mYTJkNzcxMzBkZDUucG5nIiwid2lkdGgiOiI8PTEwMjQifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.9GzaYS7sd8RPY5FlHca09J9ZQZ9D9zI69Ru-BsbkLDA"
            alt="Card"
            className={styles.TEMP_img}
          />
        </button>
        <div className={styles.star}>
          <IconButton
            sx={{
              // Filled IconButton: https://github.com/mui/material-ui/issues/37443
              backgroundColor: "primary.light",
              color: "white",
              "&:hover": { backgroundColor: "primary.main" },
              "&:focus-visible": { backgroundColor: "primary.main" },
            }}
            title="Add this listing to your Watch List"
          >
            <StarIcon />
          </IconButton>
        </div>
      </div>

      <p
        className={styles.title}
        title="Charizard 181 Set 1999 Addition Exclusive Rare Card 51/234 Last in Collection"
      >
        {auction.name}
      </p>
      <p className={styles.quality}>Ungraded: Near Mint</p>

      <div className={styles.price_row}>
        <p className={styles.price}>$ {auction.topBid.amount.toFixed(2)}</p>
        <p className={styles.num_bids}>5 Bids</p>
      </div>

      <p
        className={styles.time_remaining}
        title={auction.endTime.toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
        })}
      >
        <span
          className={
            totalSeconds > 10800
              ? styles.time
              : `${styles.time} ${styles.time_soon}`
          }
        >
          {days > 0 && `${days}d `}
          {hours > 0 && `${hours}h `}
          {minutes > 0 && `${minutes}m `}
          {seconds}s
        </span>{" "}
        &middot;{" "}
        {auction.endTime.toLocaleDateString(undefined, {
          weekday: "long",
          hour: "numeric",
          minute: "numeric",
        })}
      </p>

      <p className={styles.location}>From Toronto, ON</p>
    </div>
  );
}

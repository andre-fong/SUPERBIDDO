import { User } from "@/types/userTypes";
import styles from "@/styles/navbar.module.css";
import Image from "next/image";
import IconButton from "@mui/material/IconButton";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { PageName } from "@/types/pageTypes";

export default function Navbar({
  user,
  setCurPage,
}: {
  user: User | null;
  setCurPage: (page: PageName) => void;
}) {
  // TODO: Mock data
  const username = "Victo";
  const notificationCount = 2;

  return (
    <nav className={styles.container}>
      <div className={styles.main}>
        <button className={styles.logo} onClick={() => setCurPage("home")}>
          <Image src="/superbiddo-logo.svg" alt="SuperBiddo Logo" fill />
        </button>
        <div className={styles.search}>{/* TODO: Complex search bar!!! */}</div>

        <div className={styles.right}>
          <div className={styles.notifications}>
            <IconButton>
              <NotificationsIcon fontSize="large" />
            </IconButton>

            <div className={styles.notifications_count}>
              {notificationCount}
            </div>
          </div>
          <div className={styles.user}>
            {user ? (
              <>
                <div className={styles.user_avatar}></div>
                <div className={styles.user_name}>{username}</div>
              </>
            ) : (
              <p>
                Hello!{" "}
                <button
                  className={styles.link}
                  onClick={() => setCurPage("login")}
                >
                  Login
                </button>{" "}
                or{" "}
                <button
                  className={styles.link}
                  onClick={() => setCurPage("signup")}
                >
                  signup
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
      <div className={styles.links_container}>
        <ul className={styles.links}>
          <li className={styles.page_link}>
            <button className={styles.page_button}>Your Listings</button>
          </li>
          <li className={styles.page_link}>
            <button className={styles.page_button}>Your Bids</button>
          </li>
          <li className={styles.page_link}>
            <button className={styles.page_button}>Watch List</button>
          </li>
          <li className={styles.page_link}>
            <button
              className={styles.page_button}
              onClick={() => setCurPage("create")}
            >
              Sell
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

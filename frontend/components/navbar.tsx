import { useEffect, useRef, useState } from "react";
import { User } from "@/types/userTypes";
import styles from "@/styles/navbar.module.css";
import Image from "next/image";
import IconButton from "@mui/material/IconButton";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { PageName } from "@/types/pageTypes";
import { motion } from "motion/react";
import { useInView, useScroll, useMotionValueEvent } from "motion/react";
import { fetchLogout } from "@/utils/fetchFunctions";
import { ErrorType } from "@/types/errorTypes";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import SearchIcon from "@mui/icons-material/Search";

const navVariants = {
  hidden: {
    opacity: 0,
    y: "-20px",
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
};

export default function Navbar({
  user,
  setCurPage,
  curPage,
  setUser,
  setToast,
}: {
  user: User | null;
  setCurPage: (page: PageName, context?: string) => void;
  curPage: PageName;
  setUser: (user: User | null) => void;
  setToast: (error: ErrorType) => void;
}) {
  // TODO: Mock data
  const username = user ? user.username : "";
  const notificationCount = 2;

  // Track scroll position to make navbar sticky
  const { scrollY } = useScroll();
  const ref = useRef<HTMLDivElement | null>(null);
  const linksRef = useRef<HTMLDivElement | null>(null);

  const navInView = useInView(ref);

  const [vertScroll, setVertScroll] = useState(0);

  useMotionValueEvent(scrollY, "change", (y) => {
    setVertScroll(y);
  });

  useEffect(() => {
    if (!ref.current || !linksRef.current) return;

    if (navInView && vertScroll === 0) {
      ref.current.style.position = "static";
      linksRef.current.style.marginBottom = "0";
    } else if (!navInView && vertScroll > 0) {
      ref.current.style.position = "fixed";
      linksRef.current.style.marginBottom = "120px";
    }
  }, [navInView, vertScroll, ref, linksRef]);

  function handleSignout(event: React.MouseEvent<HTMLButtonElement>): void {
    if (!user) {
      return;
    }

    fetchLogout(setToast, (user: User | null) => {
      setUser(user);
      setCurPage("home");
    });
  }

  // TODO: Remove log
  useEffect(() => {
    console.log(user);
  }, [user]);

  return (
    <motion.nav
      className={styles.container}
      variants={navVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.div className={styles.main} ref={ref}>
        <button className={styles.logo} onClick={() => setCurPage("home")}>
          <Image src="/superbiddo-logo.svg" alt="SuperBiddo Logo" fill />
        </button>
        <div className={styles.search}>
          <Autocomplete
            freeSolo
            disableClearable
            selectOnFocus
            handleHomeEndKeys
            options={["Search for items"]}
            // TODO: Use filterOptions to add a "search for ___ in ____" option
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search SuperBiddo"
                variant="outlined"
                slotProps={{
                  input: {
                    ...params.InputProps, // NOT inputProps
                    endAdornment: (
                      <IconButton
                        sx={{
                          // Filled IconButton: https://github.com/mui/material-ui/issues/37443
                          backgroundColor: "primary.main",
                          color: "white",
                          "&:hover": { backgroundColor: "primary.dark" },
                        }}
                        // TODO: Implement search functionality
                      >
                        <SearchIcon />
                      </IconButton>
                    ),
                  },
                }}
              />
            )}
          />
        </div>

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
                <button onClick={handleSignout}>Signout</button>
              </>
            ) : (
              <p>
                Hello!{" "}
                <button
                  className={styles.link}
                  onClick={() =>
                    setCurPage("login", JSON.stringify({ next: curPage }))
                  }
                >
                  Login
                </button>{" "}
                or{" "}
                <button
                  className={styles.link}
                  onClick={() =>
                    setCurPage("signup", JSON.stringify({ next: curPage }))
                  }
                >
                  signup
                </button>
              </p>
            )}
          </div>
        </div>
      </motion.div>
      <div className={styles.links_container} ref={linksRef}>
        <ul className={styles.links}>
          <li className={styles.page_link}>
            <button
              className={styles.page_button}
              onClick={() => setCurPage("yourListings")}
            >
              Your Listings
            </button>
          </li>
          <li className={styles.page_link}>
            <button
              className={styles.page_button}
              onClick={() => setCurPage("yourBiddings")}
            >
              Your Bids
            </button>
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
    </motion.nav>
  );
}

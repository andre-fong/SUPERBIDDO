import React, { useState } from "react";
import styles from "@/styles/footer.module.css";
import { PageName } from "@/types/pageTypes";
import { User } from "@/types/userTypes";
import Dialog from "@mui/material/Dialog";
import EmailIcon from "@mui/icons-material/Email";
import { motion } from "motion/react";
import { fetchLogout } from "@/utils/fetchFunctions";
import { ErrorType } from "@/types/errorTypes";

const footerVariants = {
  hidden: {
    opacity: 0,
    y: "20px",
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.3,
      duration: 0.3,
      ease: "easeInOut",
    },
  },
};

export default function Footer({
  setCurPage,
  user,
  setToast,
  setUser,
}: {
  setCurPage: (page: PageName, context?: string) => void;
  user: User | null;
  setToast: (err: ErrorType) => void;
  setUser: (user: User | null) => void;
}) {
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  function handleSignout(event: React.MouseEvent<HTMLButtonElement>): void {
    if (!user) {
      return;
    }

    fetchLogout(setToast, (user: User | null) => {
      setUser(user);
      setCurPage("home");
    });
  }

  return (
    <motion.footer
      variants={footerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <button
        className={styles.back_to_top}
        onClick={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        Back to Top ↑
      </button>
      <div className={styles.main}>
        <div className={styles.column}>
          <section className={styles.section}>
            <h3 className={styles.section_title}>Buy</h3>
            <ul className={styles.links}>
              <li className={styles.link}>
                <button onClick={() => setCurPage("results")}>
                  All Auctions
                </button>
              </li>
              <li className={styles.link}>
                <button
                  onClick={() =>
                    setCurPage(
                      "results",
                      JSON.stringify({ category: "pokemon" })
                    )
                  }
                >
                  Pokémon
                </button>
              </li>
              <li className={styles.link}>
                <button
                  onClick={() =>
                    setCurPage("results", JSON.stringify({ category: "mtg" }))
                  }
                >
                  Magic: The Gathering
                </button>
              </li>
              <li className={styles.link}>
                <button
                  onClick={() =>
                    setCurPage(
                      "results",
                      JSON.stringify({ category: "yugioh" })
                    )
                  }
                >
                  Yu-Gi-Oh!
                </button>
              </li>
            </ul>
          </section>
          <section className={styles.section}>
            <h3 className={styles.section_title}>Sell</h3>
            <ul className={styles.links}>
              <li className={styles.link}>
                <button
                  onClick={() => {
                    if (user) {
                      setCurPage("create");
                    } else {
                      setCurPage("login");
                    }
                  }}
                >
                  Create A Listing
                </button>
              </li>
            </ul>
          </section>
        </div>

        <div className={styles.column}>
          <section className={styles.section}>
            <h3 className={styles.section_title}>My SuperBiddo</h3>
            <ul className={styles.links}>
              <li className={styles.link}>
                <button
                  onClick={() => {
                    if (user) {
                      setCurPage("yourListings");
                    } else {
                      setCurPage(
                        "login",
                        JSON.stringify({ next: "yourListings" })
                      );
                    }
                  }}
                >
                  My Listings
                </button>
              </li>
              <li className={styles.link}>
                <button
                  onClick={() => {
                    if (user) {
                      setCurPage("yourBiddings");
                    } else {
                      setCurPage(
                        "login",
                        JSON.stringify({ next: "yourBiddings" })
                      );
                    }
                  }}
                >
                  Bid History
                </button>
              </li>
              <li className={styles.link}>
                <button
                  onClick={() => {
                    if (user) {
                      setCurPage(
                        "yourBiddings",
                        JSON.stringify({ filter: "Won" })
                      );
                    } else {
                      setCurPage(
                        "login",
                        JSON.stringify({ next: "yourBiddings", filter: "Won" })
                      );
                    }
                  }}
                >
                  Purchase History
                </button>
              </li>
              <li className={styles.link}>
                <button
                  onClick={() => {
                    if (user) {
                      setCurPage("watchList");
                    } else {
                      setCurPage(
                        "login",
                        JSON.stringify({ next: "watchList" })
                      );
                    }
                  }}
                >
                  Watch List
                </button>
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h3 className={styles.section_title}>My Account</h3>
            <ul className={styles.links}>
              {user ? (
                <>
                  <li className={styles.link}>
                    <button onClick={handleSignout}>Sign Out</button>
                  </li>
                </>
              ) : (
                <li className={styles.link}>
                  <button onClick={() => setCurPage("login")}>Log in</button>
                </li>
              )}
            </ul>
          </section>
        </div>

        <div className={styles.column}>
          <section className={styles.section}>
            <h3 className={styles.section_title}>About SuperBiddo</h3>
            <ul className={styles.links}>
              <li className={styles.link}>
                <a
                  href="https://github.com/UTSCC09/SUPERBIDDO"
                  target="_blank"
                  rel="noreferrer"
                >
                  About
                </a>
              </li>
              <li className={styles.link}>
                <button onClick={() => setContactDialogOpen(true)}>
                  Contact Us
                </button>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <div className={styles.copyright}>
        <p className={styles.copyright_text}>
          © 2024 SuperBiddo. All Rights Reserved.
        </p>
      </div>

      <Dialog
        open={contactDialogOpen}
        onClose={() => setContactDialogOpen(false)}
        disableScrollLock
      >
        <div className={styles.contact_details_container}>
          <h3 className={styles.contact_title}>Contact Us</h3>

          <div className={styles.contact_row}>
            <EmailIcon />
            <a
              href="mailto:superbiddo81@gmail.com"
              target="_blank"
              rel="noreferrer"
              className={styles.contact_text}
            >
              superbiddo81@gmail.com
            </a>
          </div>
        </div>
      </Dialog>
    </motion.footer>
  );
}

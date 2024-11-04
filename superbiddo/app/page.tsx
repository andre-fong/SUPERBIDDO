"use client";
import styles from "./page.module.css";
import { changePageTitle } from "./layout";
import { useState, useEffect } from "react";
import { PageData, PageName } from "@/types/pageTypes";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Login from "@/pages/login";
import Auction from "@/pages/auction";

// https://mui.com/material-ui/customization/palette/
/**
 * SUPERBIDDO COLOR PALETTE
 */
const theme = createTheme({
  palette: {
    primary: {
      main: "#f44336",
    },
    secondary: {
      main: "#3f51b5",
    },
  },
});

// TODO: Use Framer Motion for page transitions
/**
 * CORE PAGE HANDLER FOR SUPERBIDDO
 */
export default function PageHandler() {
  const [curPage, setCurPage] = useState<PageName>("auction");
  const pages: PageData = {
    home: {
      title: "Home | SuperBiddo",
      component: <h1 className={styles.title}>Home</h1>,
    },
    login: {
      title: "Login | SuperBiddo",
      component: <Login setCurPage={setCurPage} />,
    },
    signup: {
      title: "Signup | SuperBiddo",
      component: <h1 className={styles.title}>Signup</h1>,
    },
    bids: {
      title: "Bids | SuperBiddo",
      component: <h1 className={styles.title}>Bids</h1>,
    },
    auction: {
      title: "Auction | SuperBiddo",
      component: <Auction setCurPage={setCurPage} />,
    },
    profile: {
      title: "Profile | SuperBiddo",
      component: <h1 className={styles.title}>Profile</h1>,
    },
  };

  useEffect(() => {
    changePageTitle(pages[curPage].title);
  }, [curPage]);

  // TODO: Add navbar (unless page is login/signup)
  return (
    <ThemeProvider theme={theme}>{pages[curPage].component}</ThemeProvider>
  );
}

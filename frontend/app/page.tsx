"use client";
import styles from "./page.module.css";
import { changePageTitle } from "@/utils/pageManagement";
import { useState, useEffect } from "react";
import { PageData, PageName } from "@/types/pageTypes";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Login from "@/pages/login";
import Auction from "@/pages/auction";
import CreateBid from "@/pages/createbid";
import useUser from "@/hooks/useUser";
import { toast } from "react-toastify";
import { ErrorType, Severity } from "@/types/errorTypes";
import ErrorToast from "@/components/errorToast";
import Navbar from "@/components/navbar";

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
  typography: {
    fontFamily: "'Inter', 'Inter Fallback'",
  },
});

// TODO: Use Framer Motion for page transitions
/**
 * CORE PAGE HANDLER FOR SUPERBIDDO
 */
export default function PageHandler() {
  const [curPage, setCurPage] = useState<PageName>("home");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastSeverity, setToastSeverity] = useState<Severity | null>(null);

  const setToast = (err: ErrorType) => {
    setToastMessage(err.message);
    setToastSeverity(err.severity);
    if (err.severity === Severity.Critical) {
      toast.error(err.message);
    } else if (err.severity === Severity.Warning) {
      toast.warn(err.message);
    }
  };

  const { user, loading } = useUser();

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
    auction: {
      title: "Auction | SuperBiddo",
      component: (
        <Auction user={user} setCurPage={setCurPage} setToast={setToast} />
      ),
    },
    profile: {
      title: "Profile | SuperBiddo",
      component: <h1 className={styles.title}>Profile</h1>,
    },
    create: {
      title: "Create Auction | SuperBiddo",
      component: <CreateBid setToast={setToast} />,
    },
  };

  useEffect(() => {
    changePageTitle(pages[curPage].title);
  }, [curPage]);

  return (
    <ThemeProvider theme={theme}>
      {toastMessage && toastSeverity && (
        <ErrorToast message={toastMessage} severity={toastSeverity} />
      )}
      {curPage !== "login" && curPage !== "signup" && (
        <Navbar user={user} setCurPage={setCurPage} />
      )}
      {pages[curPage].component}
    </ThemeProvider>
  );
}

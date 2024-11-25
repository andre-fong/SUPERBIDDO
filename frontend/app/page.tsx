"use client";
import styles from "./page.module.css";
import { changePageTitle } from "@/utils/pageManagement";
import { useState, useEffect, use } from "react";
import { PageData, PageName } from "@/types/pageTypes";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Auction from "@/pages/auction";
import CreateBid from "@/pages/createbid";
import YourListings from "@/pages/yourlistings";
import YourBiddings from "@/pages/yourbiddings";
import useUser from "@/hooks/useUser";
import { toast } from "react-toastify";
import { ErrorType, Severity } from "@/types/errorTypes";
import ErrorToast from "@/components/errorToast";
import Navbar from "@/components/navbar";
import { AnimatePresence, motion } from "motion/react";
import Results from "@/pages/results";
import Home from "@/pages/home";
import { pollNotifications } from "@/utils/fetchFunctions";
import useNotifications from "@/hooks/useNotfications";
import EditAuction from "@/pages/editAuction";

const theme = createTheme({
  palette: {
    primary: {
      main: "#f44336",
    },
    secondary: {
      main: "#f6b02c",
      light: "#fef1da",
    },
    info: {
      main: "#46b0e9",
    },
  },
  typography: {
    fontFamily: "'Inter', 'Inter Fallback'",
  },
});

const pageVariants = {
  hidden: {
    opacity: 0,
    x: "10px",
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
  exit: {
    opacity: 0,
    x: "-10px",
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
};

// TODO: Use Framer Motion for page transitions
/**
 * CORE PAGE HANDLER FOR SUPERBIDDO
 */
export default function PageHandler() {
  const [curPage, setCurPageState] = useState<PageName>("home");
  // Stringified JSON context for pages to use
  const [pageContext, setPageContext] = useState<string>("{}");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastSeverity, setToastSeverity] = useState<Severity | null>(null);

  const setToast = (err: ErrorType) => {
    setToastMessage(err.message);
    setToastSeverity(err.severity);
  };

  function setCurPage(page: PageName, data = "{}") {
    setCurPageState(page);
    setPageContext(data);
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 250);
  }

  const { user, loading: userLoading, setUser } = useUser();

  const { permission } = useNotifications(user, setToast);

  const pages: PageData = {
    home: {
      title: "Home | SuperBiddo",
      component: (
        <Home
          setCurPage={setCurPage}
          user={user}
          setToast={setToast}
          context={pageContext}
        />
      ),
    },
    results: {
      title: "Results | SuperBiddo",
      component: (
        <Results
          setCurPage={setCurPage}
          user={user}
          setToast={setToast}
          context={pageContext}
        />
      ),
    },
    login: {
      title: "Login | SuperBiddo",
      component: (
        <Login
          setUser={setUser}
          setToast={setToast}
          setCurPage={setCurPage}
          context={pageContext}
        />
      ),
    },
    signup: {
      title: "Signup | SuperBiddo",
      component: (
        <Signup
          setUser={setUser}
          setToast={setToast}
          setCurPage={setCurPage}
          context={pageContext}
        />
      ),
    },
    auction: {
      title: "Auction | SuperBiddo",
      component: (
        <Auction
          user={user}
          setCurPage={setCurPage}
          setToast={setToast}
          context={pageContext}
        />
      ),
    },
    profile: {
      title: "Profile | SuperBiddo",
      component: <h1 className={styles.title}>Profile</h1>,
    },
    create: {
      title: "Create Auction | SuperBiddo",
      component: user ? (
        <CreateBid
          setCurPage={setCurPage}
          user={user}
          setToast={setToast}
          context={pageContext}
        />
      ) : (
        <div>Loading...</div>
      ),
    },
    yourListings: {
      title: "Your Listings | SuperBiddo",
      component: user ? (
        <YourListings
          user={user}
          setToast={setToast}
          setCurPage={setCurPage}
          // context={pageContext}
        />
      ) : (
        <div>Loading...</div>
      ),
    },
    yourBiddings: {
      title: "Your Biddings | SuperBiddo",
      component: user ? (
        <YourBiddings
          user={user}
          setToast={setToast}
          setCurPage={setCurPage}
          // context={pageContext}
        />
      ) : (
        <div>Loading...</div>
      ),
    },
    editAuction: {
      title: "Edit Auction | SuperBiddo",
      component: (
        <EditAuction
          setCurPage={setCurPage}
          user={user}
          setToast={setToast}
          // TODO: Remove hardcoded auctionId and use context when redirecting to this page
          context={pageContext}
        />
      ),
    },
  };

  useEffect(() => {
    changePageTitle(pages[curPage].title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curPage]);

  return (
    <ThemeProvider theme={theme}>
      {toastMessage && toastSeverity && (
        <ErrorToast message={toastMessage} severity={toastSeverity} />
      )}

      <AnimatePresence>
        {curPage !== "login" && curPage !== "signup" && (
          <Navbar
            user={user}
            userLoading={userLoading}
            setCurPage={setCurPage}
            curPage={curPage}
            setToast={setToast}
            setUser={setUser}
            context={pageContext}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          variants={pageVariants}
          key={curPage}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={styles.page_container}
        >
          {/* CURRENT PAGE BEING RENDERED */}
          {pages[curPage].component}
        </motion.div>
      </AnimatePresence>
    </ThemeProvider>
  );
}

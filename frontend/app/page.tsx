"use client";
import styles from "./page.module.css";
import { changePageTitle } from "@/utils/pageManagement";
import { useState, useEffect } from "react";
import { PageData, PageName } from "@/types/pageTypes";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Login from "@/pageComponents/login";
import Signup from "@/pageComponents/signup";
import Auction from "@/pageComponents/auction";
import CreateBid from "@/pageComponents/createbid";
import YourListings from "@/pageComponents/yourlistings";
import YourBiddings from "@/pageComponents/yourbiddings";
import useUser from "@/hooks/useUser";
import { ErrorType, Severity } from "@/types/errorTypes";
import ErrorToast from "@/components/errorToast";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { AnimatePresence, motion } from "motion/react";
import Results from "@/pageComponents/results";
import Home from "@/pageComponents/home";
import { pollNotifications } from "@/utils/fetchFunctions";
import useNotifications from "@/hooks/useNotfications";
import EditAuction from "@/pageComponents/editAuction";
import WatchList from "@/pageComponents/watchlist";
import BeforeCreate from "@/pageComponents/beforeCreate";

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
      duration: 0.3,
      ease: "easeInOut",
    },
  },
  exit: {
    opacity: 0,
    x: "-10px",
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
};

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
    create: {
      title: "Create Auction | SuperBiddo",
      component: (
        <BeforeCreate
          setCurPage={setCurPage}
          user={user}
          setUser={setUser}
          setToast={setToast}
          context={pageContext}
        />
      ),
    },
    createAuction: {
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
        <YourListings user={user} setToast={setToast} setCurPage={setCurPage} />
      ) : (
        <div>Loading...</div>
      ),
    },
    yourBiddings: {
      title: "Your Bid History | SuperBiddo",
      component: user ? (
        <YourBiddings
          user={user}
          setToast={setToast}
          setCurPage={setCurPage}
          context={pageContext}
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
          context={pageContext}
        />
      ),
    },
    watchList: {
      title: "Watch List | SuperBiddo",
      component: (
        <WatchList
          setCurPage={setCurPage}
          user={user}
          setToast={setToast}
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

      <AnimatePresence>
        {curPage !== "login" && curPage !== "signup" && (
          <Footer
            setCurPage={setCurPage}
            user={user}
            setToast={setToast}
            setUser={setUser}
          />
        )}
      </AnimatePresence>
    </ThemeProvider>
  );
}

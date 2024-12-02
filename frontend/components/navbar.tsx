import { useEffect, useRef, useState } from "react";
import { User } from "@/types/userTypes";
import styles from "@/styles/navbar.module.css";
import Image from "next/image";
import IconButton from "@mui/material/IconButton";
import { PageName } from "@/types/pageTypes";
import { motion } from "motion/react";
import { useInView, useScroll, useMotionValueEvent } from "motion/react";
import { fetchLogout, getAuctionSearchResults } from "@/utils/fetchFunctions";
import { ErrorType } from "@/types/errorTypes";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import SearchIcon from "@mui/icons-material/Search";
import Popper from "@mui/material/Popper";
import Paper from "@mui/material/Paper";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { Fade } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Skeleton from "@mui/material/Skeleton";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { Auction } from "@/types/backendAuctionTypes";
import LocationEdit from "@/components/locationEdit";

const navVariants = {
  hidden: {
    opacity: 0,
    y: "-20px",
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

type Option = {
  game: "Pokemon" | "MTG" | "Yugioh" | null;
  name: string;
  auctionId: string;
  category?: string;
};

export default function Navbar({
  user,
  userLoading,
  setCurPage,
  curPage,
  setUser,
  setToast,
  context,
}: {
  user: User | null;
  userLoading: boolean;
  setCurPage: (page: PageName, context?: string) => void;
  curPage: PageName;
  setUser: (user: User | null) => void;
  setToast: (error: ErrorType) => void;
  context: string;
}) {
  const [accountPopperOpen, setAccountPopperOpen] = useState(false);
  const accountAnchor = useRef<HTMLButtonElement | null>(null);

  const [locationEditOpen, setLocationEditOpen] = useState(false);

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

  // MUI Autocomplete controlled input state
  const [inputValue, setInputValue] = useState("");

  function handleSignout(event: React.MouseEvent<HTMLButtonElement>): void {
    if (!user) {
      return;
    }

    fetchLogout(setToast, (user: User | null) => {
      setUser(user);
      setCurPage("home");
    });
  }

  function handleAccountPopperClick(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;

    if (target.classList.contains(styles.account_popper_section_item)) {
      setAccountPopperOpen(false);
    }
  }

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCurPage("results", JSON.stringify({ search: inputValue }));
  }

  function redirectToSearchResults(category: string) {
    setCurPage("results", JSON.stringify({ category, search: inputValue }));
  }

  const [optionsLoading, setOptionsLoading] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (inputValue === "") {
        setOptions([]);
        return;
      }

      setOptionsLoading(true);
      getAuctionSearchResults(setToast, { name: inputValue }).then(
        (results) => {
          const auctions = results.auctions as Auction[];
          const options = auctions?.map((auction) => {
            if (auction.bundle) {
              return {
                game: auction.bundle.game,
                name: auction.name,
                auctionId: auction.auctionId,
              };
            } else {
              return {
                game: auction.cards[0].game,
                name: auction.name,
                auctionId: auction.auctionId,
              };
            }
          });

          setOptions(options || []);
          setOptionsLoading(false);
        },
        (err) => {
          setToast(err);
          setOptionsLoading(false);
        }
      );
    }, 500);

    return () => clearTimeout(timeout);
  }, [inputValue, setToast]);

  return (
    <>
      <motion.nav
        className={styles.container}
        variants={navVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <motion.div className={styles.main} ref={ref}>
          <button className={styles.logo} onClick={() => setCurPage("home")}>
            <Image
              src="/superbiddo-logo.svg"
              alt="SuperBiddo Logo"
              fill
              priority
            />
          </button>
          <form className={styles.search} onSubmit={handleSearch}>
            <Autocomplete
              freeSolo
              value={inputValue}
              onInputChange={(event, newInputValue) => {
                setInputValue(newInputValue);
              }}
              disableClearable
              handleHomeEndKeys
              loading={optionsLoading}
              loadingText="Loading..."
              options={options}
              getOptionLabel={(option) =>
                typeof option === "string" ? option : option.name
              }
              filterOptions={(options, params) => {
                // Max 10 option results
                const filteredOptions = options.slice(0, 10);

                if (params.inputValue !== "") {
                  filteredOptions.push({
                    game: null,
                    name: `Search for "${params.inputValue}" in Pokémon`,
                    auctionId: "",
                    category: "pokemon",
                  });
                  filteredOptions.push({
                    game: null,
                    name: `Search for "${params.inputValue}" in Magic: The Gathering`,
                    auctionId: "",
                    category: "mtg",
                  });
                  filteredOptions.push({
                    game: null,
                    name: `Search for "${params.inputValue}" in Yu-Gi-Oh!`,
                    auctionId: "",
                    category: "yugioh",
                  });
                }
                return filteredOptions;
              }}
              renderOption={(props, option) => {
                const { key, ...optionProps } = props;
                return (
                  <Box
                    component="li"
                    key={key + option.auctionId}
                    {...optionProps}
                    title={
                      !option.game
                        ? undefined
                        : `${option.name} (${option.game})`
                    }
                    onClick={(e) => {
                      if (!!optionProps.onClick) {
                        optionProps.onClick(e);
                      }
                      if (!option.game) {
                        setCurPage(
                          "results",
                          JSON.stringify({
                            search: option.name.split('"').at(1) || "",
                            category: option.category,
                          })
                        );
                        setTimeout(() => {
                          setInputValue(option.name.split('"').at(1) || "");
                        }, 500);
                      } else {
                        setCurPage(
                          "auction",
                          JSON.stringify({ auctionId: option.auctionId })
                        );
                      }
                    }}
                  >
                    <SearchIcon />
                    <div className={styles.search_option}>{option.name}</div>
                    {option.game && (
                      <p className={styles.search_option_game}>
                        {" "}
                        — {option.game}
                      </p>
                    )}
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search SuperBiddo"
                  variant="outlined"
                  slotProps={{
                    input: {
                      ...params.InputProps, // NOT inputProps
                      endAdornment: (
                        <>
                          {optionsLoading && (
                            <CircularProgress
                              color="info"
                              size={20}
                              sx={{ marginRight: "10px" }}
                            />
                          )}
                          <IconButton
                            sx={{
                              // Filled IconButton: https://github.com/mui/material-ui/issues/37443
                              backgroundColor: "primary.main",
                              color: "white",
                              "&:hover": { backgroundColor: "primary.dark" },
                              "&:focus": { backgroundColor: "primary.dark" },
                            }}
                            title="Search SuperBiddo"
                            type="submit"
                          >
                            <SearchIcon />
                          </IconButton>
                        </>
                      ),
                    },
                  }}
                />
              )}
            />
          </form>

          {userLoading ? (
            <div>
              <Skeleton
                variant="text"
                sx={{ fontSize: "1.5em", marginBottom: "-5px" }}
                width={100}
              />
              <Skeleton variant="text" sx={{ fontSize: "2em" }} width={120} />
            </div>
          ) : (
            <div className={styles.right}>
              <div className={styles.user}>
                {user ? (
                  <>
                    <button
                      className={styles.user_avatar}
                      ref={accountAnchor}
                      onMouseOver={() => setAccountPopperOpen(true)}
                      onMouseOut={() => setAccountPopperOpen(false)}
                      onClick={() => setAccountPopperOpen(!accountPopperOpen)}
                    >
                      <p className={styles.session_msg}>
                        Hello, {user?.username || "User"}
                      </p>
                      <p className={styles.session_submsg}>
                        Account & Lists <ArrowDropDownIcon fontSize="small" />
                      </p>
                    </button>

                    <Popper
                      open={accountPopperOpen}
                      anchorEl={accountAnchor.current}
                      placement="bottom-end"
                      onMouseEnter={() => setAccountPopperOpen(true)}
                      onMouseLeave={() => setAccountPopperOpen(false)}
                      onClick={handleAccountPopperClick}
                      sx={{ zIndex: 1300 }}
                      transition
                    >
                      {({ TransitionProps }) => (
                        <Fade {...TransitionProps} timeout={350}>
                          <Paper elevation={3} sx={{ marginTop: "10px" }}>
                            <div className={styles.account_popper}>
                              <Paper
                                variant="outlined"
                                sx={{
                                  backgroundColor: "secondary.light",
                                  borderStyle: "none",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "10px 20px",
                                }}
                              >
                                <div className={styles.account_popper_row}>
                                  <div className={styles.account_popper_avatar}>
                                    <AccountCircleIcon fontSize="inherit" />
                                  </div>
                                  <div
                                    className={
                                      styles.account_popper_username_email
                                    }
                                  >
                                    <p
                                      className={styles.account_popper_username}
                                    >
                                      {user.username}{" "}
                                    </p>
                                    <p
                                      className={styles.account_popper_email}
                                      title={user.email}
                                    >
                                      {user.email}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  className={styles.signout}
                                  onClick={handleSignout}
                                >
                                  <p className={styles.signout_text}>
                                    Sign out
                                  </p>
                                  <ChevronRightIcon />
                                </button>
                              </Paper>

                              <div className={styles.account_popper_bottom}>
                                <div className={styles.my_superbiddo}>
                                  <p
                                    className={
                                      styles.account_popper_section_heading
                                    }
                                  >
                                    My SuperBiddo
                                  </p>
                                  <div
                                    className={
                                      styles.account_popper_section_list
                                    }
                                  >
                                    <button
                                      className={
                                        styles.account_popper_section_item
                                      }
                                      onClick={() => setCurPage("yourListings")}
                                    >
                                      My Listings
                                    </button>
                                    <button
                                      className={
                                        styles.account_popper_section_item
                                      }
                                      onClick={() => setCurPage("yourBiddings")}
                                    >
                                      Bid History
                                    </button>
                                    <button
                                      className={
                                        styles.account_popper_section_item
                                      }
                                      onClick={() =>
                                        setCurPage(
                                          "yourBiddings",
                                          JSON.stringify({ filter: "Won" })
                                        )
                                      }
                                    >
                                      Purchase History
                                    </button>
                                    <button
                                      className={
                                        styles.account_popper_section_item
                                      }
                                      onClick={() => setCurPage("watchList")}
                                    >
                                      Watch List
                                    </button>
                                    <div
                                      className={
                                        styles.account_popper_horizontal_divider
                                      }
                                    />
                                    <button
                                      className={
                                        styles.account_popper_section_item
                                      }
                                      onClick={() => setCurPage("create")}
                                    >
                                      Sell
                                    </button>
                                  </div>
                                </div>

                                <div
                                  className={
                                    styles.account_popper_vertical_divider
                                  }
                                />

                                <div className={styles.my_account}>
                                  <p
                                    className={
                                      styles.account_popper_section_heading
                                    }
                                  >
                                    My Account
                                  </p>
                                  <div
                                    className={
                                      styles.account_popper_section_list
                                    }
                                  >
                                    <button
                                      className={
                                        styles.account_popper_section_item
                                      }
                                      onClick={handleSignout}
                                    >
                                      Sign Out
                                    </button>
                                    <div
                                      className={
                                        styles.account_popper_horizontal_divider
                                      }
                                    />
                                    <button
                                      className={
                                        styles.account_popper_section_item
                                      }
                                      onClick={() => setLocationEditOpen(true)}
                                    >
                                      Location Settings
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Paper>
                        </Fade>
                      )}
                    </Popper>
                  </>
                ) : (
                  <p className={styles.no_session_msg}>
                    Hello, guest! <br />
                    <button
                      className={styles.link}
                      onClick={() =>
                        setCurPage(
                          "login",
                          JSON.stringify({
                            next: curPage,
                            ...JSON.parse(context),
                          })
                        )
                      }
                    >
                      Login
                    </button>{" "}
                    or{" "}
                    <button
                      className={styles.link}
                      onClick={() =>
                        setCurPage(
                          "signup",
                          JSON.stringify({
                            next: curPage,
                            ...JSON.parse(context),
                          })
                        )
                      }
                    >
                      signup
                    </button>
                  </p>
                )}
              </div>
            </div>
          )}
        </motion.div>
        <div className={styles.links_container} ref={linksRef}>
          <ul className={styles.links}>
            <li className={styles.page_link}>
              <button
                className={styles.page_button}
                onClick={() => redirectToSearchResults("pokemon")}
              >
                Pokémon
              </button>
            </li>
            <li className={styles.page_link}>
              <button
                className={styles.page_button}
                onClick={() => redirectToSearchResults("mtg")}
              >
                Magic: The Gathering
              </button>
            </li>
            <li className={styles.page_link}>
              <button
                className={styles.page_button}
                onClick={() => redirectToSearchResults("yugioh")}
              >
                Yu-Gi-Oh!
              </button>
            </li>
            <li className={styles.page_link}>
              <button
                className={styles.page_button}
                onClick={() => setCurPage("results")}
              >
                All Listings
              </button>
            </li>
          </ul>
        </div>
      </motion.nav>

      <LocationEdit
        locationEditOpen={locationEditOpen && !!user}
        setLocationEditOpen={setLocationEditOpen}
        setToast={setToast}
        user={user}
      />
    </>
  );
}

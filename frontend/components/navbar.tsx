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
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
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

// TODO: Use real search options
type Option = {
  game:
    | "Pokémon"
    | "Magic: The Gathering"
    | "Yu-Gi-Oh!"
    | "Bundles"
    | "Other Cards"
    | null;
  name: string;
};

const options: Option[] = [
  {
    game: "Pokémon",
    name: "Charizard",
  },
  {
    game: "Magic: The Gathering",
    name: "Black Lotus",
  },
  {
    game: "Yu-Gi-Oh!",
    name: "Blue-Eyes White Dragon",
  },
  {
    game: "Bundles",
    name: "Booster Box",
  },
  {
    game: "Other Cards",
    name: "Base Set",
  },
  {
    game: "Pokémon",
    name: "Pikachu",
  },
  {
    game: "Magic: The Gathering",
    name: "Sol Ring",
  },
  {
    game: "Bundles",
    name: "Starter Deck",
  },
  {
    game: "Other Cards",
    name: "Promo Card",
  },
  {
    game: "Pokémon",
    name: "Blastoise",
  },
  {
    game: "Pokémon",
    name: "Venusaur",
  },
  {
    game: "Magic: The Gathering",
    name: "Mox Pearl",
  },
  {
    game: "Magic: The Gathering",
    name: "Mox Sapphire",
  },
  {
    game: "Yu-Gi-Oh!",
    name: "Exodia",
  },
  {
    game: "Yu-Gi-Oh!",
    name: "Dark Magician",
  },
  {
    game: "Bundles",
    name: "Booster Pack",
  },
  {
    game: "Bundles",
    name: "Deck Box",
  },
  {
    game: "Other Cards",
    name: "Secret Rare",
  },
  {
    game: "Pokémon",
    name: "Mewtwo",
  },
  {
    game: "Pokémon",
    name: "Mew",
  },
  {
    game: "Pokémon",
    name: "Gengar",
  },
  {
    game: "Magic: The Gathering",
    name: "Mox Jet",
  },
  {
    game: "Magic: The Gathering",
    name: "Mox Ruby",
  },
  {
    game: "Magic: The Gathering",
    name: "Mox Emerald",
  },
  {
    game: "Yu-Gi-Oh!",
    name: "Blue-Eyes Ultimate Dragon",
  },
];

const filter = createFilterOptions<Option>();

const iconPaths = {
  Pokémon: "/pokemon-logo.png",
  "Magic: The Gathering": "/mtg-logo.png",
  "Yu-Gi-Oh!": "/yugioh-logo.png",
  Bundles: "/bundle-icon.png",
};

export default function Navbar({
  user,
  userLoading,
  setCurPage,
  curPage,
  setUser,
  setToast,
}: {
  user: User | null;
  userLoading: boolean;
  setCurPage: (page: PageName, context?: string) => void;
  curPage: PageName;
  setUser: (user: User | null) => void;
  setToast: (error: ErrorType) => void;
}) {
  const [accountPopperOpen, setAccountPopperOpen] = useState(false);
  const accountAnchor = useRef<HTMLButtonElement | null>(null);

  // TODO: Mock data
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
          <Image
            src="/superbiddo-logo.svg"
            alt="SuperBiddo Logo"
            fill
            priority
          />
        </button>
        <form className={styles.search} onSubmit={handleSearch}>
          {/* TODO: Extract autocomplete value from below component */}
          {/* TODO: Figure out loading autocomplete */}
          <Autocomplete
            freeSolo
            value={inputValue}
            onInputChange={(event, newInputValue) => {
              setInputValue(newInputValue);
            }}
            disableClearable
            handleHomeEndKeys
            options={options}
            getOptionLabel={(option) =>
              typeof option === "string" ? option : option.name
            }
            filterOptions={(options, params) => {
              // TODO: Stop using filter() once we have real search options
              const filtered = filter(options, params);
              if (params.inputValue !== "") {
                filtered.push({
                  game: null,
                  name: `Search for "${params.inputValue}" in Pokémon`,
                });
                filtered.push({
                  game: null,
                  name: `Search for "${params.inputValue}" in Magic: The Gathering`,
                });
                filtered.push({
                  game: null,
                  name: `Search for "${params.inputValue}" in Yu-Gi-Oh!`,
                });
              }
              return filtered;
            }}
            renderOption={(props, option) => {
              const { key, ...optionProps } = props;
              // TODO: Clicking option should redirect to appropriate auction page
              return (
                <Box
                  component="li"
                  key={key}
                  {...optionProps}
                  title={
                    !option.game ? undefined : `${option.name} (${option.game})`
                  }
                  onClick={(e) => {
                    if (!!optionProps.onClick) {
                      optionProps.onClick(e);
                    }
                    // TODO: Fix bug where clicking "Search for <x> in <y>" literally searches for that string
                    setCurPage(
                      "results",
                      JSON.stringify({ search: option.name })
                    );
                  }}
                >
                  {!option.game || option.game === "Other Cards" ? (
                    <SearchIcon />
                  ) : (
                    <Image
                      src={iconPaths[option.game]}
                      alt={option.name}
                      width={25}
                      height={25}
                      style={{ objectFit: "cover" }}
                    />
                  )}
                  <div className={styles.search_option}>{option.name}</div>
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
            {user && (
              <div className={styles.notifications}>
                <IconButton title="My Notifications">
                  <NotificationsIcon fontSize="large" />
                </IconButton>

                {notificationCount > 0 && (
                  <div className={styles.notifications_count}>
                    {notificationCount}
                  </div>
                )}
              </div>
            )}
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
                    sx={{ zIndex: 9999 }}
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
                                  <p className={styles.account_popper_username}>
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
                                <p className={styles.signout_text}>Sign out</p>
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
                                  className={styles.account_popper_section_list}
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
                                    // TODO: Set my bids filter to "won"
                                    onClick={() => setCurPage("yourBiddings")}
                                  >
                                    Purchase History
                                  </button>
                                  <button
                                    className={
                                      styles.account_popper_section_item
                                    }
                                    // TODO: Implement watch list
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
                                  className={styles.account_popper_section_list}
                                >
                                  <button
                                    className={
                                      styles.account_popper_section_item
                                    }
                                    onClick={() =>
                                      setCurPage(
                                        "login",
                                        JSON.stringify({ next: curPage })
                                      )
                                    }
                                  >
                                    Switch Accounts
                                  </button>
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
                                  >
                                    Settings
                                  </button>
                                  <button
                                    className={
                                      styles.account_popper_section_item
                                    }
                                  >
                                    Payment Settings
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
        )}
      </motion.div>
      {/* TODO: Make links redirect to search results with appropriate filter */}
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
  );
}

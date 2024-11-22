import { ErrorType } from "@/types/errorTypes";
import { PageName } from "@/types/pageTypes";
import { User } from "@/types/userTypes";
import { useState, useRef, useEffect } from "react";
import styles from "@/styles/results.module.css";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Popper from "@mui/material/Popper";
import Paper from "@mui/material/Paper";
import Checkbox from "@mui/material/Checkbox";
import { Fade } from "@mui/material";
import { ClickAwayListener } from "@mui/base/ClickAwayListener";
import FormControl from "@mui/material/FormControl";
import FormGroup from "@mui/material/FormGroup";
import FormLabel from "@mui/material/FormLabel";
import FormControlLabel from "@mui/material/FormControlLabel";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Drawer from "@mui/material/Drawer";
import InputLabel from "@mui/material/InputLabel";
import Pagination from "@mui/material/Pagination";
import {
  AuctionQualityFilters,
  AuctionFoilFilters,
  AuctionPriceFilters,
  AuctionCategoryFilters,
  AuctionSortByOption,
  AuctionSearchQuery,
  Auction,
} from "@/types/auctionTypes";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import Skeleton from "@mui/material/Skeleton";
import MuiAccordion, { AccordionProps } from "@mui/material/Accordion";
import MuiAccordionSummary, {
  AccordionSummaryProps,
} from "@mui/material/AccordionSummary";
import MuiAccordionDetails, {
  AccordionDetailsProps,
} from "@mui/material/AccordionDetails";
import { styled } from "@mui/material/styles";
import cardRarities from "@/types/cardGameInfo";
import Listing from "@/components/listing";
import { getAuctionSearchResults } from "@/utils/fetchFunctions";

// TODO: Remove this when we have a backend
enum Game {
  MTG = "MTG",
  YGO = "YGO",
  PKM = "PKM",
  DBS = "DBS",
  FF = "FF",
  WS = "WS",
  VG = "VG",
}
enum Quality {
  NM = "NM",
  LP = "LP",
  MP = "MP",
  HP = "HP",
}
enum Rarity {
  C = "C",
  U = "U",
  R = "R",
  M = "M",
}

//////////////////////////////////////////////////
//            MUI STYLED ACCORDION              //
//////////////////////////////////////////////////

const Accordion = styled((props: AccordionProps) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  backgroundColor: "transparent",
  border: "none",
  "&:not(:last-child)": {
    borderBottom: "1px solid lightgray",
  },
  "&:before": {
    display: "none",
  },
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary {...props} />
))(({ theme }) => ({
  backgroundColor: "transparent",
  marginBottom: -1,
  minHeight: 56,
  fontSize: "1.1rem",
  fontWeight: 600,
  "&.Mui-expanded": {
    minHeight: 56,
  },
  "& .MuiAccordionSummary-content": {
    margin: "12px 0",
  },
}));

const AccordionDetails = styled((props: AccordionDetailsProps) => (
  <MuiAccordionDetails {...props} />
))(({ theme }) => ({
  padding: theme.spacing(2),
  paddingTop: 0,
}));

/**
 * Search Results page.
 * @param context.category - Category to filter by ("pokemon" | "mtg" | "yugioh" | "bundles").
 * @param context.searchQuery - Search query to filter by.
 */
export default function Results({
  setCurPage,
  user,
  setToast,
  context,
}: {
  setCurPage: (page: PageName, context?: string) => void;
  user: User | null;
  setToast: (err: ErrorType) => void;
  context: string;
}) {
  //////////////////////////////////////////////////
  //                 MOCK DATA                    //
  //////////////////////////////////////////////////

  const auction = {
    auctionId: "TODO",
    auctioneerId: "TODO",
    name: "Charizard 181 Set 1999 Addition Exclusive Rare Card 51/234 Last in Collection",
    description: "This is the last of its kind. Buy now.",
    startPrice: 0.5,
    spread: 1,
    startTime: new Date(),
    endTime: new Date(),
    currentPrice: 500.69,
    topBid: {
      bidId: "TODO",
      bidderId: "TODO",
      auctionId: "TODO",
      amount: 500.69,
      timestamp: new Date(),
    },
    numBids: 1,
    cards: [
      {
        cardId: "TODO",
        game: Game.PKM,
        name: "Charizard 181 Set 1999 Addition Exclusive Rare Card 51/234 Last in Collection",
        description:
          "Charizard 181 Set 1999 Addition Exclusive Rare Card 51/234 Last in Collection",
        manufacturer: "Nintendo",
        quality: Quality.NM,
        rarity: Rarity.C,
        set: "1999 Addition",
        isFoil: false,
      },
    ],
    bundle: undefined,
  };

  //////////////////////////////////////////////////
  //                 FORM STATE                   //
  //////////////////////////////////////////////////

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchValue, setSearchValue] = useState<string>("");
  const [resultsLoading, setResultsLoading] = useState(true);
  const [results, setResults] = useState<Auction[]>([]);
  const [resultCount, setResultCount] = useState(0);
  const [resultsPageNum, setResultsPageNum] = useState(1);
  const [redirectedCount, setRedirectedCount] = useState(0);

  // WHEN CONTEXT (search input) CHANGES, UPDATE SEARCH VALUE
  useEffect(() => {
    let search = JSON.parse(context)?.search;
    setSearchValue(search);
  }, [context]);

  // WHEN SEARCH VALUE CHANGES, RESET PAGE NUM, RESULTS, LOADING, AND FETCH RESULTS
  useEffect(() => {
    if (searchValue || !JSON.parse(context)?.search || redirectedCount > 0) {
      setResultsPageNum(1);
      fetchResults(1);
      setRedirectedCount(1);
    }
  }, [searchValue]);

  const [qualityPopperOpen, setQualityPopperOpen] = useState(false);
  const [foilPopperOpen, setFoilPopperOpen] = useState(false);
  const qualityAnchorEl = useRef<HTMLButtonElement | null>(null);
  const foilAnchorEl = useRef<HTMLButtonElement | null>(null);

  const [qualitySearchFilters, setQualitySearchFilters] =
    useState<AuctionQualityFilters>({
      default: true,
      graded: false,
      psaGrade: false,
      lowGrade: null,
      highGrade: null,
      ungraded: false,
      mint: false,
      nearMint: false,
      lightlyPlayed: false,
      moderatelyPlayed: false,
      heavilyPlayed: false,
      damaged: false,
    });

  const [foilSearchFilter, setFoilSearchFilter] =
    useState<AuctionFoilFilters>("default");

  const [categorySearchFilters, setCategorySearchFilters] =
    useState<AuctionCategoryFilters>({
      default: true,
      pokemon: false,
      mtg: false,
      yugioh: false,
      bundles: false,
    });

  // Rarities change based on category
  const [pokemonRarityFilter, setPokemonRarityFilter] =
    useState<string>("default");
  const [mtgRarityFilter, setMtgRarityFilter] = useState<string>("default");
  const [yugiohRarityFilter, setYugiohRarityFilter] =
    useState<string>("default");
  const [bundlesRarityFilter, setBundlesRarityFilter] =
    useState<string>("default");

  const [priceSearchFilters, setPriceSearchFilters] =
    useState<AuctionPriceFilters>({
      includeMinPrice: false,
      includeMaxPrice: false,
      minPrice: null,
      maxPrice: null,
    });

  const [sortBy, setSortBy] = useState<AuctionSortByOption>("endTimeAsc");

  function fetchResults(page: number) {
    setResults([]);
    setResultsLoading(true);

    // TODO: Quality, rarity, sort by

    let searchParams: AuctionSearchQuery = {};

    // NAME
    if (searchValue.trim()) {
      searchParams.cardName = searchValue.trim();
    }

    // GAMES
    let categories = [];
    if (categorySearchFilters.pokemon) {
      categories.push("pokemon");
    }
    if (categorySearchFilters.mtg) {
      categories.push("mtg");
    }
    if (categorySearchFilters.yugioh) {
      categories.push("yugioh");
    }
    if (categories.length > 0) searchParams.cardGame = categories;

    // PRICE
    if (priceSearchFilters.includeMinPrice && priceSearchFilters.minPrice) {
      searchParams.minMinNewBidPrice = priceSearchFilters.minPrice;
    }
    if (priceSearchFilters.includeMaxPrice && priceSearchFilters.maxPrice) {
      searchParams.maxMinNewBidPrice = priceSearchFilters.maxPrice;
    }

    // FOIL
    if (foilSearchFilter === "foil") {
      searchParams.cardIsFoil = true;
    } else if (foilSearchFilter === "noFoil") {
      searchParams.cardIsFoil = false;
    }

    // SORT BY
    searchParams.sortBy = sortBy;

    // PAGE NUMBER
    searchParams.page = page;

    getAuctionSearchResults(setToast, searchParams).then(
      (results) => {
        setResults(results.auctions);
        setResultCount(results.totalNumAuctions);
        setResultsLoading(false);
      },
      (err) => {
        setToast(err);
        setResultsLoading(false);
      }
    );
  }

  // WHEN FILTERS CHANGE, AFTER 1 SECOND OF NO CHANGE, RESET PAGE NUM AND FETCH RESULTS
  const [timesFiltersChanged, setTimesFiltersChanged] = useState(0);
  useEffect(() => {
    // Don't run on initial render
    if (timesFiltersChanged === 0) {
      setTimesFiltersChanged(1);
      return;
    } else {
      const timeout = setTimeout(() => {
        setResultsPageNum(1);
        fetchResults(1);
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [
    qualitySearchFilters,
    foilSearchFilter,
    categorySearchFilters,
    priceSearchFilters,
    sortBy,
  ]);

  //////////////////////////////////////////////////
  //              FORM HANDLERS                   //
  //////////////////////////////////////////////////

  // Navigated to results from clicking Category
  useEffect(() => {
    let category = JSON.parse(context).category;
    if (!category) return;

    let newFilters = {
      pokemon: category === "pokemon",
      mtg: category === "mtg",
      yugioh: category === "yugioh",
      bundles: category === "bundles",
    };

    setCategorySearchFilters({
      ...newFilters,
      default: !(
        newFilters.pokemon ||
        newFilters.mtg ||
        newFilters.yugioh ||
        newFilters.bundles
      ),
    });
  }, [context]);

  function handleQualityChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, checked } = event.target;

    if (name === "default") {
      setQualitySearchFilters((prev) => ({
        ...prev,
        default: checked || true,
        graded: false,
        psaGrade: false,
        ungraded: false,
        mint: false,
        nearMint: false,
        lightlyPlayed: false,
        moderatelyPlayed: false,
        heavilyPlayed: false,
        damaged: false,
      }));
    } else if (name === "graded") {
      setQualitySearchFilters((prev) => ({
        ...prev,
        default: !(checked || prev.ungraded),
        graded: checked,
        psaGrade: checked && prev.psaGrade,
      }));
    } else if (name === "psaGrade") {
      setQualitySearchFilters((prev) => ({
        ...prev,
        default: false,
        graded: checked || prev.graded,
        psaGrade: checked,
      }));
    } else if (name === "ungraded") {
      setQualitySearchFilters((prev) => ({
        ...prev,
        default: !(checked || prev.graded),
        ungraded: checked,
        mint: checked,
        nearMint: checked,
        lightlyPlayed: checked,
        moderatelyPlayed: checked,
        heavilyPlayed: checked,
        damaged: checked,
      }));
    } else {
      setQualitySearchFilters((prev) => {
        let newFilters = { ...prev, [name]: checked };

        return {
          ...prev,
          default: !(
            newFilters.graded ||
            newFilters.mint ||
            newFilters.nearMint ||
            newFilters.lightlyPlayed ||
            newFilters.moderatelyPlayed ||
            newFilters.heavilyPlayed ||
            newFilters.damaged
          ),
          ungraded:
            newFilters.mint ||
            newFilters.nearMint ||
            newFilters.lightlyPlayed ||
            newFilters.moderatelyPlayed ||
            newFilters.heavilyPlayed ||
            newFilters.damaged,
          [name]: checked,
        };
      });
    }
  }

  function handlePSAChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    let grade = parseInt(value);

    if (value === "") {
      setQualitySearchFilters((prev) => ({
        ...prev,
        [name]: null,
      }));
    } else if (isNaN(grade) || grade < 1 || grade > 10) {
      // TODO: Show error message
    } else {
      setQualitySearchFilters((prev) => ({
        ...prev,
        [name]: grade,
      }));
    }
  }

  function handleFoilChange(event: React.ChangeEvent<HTMLInputElement>) {
    setFoilSearchFilter(event.target.value as AuctionFoilFilters);
  }

  function handleCategoryChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, checked } = event.target;

    if (name === "all") {
      setCategorySearchFilters((prev) => ({
        default: checked || true,
        pokemon: false,
        mtg: false,
        yugioh: false,
        bundles: false,
      }));
      setPokemonRarityFilter("default");
      setMtgRarityFilter("default");
      setYugiohRarityFilter("default");
      setBundlesRarityFilter("default");
    } else {
      setCategorySearchFilters((prev) => {
        let newFilters = { ...prev, [name]: checked };

        switch (name) {
          case "pokemon":
            setPokemonRarityFilter("default");
            break;
          case "mtg":
            setMtgRarityFilter("default");
            break;
          case "yugioh":
            setYugiohRarityFilter("default");
            break;
          case "bundles":
            setBundlesRarityFilter("default");
            break;
        }

        return {
          ...newFilters,
          default: !(
            newFilters.pokemon ||
            newFilters.mtg ||
            newFilters.yugioh ||
            newFilters.bundles
          ),
        };
      });
    }
  }

  function handlePokemonRarityChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setPokemonRarityFilter(event.target.value);
  }
  function handleMtgRarityChange(event: React.ChangeEvent<HTMLInputElement>) {
    setMtgRarityFilter(event.target.value);
  }
  function handleYugiohRarityChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setYugiohRarityFilter(event.target.value);
  }
  function handleBundlesRarityChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setBundlesRarityFilter(event.target.value);
  }

  function handlePriceCheckChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, checked } = event.target;

    setPriceSearchFilters((prev) => ({
      ...prev,
      [name]: checked,
    }));
  }

  function handlePriceChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    let price = parseFloat(value);

    if (value === "") {
      setPriceSearchFilters((prev) => ({
        ...prev,
        [name]: null,
      }));
    } else if (isNaN(price) || price < 0) {
      // TODO: Show error message
    } else {
      setPriceSearchFilters((prev) => ({
        ...prev,
        [name]: price,
      }));
    }
  }

  function handleSortByChange(event: SelectChangeEvent) {
    setSortBy(event.target.value as AuctionSortByOption);
  }

  function changeResultsPageNum(value: number) {
    if (resultsPageNum !== value) fetchResults(value);
    setResultsPageNum(value);
  }

  return (
    <>
      <main className={styles.main}>
        <div className={styles.left_filters}>
          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<KeyboardArrowDownIcon />}
              aria-controls="categories-content"
            >
              Game
            </AccordionSummary>
            <AccordionDetails>
              <div className={styles.categories}>
                <FormControl component="fieldset">
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={categorySearchFilters.default}
                          onChange={handleCategoryChange}
                          name="all"
                        />
                      }
                      label="All"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={categorySearchFilters.pokemon}
                          onChange={handleCategoryChange}
                          name="pokemon"
                        />
                      }
                      label="Pokémon"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={categorySearchFilters.mtg}
                          onChange={handleCategoryChange}
                          name="mtg"
                        />
                      }
                      label="Magic: The Gathering"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={categorySearchFilters.yugioh}
                          onChange={handleCategoryChange}
                          name="yugioh"
                        />
                      }
                      label="Yu-Gi-Oh!"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={categorySearchFilters.bundles}
                          onChange={handleCategoryChange}
                          name="bundles"
                        />
                      }
                      label="Bundles"
                    />
                  </FormGroup>
                </FormControl>
              </div>
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<KeyboardArrowDownIcon />}
              aria-controls="prices-content"
            >
              Price
            </AccordionSummary>
            <AccordionDetails>
              <div className={styles.prices}>
                <FormControl component="fieldset">
                  <FormGroup sx={{ marginBottom: "15px" }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={priceSearchFilters.includeMinPrice}
                          onChange={handlePriceCheckChange}
                          name="includeMinPrice"
                        />
                      }
                      label={
                        <TextField
                          label="Min Price"
                          variant="outlined"
                          size="small"
                          value={priceSearchFilters.minPrice || ""}
                          onChange={handlePriceChange}
                          name="minPrice"
                          autoComplete="off"
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  $
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                      }
                    />
                  </FormGroup>

                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={priceSearchFilters.includeMaxPrice}
                          onChange={handlePriceCheckChange}
                          name="includeMaxPrice"
                        />
                      }
                      label={
                        <TextField
                          label="Max Price"
                          variant="outlined"
                          size="small"
                          value={priceSearchFilters.maxPrice || ""}
                          onChange={handlePriceChange}
                          name="maxPrice"
                          autoComplete="off"
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  $
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                      }
                    />
                  </FormGroup>
                </FormControl>
              </div>
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<KeyboardArrowDownIcon />}
              aria-controls="rarities-content"
            >
              Rarity
            </AccordionSummary>
            <AccordionDetails>
              <div className={styles.rarities}>
                {categorySearchFilters.default && (
                  <FormControl
                    component="fieldset"
                    sx={{ marginBottom: "15px" }}
                  >
                    <FormLabel component="legend">All Rarities</FormLabel>
                    <RadioGroup
                      aria-label="rarity"
                      name="rarity"
                      value="default"
                      onChange={() => {}}
                    >
                      <FormControlLabel
                        value="default"
                        defaultChecked
                        control={<Radio />}
                        label="All"
                      />
                    </RadioGroup>
                  </FormControl>
                )}

                {categorySearchFilters.pokemon && (
                  <FormControl
                    component="fieldset"
                    sx={{ marginBottom: "15px" }}
                  >
                    <FormLabel component="legend">Pokémon</FormLabel>
                    <RadioGroup
                      aria-label="rarity"
                      name="rarity"
                      value={pokemonRarityFilter}
                      onChange={handlePokemonRarityChange}
                    >
                      <FormControlLabel
                        value="default"
                        defaultChecked
                        control={<Radio />}
                        label="All"
                      />
                      {cardRarities.Pokemon.rarities.map((rarity) => (
                        <FormControlLabel
                          key={rarity}
                          value={rarity}
                          control={<Radio />}
                          label={rarity}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                )}

                {categorySearchFilters.mtg && (
                  <FormControl
                    component="fieldset"
                    sx={{ marginBottom: "15px" }}
                  >
                    <FormLabel component="legend">
                      Magic: The Gathering
                    </FormLabel>
                    <RadioGroup
                      aria-label="rarity"
                      name="rarity"
                      value={mtgRarityFilter}
                      onChange={handleMtgRarityChange}
                    >
                      <FormControlLabel
                        value="default"
                        defaultChecked
                        control={<Radio />}
                        label="All"
                      />
                      {cardRarities.MTG.rarities.map((rarity) => (
                        <FormControlLabel
                          key={rarity}
                          value={rarity}
                          control={<Radio />}
                          label={rarity}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                )}

                {categorySearchFilters.yugioh && (
                  <FormControl
                    component="fieldset"
                    sx={{ marginBottom: "15px" }}
                  >
                    <FormLabel component="legend">Yu-Gi-Oh!</FormLabel>
                    <RadioGroup
                      aria-label="rarity"
                      name="rarity"
                      value={yugiohRarityFilter}
                      onChange={handleYugiohRarityChange}
                    >
                      <FormControlLabel
                        value="default"
                        defaultChecked
                        control={<Radio />}
                        label="All"
                      />
                      {cardRarities.Yugioh.rarities.map((rarity) => (
                        <FormControlLabel
                          key={rarity}
                          value={rarity}
                          control={<Radio />}
                          label={rarity}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                )}

                {categorySearchFilters.bundles && (
                  <FormControl
                    component="fieldset"
                    sx={{ marginBottom: "15px" }}
                  >
                    <FormLabel component="legend">Bundles</FormLabel>
                    <RadioGroup
                      aria-label="rarity"
                      name="rarity"
                      value={bundlesRarityFilter}
                      onChange={handleBundlesRarityChange}
                    >
                      <FormControlLabel
                        value="default"
                        defaultChecked
                        control={<Radio />}
                        label="All"
                      />
                    </RadioGroup>
                  </FormControl>
                )}
              </div>
            </AccordionDetails>
          </Accordion>
        </div>

        <div className={styles.results}>
          {!!searchValue.trim() && !resultsLoading && (
            <h1 className={styles.results_num}>
              <span className={styles.bold}>{resultCount}</span> results for
              &quot;
              <span className={styles.bold}>{searchValue.trim()}</span>&quot;
            </h1>
          )}

          {!searchValue.trim() && !resultsLoading && (
            <h1 className={styles.results_num}>
              <span className={styles.bold}>{resultCount}</span> results
            </h1>
          )}

          <div className={styles.filter_dropdowns}>
            <div className={styles.left_filter_dropdowns}>
              <div className={styles.left_filter_toggle}>
                <IconButton
                  size="small"
                  sx={{
                    // Filled IconButton: https://github.com/mui/material-ui/issues/37443
                    backgroundColor: "primary.light",
                    color: "white",
                    "&:hover": { backgroundColor: "primary.main" },
                    "&:focus-visible": { backgroundColor: "primary.main" },
                  }}
                  title="Show more auction filters"
                  onClick={() => setDrawerOpen(true)}
                >
                  <MenuIcon />
                </IconButton>
              </div>

              <button
                className={styles.filter_dropdown}
                style={{
                  backgroundColor: qualitySearchFilters.default
                    ? "#e9e9e9"
                    : "var(--secondary-light)",
                }}
                ref={qualityAnchorEl}
                onClick={() => setQualityPopperOpen((open) => !open)}
              >
                Quality
                <KeyboardArrowDownIcon />
              </button>
              <button
                className={styles.filter_dropdown}
                style={{
                  backgroundColor:
                    foilSearchFilter === "default"
                      ? "#e9e9e9"
                      : "var(--secondary-light)",
                }}
                ref={foilAnchorEl}
                onClick={() => setFoilPopperOpen((open) => !open)}
              >
                Foil
                <KeyboardArrowDownIcon />
              </button>
            </div>
            <div className={styles.sort}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={handleSortByChange}
                  // FIXES LAYOUT SHIFT ON CERTAIN MUI COMPONENTS
                  // https://github.com/mui/material-ui/issues/10000
                  MenuProps={{ disableScrollLock: true }}
                >
                  {/* <MenuItem value="bestMatch">Sort: Best Match</MenuItem> */}
                  <MenuItem value="endTimeAsc">Time: Ending Soon</MenuItem>
                  <MenuItem value="startTimeDesc">Time: Newly Listed</MenuItem>
                  <MenuItem value="minNewBidPriceAsc">
                    Price: Low to High
                  </MenuItem>
                  <MenuItem value="minNewBidPriceDesc">
                    Price: High to Low
                  </MenuItem>
                  <MenuItem value="bidsMostToLeast">
                    # of Bids: Most to Least
                  </MenuItem>
                  <MenuItem value="bidsLeastToMost">
                    # of Bids: Least to Most
                  </MenuItem>
                  {/* <MenuItem value="location">Location: Nearest You</MenuItem> */}
                </Select>
              </FormControl>
            </div>
          </div>

          <Popper
            sx={{ zIndex: 99 }}
            open={qualityPopperOpen}
            anchorEl={qualityAnchorEl.current}
            placement="bottom-start"
            transition
          >
            {({ TransitionProps }) => (
              <Fade {...TransitionProps} timeout={200}>
                <Paper
                  elevation={2}
                  sx={{ borderRadius: "10px", overflow: "hidden" }}
                >
                  <ClickAwayListener
                    onClickAway={() => setQualityPopperOpen(false)}
                  >
                    <div className={styles.filter_dropdown_content}>
                      <FormControl component="fieldset">
                        <FormGroup>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={qualitySearchFilters.default}
                                onChange={handleQualityChange}
                                name="default"
                              />
                            }
                            label="Any Quality"
                          />
                        </FormGroup>
                        <FormGroup>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={qualitySearchFilters.graded}
                                onChange={handleQualityChange}
                                name="graded"
                              />
                            }
                            label="Graded"
                          />
                          <div className={styles.grade_range}>
                            <div className={styles.psa_grade}>
                              <Checkbox
                                checked={qualitySearchFilters.psaGrade}
                                onChange={handleQualityChange}
                                name="psaGrade"
                                size="small"
                              />
                              <TextField
                                placeholder="Low"
                                name="lowGrade"
                                title="Min PSA grade to filter by"
                                value={qualitySearchFilters.lowGrade || ""}
                                onChange={handlePSAChange}
                                autoComplete="off"
                                variant="standard"
                                size="small"
                                sx={{
                                  width: "8ch",
                                  marginRight: "1ch",
                                }}
                                slotProps={{
                                  input: {
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        PSA
                                      </InputAdornment>
                                    ),
                                  },
                                }}
                              />
                              <span className={styles.psa_grade_to}>to</span>
                              <TextField
                                placeholder="High"
                                name="highGrade"
                                title="Max PSA grade to filter by"
                                value={qualitySearchFilters.highGrade || ""}
                                onChange={handlePSAChange}
                                autoComplete="off"
                                variant="standard"
                                size="small"
                                sx={{
                                  width: "8ch",
                                  marginLeft: "1ch",
                                }}
                                slotProps={{
                                  input: {
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        PSA
                                      </InputAdornment>
                                    ),
                                  },
                                }}
                              />
                            </div>
                          </div>
                        </FormGroup>
                        <FormGroup>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={qualitySearchFilters.ungraded}
                                onChange={handleQualityChange}
                                name="ungraded"
                              />
                            }
                            label="Ungraded"
                          />
                          <div className={styles.grade_range}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  size="small"
                                  name="mint"
                                  checked={qualitySearchFilters.mint}
                                  onChange={handleQualityChange}
                                />
                              }
                              label="Mint"
                              sx={{ marginTop: "-5px" }}
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  size="small"
                                  name="nearMint"
                                  checked={qualitySearchFilters.nearMint}
                                  onChange={handleQualityChange}
                                />
                              }
                              label="Near Mint"
                              sx={{ marginTop: "-5px" }}
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  size="small"
                                  name="lightlyPlayed"
                                  checked={qualitySearchFilters.lightlyPlayed}
                                  onChange={handleQualityChange}
                                />
                              }
                              label="Lightly Played"
                              sx={{ marginTop: "-5px" }}
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  size="small"
                                  name="moderatelyPlayed"
                                  checked={
                                    qualitySearchFilters.moderatelyPlayed
                                  }
                                  onChange={handleQualityChange}
                                />
                              }
                              label="Moderately Played"
                              sx={{ marginTop: "-5px" }}
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  size="small"
                                  name="heavilyPlayed"
                                  checked={qualitySearchFilters.heavilyPlayed}
                                  onChange={handleQualityChange}
                                />
                              }
                              label="Heavily Played"
                              sx={{ marginTop: "-5px" }}
                            />

                            <FormControlLabel
                              control={
                                <Checkbox
                                  size="small"
                                  name="damaged"
                                  checked={qualitySearchFilters.damaged}
                                  onChange={handleQualityChange}
                                />
                              }
                              label="Damaged"
                              sx={{ marginTop: "-5px" }}
                            />
                          </div>
                        </FormGroup>
                      </FormControl>
                    </div>
                  </ClickAwayListener>
                </Paper>
              </Fade>
            )}
          </Popper>

          <Popper
            sx={{ zIndex: 99 }}
            open={foilPopperOpen}
            anchorEl={foilAnchorEl.current}
            placement="bottom-start"
            transition
          >
            {({ TransitionProps }) => (
              <Fade {...TransitionProps} timeout={200}>
                <Paper
                  elevation={2}
                  sx={{ borderRadius: "10px", overflow: "hidden" }}
                >
                  <ClickAwayListener
                    onClickAway={() => setFoilPopperOpen(false)}
                  >
                    <div className={styles.filter_dropdown_content}>
                      <FormControl component="fieldset">
                        <RadioGroup
                          aria-label="foil"
                          name="foil"
                          value={foilSearchFilter}
                          onChange={handleFoilChange}
                        >
                          <FormControlLabel
                            value="default"
                            control={<Radio />}
                            label="All"
                          />
                          <FormControlLabel
                            value="foil"
                            control={<Radio />}
                            label="Foil"
                          />
                          <FormControlLabel
                            value="noFoil"
                            control={<Radio />}
                            label="No Foil"
                          />
                        </RadioGroup>
                      </FormControl>
                    </div>
                  </ClickAwayListener>
                </Paper>
              </Fade>
            )}
          </Popper>

          <div className={styles.filter_selected_options}>
            {qualitySearchFilters.graded && (
              <div className={styles.selected_option}>
                <p>
                  Quality: <span className={styles.bold_600}>Graded</span>
                </p>
                <IconButton
                  size="small"
                  onClick={() => {
                    setQualitySearchFilters((prev) => {
                      prev.graded = false;
                      prev.psaGrade = false;

                      return {
                        ...prev,
                        default: !prev.ungraded,
                      };
                    });
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </div>
            )}

            {qualitySearchFilters.psaGrade &&
              qualitySearchFilters.lowGrade !== null &&
              qualitySearchFilters.highGrade !== null && (
                <div className={styles.selected_option}>
                  <p>
                    Quality:{" "}
                    <span className={styles.bold_600}>
                      PSA {qualitySearchFilters.lowGrade} to{" "}
                      {qualitySearchFilters.highGrade} (Graded)
                    </span>
                  </p>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setQualitySearchFilters((prev) => ({
                        ...prev,
                        psaGrade: false,
                        lowGrade: null,
                        highGrade: null,
                      }));
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </div>
              )}

            {qualitySearchFilters.mint && (
              <div className={styles.selected_option}>
                <p>
                  Quality: <span className={styles.bold_600}>Mint</span>
                </p>
                <IconButton
                  size="small"
                  onClick={() => {
                    setQualitySearchFilters((prev) => {
                      prev.mint = false;

                      return {
                        ...prev,
                        default: !(
                          prev.graded ||
                          prev.nearMint ||
                          prev.lightlyPlayed ||
                          prev.moderatelyPlayed ||
                          prev.heavilyPlayed ||
                          prev.damaged
                        ),
                        ungraded:
                          prev.nearMint ||
                          prev.lightlyPlayed ||
                          prev.moderatelyPlayed ||
                          prev.heavilyPlayed ||
                          prev.damaged,
                      };
                    });
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </div>
            )}

            {qualitySearchFilters.nearMint && (
              <div className={styles.selected_option}>
                <p>
                  Quality: <span className={styles.bold_600}>Near Mint</span>
                </p>
                <IconButton
                  size="small"
                  onClick={() => {
                    setQualitySearchFilters((prev) => {
                      prev.nearMint = false;

                      return {
                        ...prev,
                        default: !(
                          prev.graded ||
                          prev.mint ||
                          prev.lightlyPlayed ||
                          prev.moderatelyPlayed ||
                          prev.heavilyPlayed ||
                          prev.damaged
                        ),
                        ungraded:
                          prev.mint ||
                          prev.lightlyPlayed ||
                          prev.moderatelyPlayed ||
                          prev.heavilyPlayed ||
                          prev.damaged,
                      };
                    });
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </div>
            )}

            {qualitySearchFilters.lightlyPlayed && (
              <div className={styles.selected_option}>
                <p>
                  Quality:{" "}
                  <span className={styles.bold_600}>Lightly Played</span>
                </p>
                <IconButton
                  size="small"
                  onClick={() => {
                    setQualitySearchFilters((prev) => {
                      prev.lightlyPlayed = false;

                      return {
                        ...prev,
                        default: !(
                          prev.graded ||
                          prev.mint ||
                          prev.nearMint ||
                          prev.moderatelyPlayed ||
                          prev.heavilyPlayed ||
                          prev.damaged
                        ),
                        ungraded:
                          prev.mint ||
                          prev.nearMint ||
                          prev.moderatelyPlayed ||
                          prev.heavilyPlayed ||
                          prev.damaged,
                      };
                    });
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </div>
            )}

            {qualitySearchFilters.moderatelyPlayed && (
              <div className={styles.selected_option}>
                <p>
                  Quality:{" "}
                  <span className={styles.bold_600}>Moderately Played</span>
                </p>
                <IconButton
                  size="small"
                  onClick={() => {
                    setQualitySearchFilters((prev) => {
                      prev.moderatelyPlayed = false;

                      return {
                        ...prev,
                        default: !(
                          prev.graded ||
                          prev.mint ||
                          prev.nearMint ||
                          prev.lightlyPlayed ||
                          prev.heavilyPlayed ||
                          prev.damaged
                        ),
                        ungraded:
                          prev.mint ||
                          prev.nearMint ||
                          prev.lightlyPlayed ||
                          prev.heavilyPlayed ||
                          prev.damaged,
                      };
                    });
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </div>
            )}

            {qualitySearchFilters.heavilyPlayed && (
              <div className={styles.selected_option}>
                <p>
                  Quality:{" "}
                  <span className={styles.bold_600}>Heavily Played</span>
                </p>
                <IconButton
                  size="small"
                  onClick={() => {
                    setQualitySearchFilters((prev) => {
                      prev.heavilyPlayed = false;

                      return {
                        ...prev,
                        default: !(
                          prev.graded ||
                          prev.mint ||
                          prev.nearMint ||
                          prev.lightlyPlayed ||
                          prev.moderatelyPlayed ||
                          prev.damaged
                        ),
                        ungraded:
                          prev.mint ||
                          prev.nearMint ||
                          prev.lightlyPlayed ||
                          prev.moderatelyPlayed ||
                          prev.damaged,
                      };
                    });
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </div>
            )}

            {qualitySearchFilters.damaged && (
              <div className={styles.selected_option}>
                <p>
                  Quality: <span className={styles.bold_600}>Damaged</span>
                </p>
                <IconButton
                  size="small"
                  onClick={() => {
                    setQualitySearchFilters((prev) => {
                      prev.damaged = false;

                      return {
                        ...prev,
                        default: !(
                          prev.graded ||
                          prev.mint ||
                          prev.nearMint ||
                          prev.lightlyPlayed ||
                          prev.moderatelyPlayed ||
                          prev.heavilyPlayed
                        ),
                        ungraded:
                          prev.mint ||
                          prev.nearMint ||
                          prev.lightlyPlayed ||
                          prev.moderatelyPlayed ||
                          prev.heavilyPlayed,
                      };
                    });
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </div>
            )}

            {foilSearchFilter !== "default" && (
              <div className={styles.selected_option}>
                <p>
                  Foil:{" "}
                  <span className={styles.bold_600}>
                    {foilSearchFilter === "foil" ? "Foil Only" : "No Foil Only"}
                  </span>
                </p>
                <IconButton
                  size="small"
                  onClick={() => setFoilSearchFilter("default")}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </div>
            )}
          </div>

          <div className={styles.results_grid}>
            {resultsLoading &&
              [...Array(20).keys()].map((i) => (
                <div className={styles.skeleton} key={i}>
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={300}
                    sx={{ borderRadius: "10px" }}
                  />
                  <Skeleton
                    width="100%"
                    sx={{ marginTop: "15px", fontSize: "1.3rem" }}
                  />
                  <Skeleton
                    width="100%"
                    sx={{ marginTop: "3px", fontSize: "1.3rem" }}
                  />
                  <Skeleton
                    width="50%"
                    sx={{ marginTop: "5px", fontSize: "0.9rem" }}
                  />
                  <div className={styles.skeleton_price_row}>
                    <Skeleton
                      width="30%"
                      sx={{ fontSize: "2.2rem", marginRight: "15px" }}
                    />
                    <Skeleton width={50} height={25} />
                  </div>

                  <Skeleton
                    width="50%"
                    sx={{ marginTop: "3px", fontSize: "0.9rem" }}
                  />
                  <Skeleton
                    width="50%"
                    sx={{ marginTop: "3px", fontSize: "0.9rem" }}
                  />
                </div>
              ))}
            {results.map((auction) => (
              <Listing
                key={auction.auctionId}
                auction={auction}
                setCurPage={setCurPage}
              />
            ))}
          </div>

          {results.length > 0 && !resultsLoading && (
            <div className={styles.pagination}>
              <Pagination
                color="primary"
                showFirstButton={Math.ceil(resultCount / 20) > 2}
                showLastButton={Math.ceil(resultCount / 20) > 2}
                count={Math.ceil(resultCount / 20)}
                page={resultsPageNum}
                onChange={(_, page) => changeResultsPageNum(page)}
              />
            </div>
          )}
        </div>
      </main>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <div className={styles.left_filters_drawer} role="presentation">
          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<KeyboardArrowDownIcon />}
              aria-controls="categories-content"
            >
              Game
            </AccordionSummary>
            <AccordionDetails>
              <div className={styles.categories}>
                <FormControl component="fieldset">
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={categorySearchFilters.default}
                          onChange={handleCategoryChange}
                          name="all"
                        />
                      }
                      label="All"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={categorySearchFilters.pokemon}
                          onChange={handleCategoryChange}
                          name="pokemon"
                        />
                      }
                      label="Pokémon"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={categorySearchFilters.mtg}
                          onChange={handleCategoryChange}
                          name="mtg"
                        />
                      }
                      label="Magic: The Gathering"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={categorySearchFilters.yugioh}
                          onChange={handleCategoryChange}
                          name="yugioh"
                        />
                      }
                      label="Yu-Gi-Oh!"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={categorySearchFilters.bundles}
                          onChange={handleCategoryChange}
                          name="bundles"
                        />
                      }
                      label="Bundles"
                    />
                  </FormGroup>
                </FormControl>
              </div>
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<KeyboardArrowDownIcon />}
              aria-controls="prices-content"
            >
              Price
            </AccordionSummary>
            <AccordionDetails>
              <div className={styles.prices}>
                <FormControl component="fieldset">
                  <FormGroup sx={{ marginBottom: "15px" }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={priceSearchFilters.includeMinPrice}
                          onChange={handlePriceCheckChange}
                          name="includeMinPrice"
                        />
                      }
                      label={
                        <TextField
                          label="Min Price"
                          variant="outlined"
                          size="small"
                          value={priceSearchFilters.minPrice || ""}
                          onChange={handlePriceChange}
                          name="minPrice"
                          autoComplete="off"
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  $
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                      }
                    />
                  </FormGroup>

                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={priceSearchFilters.includeMaxPrice}
                          onChange={handlePriceCheckChange}
                          name="includeMaxPrice"
                        />
                      }
                      label={
                        <TextField
                          label="Max Price"
                          variant="outlined"
                          size="small"
                          value={priceSearchFilters.maxPrice || ""}
                          onChange={handlePriceChange}
                          name="maxPrice"
                          autoComplete="off"
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  $
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                      }
                    />
                  </FormGroup>
                </FormControl>
              </div>
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<KeyboardArrowDownIcon />}
              aria-controls="rarities-content"
            >
              Rarity
            </AccordionSummary>
            <AccordionDetails>
              <div className={styles.rarities}>
                {categorySearchFilters.default && (
                  <FormControl
                    component="fieldset"
                    sx={{ marginBottom: "15px" }}
                  >
                    <FormLabel component="legend">All Rarities</FormLabel>
                    <RadioGroup
                      aria-label="rarity"
                      name="rarity"
                      value="default"
                      onChange={() => {}}
                    >
                      <FormControlLabel
                        value="default"
                        defaultChecked
                        control={<Radio />}
                        label="All"
                      />
                    </RadioGroup>
                  </FormControl>
                )}

                {categorySearchFilters.pokemon && (
                  <FormControl
                    component="fieldset"
                    sx={{ marginBottom: "15px" }}
                  >
                    <FormLabel component="legend">Pokémon</FormLabel>
                    <RadioGroup
                      aria-label="rarity"
                      name="rarity"
                      value={pokemonRarityFilter}
                      onChange={handlePokemonRarityChange}
                    >
                      <FormControlLabel
                        value="default"
                        defaultChecked
                        control={<Radio />}
                        label="All"
                      />
                      {cardRarities.Pokemon.rarities.map((rarity) => (
                        <FormControlLabel
                          key={rarity}
                          value={rarity}
                          control={<Radio />}
                          label={rarity}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                )}

                {categorySearchFilters.mtg && (
                  <FormControl
                    component="fieldset"
                    sx={{ marginBottom: "15px" }}
                  >
                    <FormLabel component="legend">
                      Magic: The Gathering
                    </FormLabel>
                    <RadioGroup
                      aria-label="rarity"
                      name="rarity"
                      value={mtgRarityFilter}
                      onChange={handleMtgRarityChange}
                    >
                      <FormControlLabel
                        value="default"
                        defaultChecked
                        control={<Radio />}
                        label="All"
                      />
                      {cardRarities.MTG.rarities.map((rarity) => (
                        <FormControlLabel
                          key={rarity}
                          value={rarity}
                          control={<Radio />}
                          label={rarity}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                )}

                {categorySearchFilters.yugioh && (
                  <FormControl
                    component="fieldset"
                    sx={{ marginBottom: "15px" }}
                  >
                    <FormLabel component="legend">Yu-Gi-Oh!</FormLabel>
                    <RadioGroup
                      aria-label="rarity"
                      name="rarity"
                      value={yugiohRarityFilter}
                      onChange={handleYugiohRarityChange}
                    >
                      <FormControlLabel
                        value="default"
                        defaultChecked
                        control={<Radio />}
                        label="All"
                      />
                      {cardRarities.Yugioh.rarities.map((rarity) => (
                        <FormControlLabel
                          key={rarity}
                          value={rarity}
                          control={<Radio />}
                          label={rarity}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                )}

                {categorySearchFilters.bundles && (
                  <FormControl
                    component="fieldset"
                    sx={{ marginBottom: "15px" }}
                  >
                    <FormLabel component="legend">Bundles</FormLabel>
                    <RadioGroup
                      aria-label="rarity"
                      name="rarity"
                      value={bundlesRarityFilter}
                      onChange={handleBundlesRarityChange}
                    >
                      <FormControlLabel
                        value="default"
                        defaultChecked
                        control={<Radio />}
                        label="All"
                      />
                    </RadioGroup>
                  </FormControl>
                )}
              </div>
            </AccordionDetails>
          </Accordion>
        </div>
      </Drawer>
    </>
  );
}

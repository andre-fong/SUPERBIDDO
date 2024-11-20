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
import InputLabel from "@mui/material/InputLabel";
import {
  AuctionQualityFilters,
  AuctionFoilFilters,
  AuctionPriceFilters,
  AuctionCategoryFilters,
  AuctionSortByOption,
} from "@/types/auctionTypes";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import MuiAccordion, { AccordionProps } from "@mui/material/Accordion";
import MuiAccordionSummary, {
  AccordionSummaryProps,
} from "@mui/material/AccordionSummary";
import MuiAccordionDetails, {
  AccordionDetailsProps,
} from "@mui/material/AccordionDetails";
import { styled } from "@mui/material/styles";
import cardRarities from "@/types/cardGameInfo";

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

  const results = 1000;
  const searchQuery = "Charizard";

  //////////////////////////////////////////////////
  //                 FORM STATE                   //
  //////////////////////////////////////////////////

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
      nearMint: false,
      excellent: false,
      veryGood: false,
      poor: false,
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
  const [raritySearchFilter, setRaritySearchFilter] =
    useState<string>("default");
  const [rarities, setRarities] = useState<string[]>([]);
  useEffect(() => {
    setRaritySearchFilter("default");
    if (categorySearchFilters.pokemon) {
      setRarities(cardRarities.Pokemon.rarities);
    } else if (categorySearchFilters.mtg) {
      setRarities(cardRarities.MTG.rarities);
    } else if (categorySearchFilters.yugioh) {
      setRarities(cardRarities.Yugioh.rarities);
    } else {
      setRarities([]);
    }
  }, [categorySearchFilters]);

  const [priceSearchFilters, setPriceSearchFilters] =
    useState<AuctionPriceFilters>({
      includeMinPrice: false,
      includeMaxPrice: false,
      minPrice: null,
      maxPrice: null,
    });

  const [sortBy, setSortBy] = useState<AuctionSortByOption>("bestMatch");

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
        nearMint: false,
        excellent: false,
        veryGood: false,
        poor: false,
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
        nearMint: checked,
        excellent: checked,
        veryGood: checked,
        poor: checked,
      }));
    } else {
      setQualitySearchFilters((prev) => {
        let newFilters = { ...prev, [name]: checked };

        return {
          ...prev,
          default: !(
            newFilters.graded ||
            newFilters.nearMint ||
            newFilters.excellent ||
            newFilters.veryGood ||
            newFilters.poor
          ),
          ungraded:
            newFilters.nearMint ||
            newFilters.excellent ||
            newFilters.veryGood ||
            newFilters.poor,
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
    } else {
      setCategorySearchFilters((prev) => {
        let newFilters = { ...prev, [name]: checked };

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

  // TODO: Implement rarity change handler
  function handleRarityChange(event: React.ChangeEvent<HTMLInputElement>) {
    setRaritySearchFilter(event.target.value);
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

  return (
    <>
      <main className={styles.main}>
        <div className={styles.left_filters}>
          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<KeyboardArrowDownIcon />}
              aria-controls="categories-content"
            >
              Category
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
              aria-controls="rarities-content"
              title="Rarities only update for the first selected category."
            >
              Rarity
            </AccordionSummary>
            <AccordionDetails>
              <div className={styles.rarities}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">
                    {categorySearchFilters.pokemon
                      ? "Pokémon"
                      : categorySearchFilters.mtg
                      ? "Magic: The Gathering"
                      : categorySearchFilters.yugioh
                      ? "Yu-Gi-Oh!"
                      : categorySearchFilters.bundles
                      ? "Bundles"
                      : "All"}
                  </FormLabel>
                  <RadioGroup
                    aria-label="rarity"
                    name="rarity"
                    value={raritySearchFilter}
                    onChange={handleRarityChange}
                  >
                    <FormControlLabel
                      value="default"
                      defaultChecked
                      control={<Radio />}
                      label="All"
                    />
                    {rarities.map((rarity) => (
                      <FormControlLabel
                        key={rarity}
                        value={rarity}
                        control={<Radio />}
                        label={rarity}
                      />
                    ))}
                  </RadioGroup>
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
        </div>

        <div className={styles.results}>
          <h1 className={styles.results_num}>
            <span className={styles.bold}>{results}</span> results for &quot;
            <span className={styles.bold}>{searchQuery}</span>&quot;
          </h1>

          <div className={styles.filter_dropdowns}>
            <div className={styles.left_filter_dropdowns}>
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
                >
                  <MenuItem value="bestMatch">Sort: Best Match</MenuItem>
                  <MenuItem value="endingSoon">Time: Ending Soon</MenuItem>
                  <MenuItem value="newlyListed">Time: Newly Listed</MenuItem>
                  <MenuItem value="priceLowToHigh">Price: Low to High</MenuItem>
                  <MenuItem value="priceHighToLow">Price: High to Low</MenuItem>
                  <MenuItem value="bidsMostToLeast">
                    # of Bids: Most to Least
                  </MenuItem>
                  <MenuItem value="bidsLeastToMost">
                    # of Bids: Least to Most
                  </MenuItem>
                  <MenuItem value="location">Location: Nearest You</MenuItem>
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
                                  name="excellent"
                                  checked={qualitySearchFilters.excellent}
                                  onChange={handleQualityChange}
                                />
                              }
                              label="Excellent"
                              sx={{ marginTop: "-5px" }}
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  size="small"
                                  name="veryGood"
                                  checked={qualitySearchFilters.veryGood}
                                  onChange={handleQualityChange}
                                />
                              }
                              label="Very Good"
                              sx={{ marginTop: "-5px" }}
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  size="small"
                                  name="poor"
                                  checked={qualitySearchFilters.poor}
                                  onChange={handleQualityChange}
                                />
                              }
                              label="Poor"
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
                      {qualitySearchFilters.highGrade}
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

            {qualitySearchFilters.nearMint && (
              <div className={styles.selected_option}>
                <p>
                  Quality:{" "}
                  <span className={styles.bold_600}>Near Mint (Ungraded)</span>
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
                          prev.excellent ||
                          prev.veryGood ||
                          prev.poor
                        ),
                        ungraded: prev.excellent || prev.veryGood || prev.poor,
                      };
                    });
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </div>
            )}

            {qualitySearchFilters.excellent && (
              <div className={styles.selected_option}>
                <p>
                  Quality:{" "}
                  <span className={styles.bold_600}>Excellent (Ungraded)</span>
                </p>
                <IconButton
                  size="small"
                  onClick={() => {
                    setQualitySearchFilters((prev) => {
                      prev.excellent = false;

                      return {
                        ...prev,
                        default: !(
                          prev.graded ||
                          prev.nearMint ||
                          prev.veryGood ||
                          prev.poor
                        ),
                        ungraded: prev.nearMint || prev.veryGood || prev.poor,
                      };
                    });
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </div>
            )}

            {qualitySearchFilters.veryGood && (
              <div className={styles.selected_option}>
                <p>
                  Quality:{" "}
                  <span className={styles.bold_600}>Very Good (Ungraded)</span>
                </p>
                <IconButton
                  size="small"
                  onClick={() => {
                    setQualitySearchFilters((prev) => {
                      prev.veryGood = false;

                      return {
                        ...prev,
                        default: !(
                          prev.graded ||
                          prev.nearMint ||
                          prev.excellent ||
                          prev.poor
                        ),
                        ungraded: prev.nearMint || prev.excellent || prev.poor,
                      };
                    });
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </div>
            )}

            {qualitySearchFilters.poor && (
              <div className={styles.selected_option}>
                <p>
                  Quality:{" "}
                  <span className={styles.bold_600}>Poor (Ungraded)</span>
                </p>
                <IconButton
                  size="small"
                  onClick={() => {
                    setQualitySearchFilters((prev) => {
                      prev.poor = false;

                      return {
                        ...prev,
                        default: !(
                          prev.graded ||
                          prev.nearMint ||
                          prev.excellent ||
                          prev.veryGood
                        ),
                        ungraded:
                          prev.nearMint || prev.excellent || prev.veryGood,
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

          {/* TODO: Render results */}
          <div className={styles.results_grid}></div>

          {/* TODO: Paginate */}
          <div className={styles.pagination}></div>
        </div>
      </main>
    </>
  );
}

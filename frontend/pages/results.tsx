import { ErrorType } from "@/types/errorTypes";
import { PageName } from "@/types/pageTypes";
import { User } from "@/types/userTypes";
import { useState, useRef } from "react";
import styles from "@/styles/results.module.css";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Popper from "@mui/material/Popper";
import Paper from "@mui/material/Paper";
import Checkbox from "@mui/material/Checkbox";
import { Fade } from "@mui/material";
import { ClickAwayListener } from "@mui/base/ClickAwayListener";
import FormControl from "@mui/material/FormControl";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import {
  AuctionQualityFilters,
  AuctionFoilFilters,
} from "@/types/auctionTypes";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";

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

  return (
    <>
      <main className={styles.main}>
        <div className={styles.left_filters}>
          {/* TODO: Filter accordions */}Left filters
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
                ref={qualityAnchorEl}
                onClick={() => setQualityPopperOpen((open) => !open)}
              >
                Quality
                <KeyboardArrowDownIcon />
              </button>
              <button
                className={styles.filter_dropdown}
                ref={foilAnchorEl}
                onClick={() => setFoilPopperOpen((open) => !open)}
              >
                Foil
                <KeyboardArrowDownIcon />
              </button>
            </div>
            <div className={styles.sort}></div>
          </div>

          <Popper
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

          <div className={styles.filter_selected_options}></div>

          {/* TODO: Render results */}
          <div className={styles.results_grid}></div>

          {/* TODO: Paginate */}
          <div className={styles.pagination}></div>
        </div>
      </main>
    </>
  );
}

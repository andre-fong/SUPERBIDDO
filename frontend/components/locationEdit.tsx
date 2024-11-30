import { useState, useEffect, useRef, useMemo } from "react";
import Dialog from "@mui/material/Dialog";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import Button from "@mui/material/Button";
import styles from "@/styles/locationEdit.module.css";
import { debounce } from "@mui/material/utils";
import parse from "autosuggest-highlight/parse";
import { ErrorType, Severity } from "@/types/errorTypes";

// Key can only be used on our domains, so it's safe to expose
const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

function loadScript(src: string, position: HTMLElement | null, id: string) {
  if (!position) {
    return;
  }

  const script = document.createElement("script");
  script.setAttribute("async", "");
  script.setAttribute("id", id);
  script.src = src;
  position.appendChild(script);
}

const autocompleteService = { current: null };

interface MainTextMatchedSubstrings {
  offset: number;
  length: number;
}
interface StructuredFormatting {
  main_text: string;
  secondary_text: string;
  main_text_matched_substrings?: readonly MainTextMatchedSubstrings[];
}
interface PlaceType {
  description: string;
  place_id: string;
  structured_formatting: StructuredFormatting;
}

// Courtesy of MUI Google Places autocomplete
// https://mui.com/material-ui/react-autocomplete/#google-maps-place
export default function LocationEdit({
  locationEditOpen,
  setLocationEditOpen,
  setToast,
}: {
  locationEditOpen: boolean;
  setLocationEditOpen: (open: boolean) => void;
  setToast: (error: ErrorType) => void;
}) {
  const [value, setValue] = useState<PlaceType | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState<readonly PlaceType[]>([]);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const loaded = useRef(false);

  if (typeof window !== "undefined" && !loaded.current) {
    if (!document.querySelector("#google-maps")) {
      loadScript(
        `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`,
        document.querySelector("head"),
        "google-maps"
      );
    }

    loaded.current = true;
  }

  const fetchPlaces = useMemo(
    () =>
      debounce(
        (
          request: { input: string },
          callback: (results?: PlaceType[]) => void
        ) => {
          const token =
            new // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).google.maps.places.AutocompleteSessionToken();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (autocompleteService.current as any).getPlacePredictions(
            {
              ...request,
              sessionToken: token,
            },
            callback
          );
        },
        400
      ),
    []
  );

  useEffect(() => {
    let active = true;

    // Get Google autocomplete service if it's not already loaded
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!autocompleteService.current && (window as any).google) {
      autocompleteService.current =
        new // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).google.maps.places.AutocompleteService();
    }
    if (!autocompleteService.current) {
      return undefined;
    }

    if (inputValue === "") {
      setOptions(value ? [value] : []);
      return undefined;
    }

    // Once we have the autocomplete service, fetch places
    fetchPlaces({ input: inputValue }, (results?: readonly PlaceType[]) => {
      if (active) {
        let newOptions: readonly PlaceType[] = [];

        if (value) {
          newOptions = [value];
        }

        if (results) {
          newOptions = [...newOptions, ...results];
        }

        setOptions(newOptions);
      }
    });

    return () => {
      active = false;
    };
  }, [value, inputValue, fetchPlaces]);

  function submitLocationEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!value) {
      setToast({
        message: "Please select a location",
        severity: Severity.Critical,
      });
      return;
    }

    setSubmitting(true);
    // TODO: Submit to new endpoint
    console.log("submitting ", value.place_id);
  }

  return (
    <Dialog
      open={locationEditOpen}
      onClose={() => setLocationEditOpen(false)}
      fullWidth
      disableScrollLock
    >
      <form
        className={styles.container}
        onSubmit={(e) => submitLocationEdit(e)}
      >
        <h2 className={styles.title}>Edit Location</h2>

        <Autocomplete
          fullWidth
          sx={{ marginBottom: "30px" }}
          getOptionLabel={(option) =>
            typeof option === "string" ? option : option.description
          }
          filterOptions={(x) => x}
          options={options}
          autoComplete
          includeInputInList
          filterSelectedOptions
          value={value}
          disabled={submitting}
          noOptionsText="No locations"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onChange={(event: any, newValue: PlaceType | null) => {
            setOptions(newValue ? [newValue, ...options] : options);
            setValue(newValue);
          }}
          onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue);
          }}
          renderInput={(params) => (
            <TextField
              error={error}
              {...params}
              label="Your location"
              fullWidth
            />
          )}
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;
            const matches =
              option.structured_formatting.main_text_matched_substrings || [];

            const parts = parse(
              option.structured_formatting.main_text,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              matches.map((match: any) => [
                match.offset,
                match.offset + match.length,
              ])
            );
            return (
              // Hacky fix for duplicate key issue
              <li key={crypto.randomUUID()} {...optionProps}>
                <Grid container sx={{ alignItems: "center" }}>
                  <Grid item sx={{ display: "flex", width: 44 }}>
                    <LocationOnIcon sx={{ color: "text.secondary" }} />
                  </Grid>
                  <Grid
                    item
                    sx={{ width: "calc(100% - 44px)", wordWrap: "break-word" }}
                  >
                    {parts.map((part, index) => (
                      <Box
                        key={index}
                        component="span"
                        sx={{
                          fontWeight: part.highlight ? "bold" : "regular",
                        }}
                      >
                        {part.text}
                      </Box>
                    ))}
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      {option.structured_formatting.secondary_text}
                    </Typography>
                  </Grid>
                </Grid>
              </li>
            );
          }}
        />

        {/* TODO: Connect selected place to maps iframe */}
        <iframe
          width="100%"
          height="450"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src={`https://www.google.com/maps/embed/v1/place?q=place_id:${
            value?.place_id || "ChIJf9Wrt2_a1IkRrHuIaQFuZbs"
          }&key=${googleMapsApiKey}`}
        ></iframe>

        <div className={styles.button_row}>
          <Button
            variant="outlined"
            type="button"
            onClick={() => setLocationEditOpen(false)}
          >
            Cancel
          </Button>
          <Button variant="contained" type="submit" color="primary">
            Save
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

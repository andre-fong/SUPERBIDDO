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
import { editLocation } from "@/utils/fetchFunctions";
import { User } from "@/types/userTypes";

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
  user,
}: {
  locationEditOpen: boolean;
  setLocationEditOpen: (open: boolean) => void;
  setToast: (error: ErrorType) => void;
  user: User | null;
}) {
  const [value, setValue] = useState<PlaceType | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState<readonly PlaceType[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [optionClicks, setOptionClicks] = useState(0);

  const embeddedMapsURL = useMemo(() => {
    if (optionClicks === 0) {
      if (user?.address) {
        return `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${user.address.addressFormatted}`;
      } else {
        // default of UTSC :)
        return `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=place_id:ChIJf9Wrt2_a1IkRrHuIaQFuZbs`;
      }
    } else {
      return `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=place_id:${value?.place_id}`;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionClicks, user]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sessionToken, setSessionToken] = useState<any>();
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

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!loaded.current || !(window as any).google || !locationEditOpen) {
      return;
    }

    const token =
      new // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).google.maps.places.AutocompleteSessionToken();
    setSessionToken(token);
  }, [loaded, locationEditOpen]);

  useEffect(() => {
    setInputValue(user?.address?.addressFormatted || "");
  }, [locationEditOpen, user]);

  const fetchPlaces = useMemo(
    () =>
      debounce(
        (
          request: { input: string },
          callback: (results?: PlaceType[]) => void
        ) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (autocompleteService.current as any).getPlacePredictions(
            {
              ...request,
              sessionToken: sessionToken,
            },
            callback
          );
        },
        400
      ),
    [sessionToken]
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

    if (!user) {
      setToast({
        message: "Please log in to edit your location",
        severity: Severity.Critical,
      });
      return;
    }

    setSubmitting(true);
    editLocation(
      setToast,
      user.accountId,
      value.place_id,
      sessionToken.aw
    ).then((res) => {
      if (!!res) {
        setLocationEditOpen(false);
        setToast({
          message: "Your address was updated.",
          severity: Severity.Info,
        });
      }
      setSubmitting(false);
    });
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
          freeSolo
          inputValue={inputValue}
          disabled={submitting}
          noOptionsText="No locations"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onChange={(event: any, newValue: string | PlaceType | null) => {
            if (typeof newValue !== "string") {
              setOptions(newValue ? [newValue, ...options] : options);
              setValue(newValue);
              if (newValue) {
                setOptionClicks((prev) => prev + 1);
              }
            }
          }}
          onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue);
          }}
          renderInput={(params) => (
            <TextField {...params} required label="Your location" fullWidth />
          )}
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;

            if (typeof option === "string") return null;

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

        <iframe
          width="100%"
          height="450"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src={embeddedMapsURL}
        ></iframe>

        <p className={styles.maps_note}>
          (Note: Above map will update whenever the location input is changed.)
        </p>

        <p className={styles.button_row}>
          <Button
            variant="outlined"
            type="button"
            onClick={() => setLocationEditOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            type="submit"
            color="primary"
            disabled={submitting}
          >
            Save
          </Button>
        </p>
      </form>
    </Dialog>
  );
}

import { PageName } from "@/types/pageTypes";
import { useEffect, useState, useRef } from "react";
import styles from "@/styles/editAuction.module.css";
import { User } from "@/types/userTypes";
import { ErrorType } from "@/types/errorTypes";
import TextField from "@mui/material/TextField";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Button from "@mui/material/Button";
import DeleteIcon from "@mui/icons-material/Delete";

export default function EditAuction({
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
  const [type, setType] = useState<string>("");
  const [cardBundleType, setCardBundleType] = useState<string>("");
  const [qualityType, setQualityType] = useState<string>("");
  const [psaQuality, setPsaQuality] = useState<number>(0);
  const [ungradedQuality, setUngradedQuality] = useState<string>("");
  const [foil, setFoil] = useState<boolean>(false);
  const [rarity, setRarity] = useState<string>("");
  const [cardName, setCardName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [manufacturer, setManufacturer] = useState<string>("");
  const [set, setSet] = useState<string>("");
  const [startingPrice, setStartingPrice] = useState<number>(0);
  const [spread, setSpread] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const handleTypeChange = (event: SelectChangeEvent) => {
    setType(event.target.value);
  };

  const handleCardBundleTypeChange = (event: SelectChangeEvent) => {
    setCardBundleType(event.target.value);
  };

  const handleQualityTypeChange = (event: SelectChangeEvent) => {
    setQualityType(event.target.value);
  };

  const handlePsaQualityChange = (event: SelectChangeEvent) => {
    setPsaQuality(Number(event.target.value));
  };

  const handleUngradedQualityChange = (event: SelectChangeEvent) => {
    setUngradedQuality(event.target.value);
  };

  const handleFoilChange = (event: SelectChangeEvent) => {
    if (event.target.value === "Yes") {
      setFoil(true);
    } else {
      setFoil(false);
    }
  };

  const handleRarityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRarity(event.target.value);
  };

  const handleCardNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCardName(event.target.value);
  };

  const handleDescriptionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDescription(event.target.value);
  };

  const handleManufacturerChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setManufacturer(event.target.value);
  };

  const handleSetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSet(event.target.value);
  };

  const handleStartingPriceChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setStartingPrice(Number(event.target.value));
  };

  const handleSpreadChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSpread(Number(event.target.value));
  };

  const handleStartDateChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(event.target.value);
  };

  return (
    <>
      <main className={styles.main}>
        <form className={styles.form}>
          <h1>Edit Auction</h1>
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              label="Type"
              value={type}
              onChange={handleTypeChange}
              MenuProps={{ disableScrollLock: true }}
              required
            >
              <MenuItem value="Card">Card</MenuItem>
              <MenuItem value="Bundle">Bundle</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Card / Bundle Type</InputLabel>
            <Select
              label="Card / Bundle Type"
              value={cardBundleType}
              onChange={handleCardBundleTypeChange}
              MenuProps={{ disableScrollLock: true }}
              required
            >
              <MenuItem value="Pokemon">Pokemon</MenuItem>
              <MenuItem value="Magic: The Gathering">
                Magic: The Gathering
              </MenuItem>
              <MenuItem value="Yu-Gi-Oh!">Yu-Gi-Oh!</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Quality Type</InputLabel>
            <Select
              label="Quality Type"
              value={qualityType}
              onChange={handleQualityTypeChange}
              MenuProps={{ disableScrollLock: true }}
              required
            >
              <MenuItem value="PSA">PSA</MenuItem>
              <MenuItem value="Ungraded">Ungraded</MenuItem>
            </Select>
          </FormControl>

          {qualityType === "PSA" && (
            <FormControl fullWidth>
              <InputLabel>PSA Quality</InputLabel>
              <Select
                label="PSA Quality"
                value={psaQuality.toString()}
                onChange={handlePsaQualityChange}
                MenuProps={{ disableScrollLock: true }}
                required={qualityType === "PSA"}
              >
                {[...Array(10).keys()].map((num) => (
                  <MenuItem key={num + 1} value={num + 1}>
                    {num + 1}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {qualityType === "Ungraded" && (
            <FormControl fullWidth>
              <InputLabel>Ungraded Quality</InputLabel>
              <Select
                label="Ungraded Quality"
                value={ungradedQuality}
                onChange={handleUngradedQualityChange}
                MenuProps={{ disableScrollLock: true }}
                required={qualityType === "Ungraded"}
              >
                <MenuItem value="Mint">Mint</MenuItem>
                <MenuItem value="Near Mint">Near Mint</MenuItem>
                <MenuItem value="Lightly Played">Lightly Played</MenuItem>
                <MenuItem value="Moderately Played">Moderately Played</MenuItem>
                <MenuItem value="Heavily Played">Heavily Played</MenuItem>
                <MenuItem value="Damaged">Damaged</MenuItem>
              </Select>
            </FormControl>
          )}

          <FormControl fullWidth>
            <InputLabel>Foil</InputLabel>
            <Select
              label="Foil"
              value={foil ? "Yes" : "No"}
              onChange={handleFoilChange}
              MenuProps={{ disableScrollLock: true }}
              required
            >
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Rarity"
            InputLabelProps={{ shrink: true }}
            value={rarity}
            onChange={handleRarityChange}
            fullWidth
          />
          <TextField
            label="Card Name"
            InputLabelProps={{ shrink: true }}
            value={cardName}
            onChange={handleCardNameChange}
            fullWidth
            required
          />
          <TextField
            label="Description"
            InputLabelProps={{ shrink: true }}
            value={description}
            onChange={handleDescriptionChange}
            multiline
            rows={4}
            fullWidth
          />
          <TextField
            label="Manufacturer"
            InputLabelProps={{ shrink: true }}
            value={manufacturer}
            onChange={handleManufacturerChange}
            fullWidth
            required
          />
          <TextField
            label="Set"
            InputLabelProps={{ shrink: true }}
            value={set}
            onChange={handleSetChange}
            fullWidth
            required
          />
          <TextField
            label="Starting Price"
            type="number"
            InputLabelProps={{ shrink: true }}
            value={startingPrice}
            onChange={handleStartingPriceChange}
            fullWidth
            required
          />
          <TextField
            label="Spread"
            type="number"
            InputLabelProps={{ shrink: true }}
            value={spread}
            onChange={handleSpreadChange}
            fullWidth
            required
          />

          <TextField
            label="Start Date and Time"
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={handleStartDateChange}
            fullWidth
            required
          />
          <TextField
            label="End Date and Time"
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={handleEndDateChange}
            fullWidth
            required
          />

          <Button variant="contained" color="primary" type="submit" fullWidth>
            Finish Editing
          </Button>

          <Button
            variant="outlined"
            color="primary"
            fullWidth
            startIcon={<DeleteIcon />}
          >
            Delete Auction
          </Button>
        </form>
      </main>
    </>
  );
}

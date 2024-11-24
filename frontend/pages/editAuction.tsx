import { PageName } from "@/types/pageTypes";
import { useEffect, useState, useRef } from "react";
import styles from "@/styles/editAuction.module.css";
import { User } from "@/types/userTypes";
import { ErrorType, Severity } from "@/types/errorTypes";
import TextField from "@mui/material/TextField";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Button from "@mui/material/Button";
import DeleteIcon from "@mui/icons-material/Delete";
import { fetchAuction } from "@/utils/fetchFunctions";
import { Auction } from "@/types/backendAuctionTypes";

const gameMap = {
  MTG: "Magic: The Gathering",
  Yugioh: "Yu-Gi-Oh!",
  Pokemon: "Pokemon",
};

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
  const [game, setGame] = useState<string>("");
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

  useEffect(() => {
    const auctionId = JSON.parse(context)?.auctionId;
    if (auctionId === undefined) {
      setToast({
        message: "Invalid auction ID, could not edit auction",
        severity: Severity.Critical,
      });
      setCurPage("home");
    } else {
      // Fetch auction data
      fetchAuction(setToast, auctionId).then((auction: Auction) => {
        if (auction === null) {
          setToast({
            message: "Auction not found",
            severity: Severity.Critical,
          });
          setCurPage("home");
        } else {
          const isBundle = auction.cards === undefined;

          setType(isBundle ? "Bundle" : "Card");
          setGame(
            isBundle
              ? gameMap[auction.bundle.game]
              : gameMap[auction.cards[0].game]
          );
          setQualityType(
            isBundle
              ? ""
              : Boolean(auction.cards[0].qualityUngraded)
              ? "Ungraded"
              : "PSA"
          );
          setPsaQuality(
            (isBundle
              ? ""
              : Boolean(auction.cards[0].qualityUngraded)
              ? "Ungraded"
              : "PSA") === "PSA"
              ? isBundle
                ? 1
                : (auction.cards[0].qualityPsa as number)
              : 1
          );
          setUngradedQuality(
            (isBundle
              ? ""
              : Boolean(auction.cards[0].qualityUngraded)
              ? "Ungraded"
              : "PSA") === "Ungraded"
              ? isBundle
                ? (auction.bundle.qualityUngraded as string)
                : (auction.cards[0].qualityUngraded as string)
              : "Damaged"
          );
          setFoil(isBundle ? false : auction.cards[0].isFoil);
          setRarity(isBundle ? "" : auction.cards[0].rarity);
          setCardName(isBundle ? auction.bundle.name : auction.cards[0].name);
          setDescription(
            isBundle
              ? auction.bundle.description || ""
              : auction.cards[0].description || ""
          );
          setManufacturer(
            isBundle
              ? auction.bundle.manufacturer
              : auction.cards[0].manufacturer
          );
          setSet(isBundle ? auction.bundle.set : auction.cards[0].set);
          setStartingPrice(auction.startPrice);
          setSpread(auction.spread);

          let date = new Date(auction.startTime);
          let year = date.getFullYear();
          let month = (date.getMonth() + 1).toString().padStart(2, "0");
          let day = date.getDate().toString().padStart(2, "0");
          let hours = date.getHours().toString().padStart(2, "0");
          let minutes = date.getMinutes().toString().padStart(2, "0");
          let formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;

          setStartDate(formattedDate);

          date = new Date(auction.endTime);
          year = date.getFullYear();
          month = (date.getMonth() + 1).toString().padStart(2, "0");
          day = date.getDate().toString().padStart(2, "0");
          hours = date.getHours().toString().padStart(2, "0");
          minutes = date.getMinutes().toString().padStart(2, "0");
          formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;

          setEndDate(formattedDate);
          setLoading(false);
        }
      });
    }
  }, [context]);

  const handleTypeChange = (event: SelectChangeEvent) => {
    setType(event.target.value);
  };

  const handleGameChange = (event: SelectChangeEvent) => {
    setGame(event.target.value);
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

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
  };

  const handleDeleteAuction = async () => {
    // Delete
  };

  return (
    <>
      <main className={styles.main}>
        <form className={styles.form} onSubmit={handleEditSubmit}>
          <h1>Edit Auction</h1>

          <FormControl fullWidth>
            <InputLabel required>Game</InputLabel>
            <Select
              label="Game"
              value={game}
              onChange={handleGameChange}
              MenuProps={{ disableScrollLock: true }}
              required
              disabled={loading}
            >
              <MenuItem value="Pokemon">Pokemon</MenuItem>
              <MenuItem value="Magic: The Gathering">
                Magic: The Gathering
              </MenuItem>
              <MenuItem value="Yu-Gi-Oh!">Yu-Gi-Oh!</MenuItem>
            </Select>
          </FormControl>

          {type === "Card" && (
            <FormControl fullWidth>
              <InputLabel required={type === "Card"}>Quality Type</InputLabel>
              <Select
                label="Quality Type"
                value={qualityType}
                onChange={handleQualityTypeChange}
                MenuProps={{ disableScrollLock: true }}
                required={type === "Card"}
                disabled={loading}
              >
                <MenuItem value="PSA">PSA</MenuItem>
                <MenuItem value="Ungraded">Ungraded</MenuItem>
              </Select>
            </FormControl>
          )}

          {qualityType === "PSA" && type === "Card" && (
            <FormControl fullWidth>
              <InputLabel required={qualityType === "PSA"}>
                PSA Quality
              </InputLabel>
              <Select
                label="PSA Quality"
                value={psaQuality.toString()}
                onChange={handlePsaQualityChange}
                MenuProps={{ disableScrollLock: true }}
                required={qualityType === "PSA"}
                disabled={loading}
              >
                {[...Array(10).keys()].map((num) => (
                  <MenuItem key={num + 1} value={num + 1}>
                    {num + 1}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {qualityType === "Ungraded" && type === "Card" && (
            <FormControl fullWidth>
              <InputLabel required={qualityType === "Ungraded"}>
                Ungraded Quality
              </InputLabel>
              <Select
                label="Ungraded Quality"
                value={ungradedQuality}
                onChange={handleUngradedQualityChange}
                MenuProps={{ disableScrollLock: true }}
                required={qualityType === "Ungraded"}
                disabled={loading}
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

          {type === "Card" && (
            <FormControl fullWidth>
              <InputLabel>Foil</InputLabel>
              <Select
                label="Foil"
                value={foil ? "Yes" : "No"}
                onChange={handleFoilChange}
                MenuProps={{ disableScrollLock: true }}
                required={type === "Card"}
                disabled={loading}
              >
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </Select>
            </FormControl>
          )}

          {type === "Card" && (
            <TextField
              label="Rarity"
              InputLabelProps={{ shrink: true }}
              value={rarity}
              onChange={handleRarityChange}
              fullWidth
              required={type === "Card"}
              disabled={loading}
            />
          )}
          <TextField
            label={
              !type ? "Name" : type === "Card" ? "Card Name" : "Bundle Name"
            }
            InputLabelProps={{ shrink: true }}
            value={cardName}
            onChange={handleCardNameChange}
            fullWidth
            required
            disabled={loading}
          />
          <TextField
            label="Description"
            InputLabelProps={{ shrink: true }}
            value={description}
            onChange={handleDescriptionChange}
            multiline
            rows={4}
            fullWidth
            disabled={loading}
          />
          <TextField
            label="Manufacturer"
            InputLabelProps={{ shrink: true }}
            value={manufacturer}
            onChange={handleManufacturerChange}
            fullWidth
            required
            disabled={loading}
          />
          <TextField
            label="Set"
            InputLabelProps={{ shrink: true }}
            value={set}
            onChange={handleSetChange}
            fullWidth
            required
            disabled={loading}
          />
          <TextField
            label="Starting Price"
            type="number"
            InputLabelProps={{ shrink: true }}
            value={startingPrice}
            onChange={handleStartingPriceChange}
            fullWidth
            required
            disabled={loading}
          />
          <TextField
            label="Spread"
            type="number"
            InputLabelProps={{ shrink: true }}
            value={spread}
            onChange={handleSpreadChange}
            fullWidth
            required
            disabled={loading}
          />

          <TextField
            label="Start Date and Time"
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={handleStartDateChange}
            fullWidth
            required
            disabled={loading}
          />
          <TextField
            label="End Date and Time"
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={handleEndDateChange}
            fullWidth
            required
            disabled={loading}
          />

          <Button
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            disabled={loading}
          >
            Finish Editing
          </Button>

          <Button
            variant="outlined"
            color="primary"
            fullWidth
            startIcon={<DeleteIcon />}
            disabled={loading}
            onClick={handleDeleteAuction}
          >
            Delete Auction
          </Button>
        </form>
      </main>
    </>
  );
}

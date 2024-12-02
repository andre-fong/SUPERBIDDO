import { PageName } from "@/types/pageTypes";
import React, { useEffect, useState, useRef } from "react";
import styles from "@/styles/editAuction.module.css";
import { User } from "@/types/userTypes";
import { ErrorType, Severity } from "@/types/errorTypes";
import TextField from "@mui/material/TextField";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Button from "@mui/material/Button";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Skeleton from "@mui/material/Skeleton";
import Link from "@mui/material/Link";
import DeleteIcon from "@mui/icons-material/Delete";
import AccessAlarmIcon from "@mui/icons-material/AccessAlarm";
import {
  editAuction,
  deleteAuction,
  fetchAuction,
} from "@/utils/fetchFunctions";
import {
  Auction,
  AuctionPatchBody,
  QualityPsa,
  QualityUngraded,
} from "@/types/backendAuctionTypes";
import Dialog from "@mui/material/Dialog";
import cardRarities from "@/types/cardGameInfo";

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
  const [startingPrice, setStartingPrice] = useState<number | null>(0);
  const [spread, setSpread] = useState<number | null>(0);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [auctionName, setAuctionName] = useState<string>("");
  const [editing, setEditing] = useState<boolean>(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<boolean>(false);
  const [isDates, setIsDates] = useState<boolean>(true);

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
          setGame(isBundle ? auction.bundle.game : auction.cards[0].game);
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
          setDescription(auction.description || "");
          setManufacturer(
            isBundle
              ? auction.bundle.manufacturer
              : auction.cards[0].manufacturer
          );
          setSet(isBundle ? auction.bundle.set : auction.cards[0].set);
          setStartingPrice(auction.startPrice);
          setSpread(auction.spread);
          setAuctionName(auction.name);

          let date = new Date(auction.startTime);
          let year = date.getFullYear();
          let month = (date.getMonth() + 1).toString().padStart(2, "0");
          let day = date.getDate().toString().padStart(2, "0");
          let hours = date.getHours().toString().padStart(2, "0");
          let minutes = date.getMinutes().toString().padStart(2, "0");
          let formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;

          if (auction.startTime) setStartDate(formattedDate);
          else setStartDate("");

          date = new Date(auction.endTime);
          year = date.getFullYear();
          month = (date.getMonth() + 1).toString().padStart(2, "0");
          day = date.getDate().toString().padStart(2, "0");
          hours = date.getHours().toString().padStart(2, "0");
          minutes = date.getMinutes().toString().padStart(2, "0");
          formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;

          if (auction.endTime) setEndDate(formattedDate);
          else setEndDate("");

          if (!auction.startTime && !auction.endTime) setIsDates(false);

          setLoading(false);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context]);

  const handleGameChange = (event: SelectChangeEvent) => {
    setGame(event.target.value);
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

  const handleRarityChange = (event: SelectChangeEvent) => {
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
    setStartingPrice(
      isNaN(parseFloat(event.target.value))
        ? null
        : parseFloat(event.target.value)
    );
  };

  const handleSpreadChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSpread(
      isNaN(parseFloat(event.target.value))
        ? null
        : parseFloat(event.target.value)
    );
  };

  const handleAuctionNameChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setAuctionName(event.target.value);
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
    const auctionId = JSON.parse(context)?.auctionId;
    if (auctionId === undefined) {
      setToast({
        message: "Invalid auction ID, could not edit auction",
        severity: Severity.Critical,
      });
      setCurPage("home");
      return;
    }
    if (editing || deleting) return;

    if (isDates && (!startDate || !endDate)) {
      setToast({
        message:
          "Please provide both a start and end date for a scheduled auction",
        severity: Severity.Warning,
      });

      return;
    }

    if (startingPrice === null || spread === null) {
      setToast({
        message: "Starting price and spread are required",
        severity: Severity.Warning,
      });

      return;
    }

    if (startingPrice < 0) {
      setToast({
        message: "Starting price must be greater than or equal to 0",
        severity: Severity.Warning,
      });

      return;
    }

    if (spread <= 0) {
      setToast({
        message: "Spread must be greater than 0",
        severity: Severity.Warning,
      });

      return;
    }

    if (isDates && new Date(startDate) >= new Date(endDate)) {
      setToast({
        message: "Start date must be before end date",
        severity: Severity.Warning,
      });

      return;
    }

    if (isDates && new Date() >= new Date(startDate)) {
      setToast({
        message: "Start date must be in the future",
        severity: Severity.Warning,
      });

      return;
    }

    const auctionData: AuctionPatchBody = {
      name: auctionName,
      description: description,
      startPrice: startingPrice,
      spread: spread,
      startTime: !isDates ? null : new Date(startDate).toISOString(),
      endTime: !isDates ? null : new Date(endDate).toISOString(),
    };

    if (type === "Card") {
      auctionData.cardName = cardName;
      auctionData.cardDescription = description;
      auctionData.cardManufacturer = manufacturer;
      auctionData.cardSet = set;
      auctionData.cardIsFoil = foil;
      auctionData.cardGame = game as "MTG" | "Yugioh" | "Pokemon";
      if (qualityType === "PSA") {
        auctionData.cardQualityPsa = psaQuality as QualityPsa;
      } else {
        auctionData.cardQualityUngraded = ungradedQuality as QualityUngraded;
      }
      auctionData.cardRarity = rarity;
    } else if (type === "Bundle") {
      auctionData.bundleName = cardName;
      auctionData.bundleDescription = description;
      auctionData.bundleManufacturer = manufacturer;
      auctionData.bundleSet = set;
      auctionData.bundleGame = game as "MTG" | "Yugioh" | "Pokemon";
    }

    setEditing(true);
    await editAuction(setToast, auctionId, auctionData);
    setCurPage("auction", context);
  };

  const handleDeleteAuction = async (event: React.FormEvent) => {
    event.preventDefault();
    if (deleteConfirmText !== cardName) {
      setToast({
        message: "Delete confirmation text does not match card name",
        severity: Severity.Warning,
      });
      setDeleteError(true);
      return;
    }
    if (editing || deleting) return;

    setDeleteError(false);
    setDeleting(true);
    await deleteAuction(setToast, JSON.parse(context)?.auctionId);
    setCurPage("results");
  };

  return (
    <>
      <div
        role="presentation"
        onClick={(e) => e.preventDefault()}
        style={{
          marginLeft: "30px",
          marginBottom: "10px",
        }}
      >
        <Breadcrumbs aria-label="breadcrumb" sx={{ marginBottom: "15px" }}>
          <Link
            underline="hover"
            color="inherit"
            href="/"
            onClick={() => setCurPage("home")}
          >
            Home
          </Link>
          <Link
            underline="hover"
            color="inherit"
            href="/"
            onClick={() => setCurPage("results", context)}
          >
            Auctions
          </Link>
          {loading ? (
            <Skeleton variant="text" width={100} />
          ) : (
            <Link
              underline="hover"
              color="inherit"
              href="/"
              onClick={() => setCurPage("auction", context)}
            >
              {cardName}
            </Link>
          )}
          <p style={{ color: "black" }}>Edit Auction</p>
        </Breadcrumbs>
      </div>

      <main className={styles.main}>
        <form className={styles.form} onSubmit={handleEditSubmit}>
          <h1>Edit Auction</h1>

          <TextField
            label="Auction Name"
            InputLabelProps={{ shrink: true }}
            value={auctionName}
            onChange={handleAuctionNameChange}
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
              <MenuItem value="Pokemon">Pokémon</MenuItem>
              <MenuItem value="MTG">Magic: The Gathering</MenuItem>
              <MenuItem value="Yugioh">Yu-Gi-Oh!</MenuItem>
            </Select>
          </FormControl>

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
            <FormControl fullWidth>
              <InputLabel required>Rarity</InputLabel>
              <Select
                label="Rarity"
                value={rarity}
                onChange={handleRarityChange}
                MenuProps={{ disableScrollLock: true }}
                required
                disabled={loading}
              >
                {cardRarities[game]?.rarities.map((rarity, index) => (
                  <MenuItem key={index} value={rarity}>
                    {rarity}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
            value={startingPrice !== null ? startingPrice : ""}
            onChange={handleStartingPriceChange}
            fullWidth
            required
            disabled={loading}
          />
          <TextField
            label="Spread"
            type="number"
            InputLabelProps={{ shrink: true }}
            value={spread !== null ? spread : ""}
            onChange={handleSpreadChange}
            fullWidth
            required
            disabled={loading}
          />
          <Button
            variant="contained"
            color="secondary"
            component="label"
            fullWidth
            startIcon={!isDates && <AccessAlarmIcon />}
            sx={{ marginBottom: "10px" }}
            onClick={() => setIsDates(!isDates)}
          >
            {isDates ? "Leave unscheduled" : "schedule auction"}
          </Button>
          {isDates && (
            <>
              <TextField
                label="Start Date and Time"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={handleStartDateChange}
                fullWidth
                disabled={loading}
              />
              <TextField
                label="End Date and Time"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={handleEndDateChange}
                fullWidth
                disabled={loading}
              />
            </>
          )}

          <Button
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            disabled={loading || editing || deleting}
          >
            Finish Editing
          </Button>

          <Button
            variant="outlined"
            color="primary"
            fullWidth
            startIcon={<DeleteIcon />}
            disabled={loading || editing || deleting}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete Auction
          </Button>
        </form>
      </main>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <form
          className={styles.delete_container}
          onSubmit={handleDeleteAuction}
        >
          <h2 className={styles.delete_title}>
            Are you sure you want to delete this auction?
          </h2>
          <p className={styles.delete_text}>
            Warning: This action cannot be undone. Type below to confirm.
          </p>

          <TextField
            label={'Type "' + cardName + '" to confirm deletion'}
            fullWidth
            required
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            disabled={deleting}
            autoComplete="off"
            error={deleteError}
            helperText={
              deleteError ? "Text does not match card name" : undefined
            }
          />

          <div className={styles.delete_buttons}>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={deleting}
            >
              Yes
            </Button>
            <Button
              variant="outlined"
              color="primary"
              type="button"
              disabled={deleting}
              onClick={() => setDeleteDialogOpen(false)}
            >
              No
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

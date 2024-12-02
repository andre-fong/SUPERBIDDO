"use client";

import React, { useRef, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Container,
  Typography,
  Box,
  Skeleton,
} from "@mui/material";
import { fetchCardPrice } from "@/app/api/apiEndpoints";
import { createAuction, getGeminiInput } from "@/utils/fetchFunctions";
import cardRarities, { qualityList, PSAList } from "@/types/cardGameInfo";
import styles from "@/styles/CardListing.module.css";
import { ErrorType, Severity } from "@/types/errorTypes";
import { User } from "@/types/userTypes";
import { PageName } from "@/types/pageTypes";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import AccessAlarmIcon from "@mui/icons-material/AccessAlarm";
import { uploadImage } from "@/utils/fetchFunctions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SampleNextArrow(props: any) {
  const { className, onClick } = props;
  return (
    <div
      className={className}
      style={{ display: "block", background: "#f44336", borderRadius: "30%" }}
      onClick={onClick}
    ></div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SamplePrevArrow(props: any) {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{ display: "block", background: "#f44336", borderRadius: "30%" }}
      onClick={onClick}
    />
  );
}

interface CardListingProps {
  setToast: (error: ErrorType) => void;
  user: User;
  setCurPage: (page: PageName, context?: string) => void;
  context: string;
}

const CardListing: React.FC<CardListingProps> = ({
  setToast,
  user,
  setCurPage,
  context,
}) => {
  const cardPhotosRef = useRef<string | null>(null);
  const [frontPhotoPreview, setFrontPreview] = useState<string>();
  const [cardType, setCardType] = useState<string>("MTG");
  const [type, setType] = useState<string>("Card");
  const [quality, setQuality] = useState<string>("Mint");
  const [isFoil, setIsFoil] = useState<string>("No");
  const [rarity, setRarity] = useState<string>("Common");
  const [isImageLoading, setImageLoading] = useState<null | boolean>(null);
  const [isGeminiLoading, setGeminiIsLoading] = useState<null | boolean>(null);
  const [manufacturer, setManufacturer] = useState<string>("");
  const [set, setSet] = useState<string>("");
  const [cardName, setCardName] = useState<string>("");
  const [isDates, setIsDates] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const startingPriceRef = useRef<HTMLInputElement>(null);
  const spreadRef = useRef<HTMLInputElement>(null);
  const auctionNameRef = useRef<HTMLInputElement>(null);

  const formatCardUploadData = async () => {
    if (!cardPhotosRef.current) {
      return;
    }

    try {
      setGeminiIsLoading(true);
      const cardInfo = await getGeminiInput(setToast, cardPhotosRef.current);
      setGeminiIsLoading(false);

      setType(cardInfo.type === "bundle" ? "Bundle" : "Card");

      let price;
      if (cardInfo.type != "bundle") {
        try {
          price = await fetchCardPrice(
            cardInfo.cardType,
            cardInfo.cardName,
            cardInfo.setCode,
            cardInfo.collectorNumber,
            cardInfo.foil === "Yes"
          );
        } catch {
          setToast({
            message: "Error retrieving card price",
            severity: Severity.Warning,
          });
        }
      }

      const missingFields = [];

      if (cardInfo.type != "bundle") {
        if (cardInfo.quality) {
          setQuality(cardInfo.quality);
        } else {
          missingFields.push("Quality");
        }

        if (cardInfo.foil) {
          setIsFoil(cardInfo.foil === "Yes" ? "Yes" : "No");
        } else {
          missingFields.push("Foil");
        }

        if (cardInfo.rarity) {
          setRarity(cardInfo.rarity);
        } else {
          missingFields.push("Rarity");
        }
      }

      if (cardInfo.type && (cardInfo.cardName || cardInfo.bundleName)) {
        if (cardInfo.type === "bundle") {
          setCardName(cardInfo.bundleName);
        } else {
          setCardName(cardInfo.cardName);
        }
      } else {
        if (cardInfo.type === "bundle") {
          missingFields.push("Bundle name");
        } else {
          missingFields.push("Card name");
        }
      }

      setCardType(cardInfo.cardType);

      if (cardInfo.manufacturer) {
        setManufacturer(cardInfo.manufacturer);
      } else {
        missingFields.push("Manufacturer");
      }

      if (cardInfo.set) {
        setSet(cardInfo.set);
      } else {
        missingFields.push("Set");
      }

      if (cardInfo.type != "bundle" && startingPriceRef.current) {
        startingPriceRef.current.value = price || "";
      } else {
        missingFields.push("Starting price");
      }

      if (missingFields.length > 0) {
        setToast({
          message: `Unable to get these fields: ${missingFields.join(", ")}`,
          severity: Severity.Warning,
        });
      }
    } catch (error) {
      setToast({
        message: "Error uploading retrieving fields for cards",
        severity: Severity.Critical,
      });
      setGeminiIsLoading(false);
    }
  };

  const getCurDate = () => {
    const date = new Date();
    return date.toLocaleString();
  };

  const imageUpload = async (formFile: File) => {
    return uploadImage(setToast, formFile);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setImageLoading(true);
    const imageUploadResponse = await imageUpload(file);
    setImageLoading(false);
    if (!imageUploadResponse) {
      setToast({
        message: "Error uploading image. Please try again",
        severity: Severity.Warning,
      });
      return;
    }
    setFrontPreview(imageUploadResponse);
    cardPhotosRef.current = imageUploadResponse;

    formatCardUploadData();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!frontPhotoPreview || !cardPhotosRef.current) {
      setToast({
        message: "Please upload a front photo",
        severity: Severity.Warning,
      });
      return;
    }

    if (isDates && (!startDate || !endDate)) {

      setToast({
        message: "Please provide both a start and end date for a scheduled auction",
        severity: Severity.Warning,
      });
      return;
    }

    if (
      isDates &&
      new Date(startDate) >= new Date(endDate)
    ) {
      setToast({
        message: "Start date must be before end date",
        severity: Severity.Warning,
      });
      return;
    }
    if (
      isDates &&
      new Date(endDate).getTime() -
        new Date(startDate).getTime() <
        5 * 60 * 1000
    ) {
      setToast({
        message: "The auction duration must be at least 5 minutes",
        severity: Severity.Warning,
      });
      return;
    }
    if (
      isDates &&
      new Date(startDate) < new Date()
    ) {
      setToast({
        message: "Start date must be in the future",
        severity: Severity.Warning,
      });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const auctionData: any = {
      auctioneerId: user.accountId,
      name: auctionNameRef.current?.value,
      description: descriptionRef.current?.value,
      startPrice: parseFloat(startingPriceRef.current?.value || "0"),
      spread: parseFloat(spreadRef.current?.value || "0"),
      type: type,
      cards:
        type === "Card"
          ? {
              game: cardType,
              name: cardName || "Unknown Card Name",
              description:
                descriptionRef.current?.value || "No description provided",
              manufacturer: manufacturer || "Unknown Manufacturer",
              qualityUngraded:
                typeof quality === "string" ? quality : undefined,
              qualityPsa: typeof quality === "number" ? quality : undefined,
              rarity: rarity,
              set: set || "Unknown Set",
              isFoil: isFoil === "Yes",
              imageUrl: cardPhotosRef.current,
            }
          : undefined,
    };

    if (isDates) {
      auctionData.startTime = new Date(startDate).toISOString();
      auctionData.endTime = new Date(endDate).toISOString();
    }

    if (!descriptionRef.current) {
      delete auctionData.description;
    }

    if (type === "Bundle") {
      auctionData.bundle = {
        game: cardType,
        name: cardName || "",
        description: descriptionRef.current?.value || "",
        manufacturer: manufacturer || "",
        set: set || "",
        imageUrl: cardPhotosRef.current,
      };
    }

    createAuction(setToast, auctionData).then((auction) => {
      if (!auction.auctionId) {
        return;
      }
      setCurPage("auction", JSON.stringify({ auctionId: auction.auctionId }));
    });
  };

  const settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    nextArrow: <SampleNextArrow />,
    prevArrow: <SamplePrevArrow />,
    dotsClass: `slick-dots dots-bottom ${styles.dots}`,
  };

  return (
    <>
      <div
        role="presentation"
        onClick={(e) => e.preventDefault()}
        style={{ marginLeft: "30px", marginBottom: "10px" }}
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
          <p style={{ color: "black" }}>Sell</p>
        </Breadcrumbs>
      </div>

      <Container maxWidth={false} style={{ padding: 40 }}>
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={3}>
            <Box flex={1} maxWidth="50%">
            {isImageLoading ? (
              <Skeleton variant="rectangular" width="100%" height={400} />
            ) : (
              frontPhotoPreview && (
              <Box
                border={1}
                borderRadius={2}
                boxShadow={3}
                padding={1}
                paddingBottom={1}
                borderColor="grey.500"
              >
                <img src={frontPhotoPreview} alt="Front Preview" style={{ width: '100%', height: 'auto' }} />
              </Box>
              )
            )}
            </Box>
          {!isGeminiLoading ? (
            <Box flex={1} maxWidth="50%">
              <form
                onSubmit={handleSubmit}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  flexDirection: "column",
                  height: "100%",
                  gap: "5px",
                }}
              >
                <Typography
                  variant="h3"
                  component="h1"
                  gutterBottom
                  style={{ fontWeight: "bold", marginTop: "-20px" }}
                >
                  Create an Auction
                </Typography>

                <TextField
                  label="Auction Name"
                  inputRef={auctionNameRef}
                  fullWidth
                  margin="normal"
                  required
                  InputLabelProps={{ shrink: true }}
                />

                <FormControl fullWidth sx={{ marginTop: "8px" }}>
                  <InputLabel id="type-label">Auction Type</InputLabel>
                  <Select
                    label="Auction Type"
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value);
                    }}
                    required
                  >
                    <MenuItem value="Bundle">Bundle</MenuItem>
                    <MenuItem value="Card">Card</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Description"
                  inputRef={descriptionRef}
                  fullWidth
                  margin="normal"
                  multiline
                  rows={4}
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

                {isDates && 
                <>
                    <TextField
                    label="Start Date and Time"
                    type="datetime-local"
                    value={startDate}
                    fullWidth
                    margin="normal"
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      min: getCurDate(),
                    }}
                  />

                  <TextField
                    label="End Date and Time"
                    type="datetime-local"
                    value={endDate}
                    fullWidth
                    onChange={(e) => setEndDate(e.target.value)}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                  />
                </>}

                <Button
                  variant="contained"
                  component="label"
                  fullWidth
                  sx={{ marginBottom: "10px" }}
                >
                  Upload Front Photo
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/bmp"
                    hidden
                    onChange={handleFileChange}
                    name="imageUploadFront"
                  />
                </Button>
                {frontPhotoPreview && <>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Game</InputLabel>
                  <Select
                    value={cardType}
                    onChange={(e) => setCardType(e.target.value)}
                    required
                    label="Game"
                  >
                    <MenuItem value="MTG">Magic: The Gathering</MenuItem>
                    <MenuItem value="Yugioh">Yu-Gi-Oh!</MenuItem>
                    <MenuItem value="Pokemon">Pokemon</MenuItem>
                  </Select>
                </FormControl>

                {type === "Card" && (
                  <>
                    <FormControl fullWidth sx={{ marginTop: "11px" }}>
                      <InputLabel>Quality</InputLabel>
                      <Select
                        label="Quality"
                        value={quality}
                        onChange={(e) => setQuality(e.target.value)}
                        required
                      >
                        {[...qualityList, ...PSAList].map(
                          (quality: string | number, index: number) => (
                            <MenuItem value={quality} key={index}>
                              {typeof quality === "number"
                                ? `PSA ${quality}`
                                : quality}
                            </MenuItem>
                          )
                        )}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ marginTop: "14px" }}>
                      <InputLabel>Foil (y/n)</InputLabel>
                      <Select
                        label="foil-label"
                        value={isFoil}
                        onChange={(e) => setIsFoil(e.target.value)}
                        required
                      >
                        <MenuItem value="No">No</MenuItem>
                        <MenuItem value="Yes">Yes</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ marginTop: "14px" }}>
                      <InputLabel>Rarity</InputLabel>
                      <Select
                        value={rarity}
                        onChange={(e) => setRarity(e.target.value)}
                        required
                        label="rarity-label"
                      >
                        {cardRarities[cardType]?.rarities.map(
                          (rarity: string, index: number) => (
                            <MenuItem value={rarity} key={index}>
                              {rarity}
                            </MenuItem>
                          )
                        )}
                      </Select>
                    </FormControl>
                  </>
                )}
                <TextField
                  label={type === "Bundle" ? "Bundle Name" : "Card Name"}
                  fullWidth
                  sx={{ marginTop: "13px" }}
                  required
                  InputLabelProps={{ shrink: true }}
                  onChange={(e) => setCardName(e.target.value)}
                  value={cardName}
                />

                <TextField
                  label="Manufacturer"
                  fullWidth
                  margin="normal"
                  required
                  onChange={(e) => setManufacturer(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  value={manufacturer}
                />

                <TextField
                  label="Set"
                  fullWidth
                  margin="normal"
                  required
                  onChange={(e) => setSet(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  value={set}
                />

                <TextField
                  label="Starting Price"
                  type="number"
                  inputRef={startingPriceRef}
                  fullWidth
                  margin="normal"
                  required
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    step: "0.01",
                    min: "0",
                  }}
                />

                <TextField
                  label="Spread"
                  type="number"
                  inputRef={spreadRef}
                  fullWidth
                  margin="normal"
                  required
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    step: "0.1",
                    min: "0",
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ padding: "15px", fontSize: "20px", marginTop: "20px" }}
                >
                  Submit Listing
                </Button>
                </>}
              </form>
            </Box>
          ) : (
            <Skeleton variant="rectangular" width="50%" height={800} />
          )}
        </Box>
      </Container>
    </>
  );
};

export default CardListing;

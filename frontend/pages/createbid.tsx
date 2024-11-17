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
} from "@mui/material";
import { fetchCardPrice } from "@/app/api/apiEndpoints";
import { createAuction } from "@/utils/fetchFunctions";
import cardRarities, { qualityList } from "@/types/cardGameInfo";
import styles from "@/styles/CardListing.module.css";
import { ErrorType, Severity } from "@/types/errorTypes";
import { User } from "@/types/userTypes";
import { PageName } from "@/types/pageTypes";

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
  const cardPhotosRef = useRef<File | null>(null);
  const [frontPhotoPreview, setFrontPreview] = useState<string>();
  const [backPhotoPreview, setBackPreview] = useState<string>();
  const [cardType, setCardType] = useState<string>("MTG");
  const [type, setType] = useState<string>("Card");
  const [quality, setQuality] = useState<string>("Mint");
  const [isFoil, setIsFoil] = useState<string>("No");
  const [rarity, setRarity] = useState<string>("Common");

  const cardNameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const manufacturerRef = useRef<HTMLInputElement>(null);
  const setRef = useRef<HTMLInputElement>(null);
  const startingPriceRef = useRef<HTMLInputElement>(null);
  const spreadRef = useRef<HTMLInputElement>(null);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  const formatCardUploadData = async (uploadFormData: FormData) => {
    try {
      const response = await fetch("http://localhost:3000/api", {
        method: "POST",
        body: uploadFormData,
      });

      const data = await response.json();
      const cardInfo = JSON.parse(data.response);
      setType(cardInfo.type === "bundle" ? "Bundle" : "Card");

      let price;
      if (cardInfo.type != "bundle") {
        price = await fetchCardPrice(
          cardInfo.cardType,
          cardInfo.cardName,
          cardInfo.setCode,
          cardInfo.collectorNumber,
          cardInfo.foil === "Yes"
        );
      }

      let missingFields = [];

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

      if (cardNameRef.current) {
        console;
        if (cardInfo.type === "bundle") {
          cardNameRef.current.value = cardInfo.bundleName;
        } else {
          cardNameRef.current.value = cardInfo.cardName;
        }
      } else {
        if (cardInfo.type === "bundle") {
          missingFields.push("Bundle name");
        } else {
          missingFields.push("Card name");
        }
      }

      setCardType(cardInfo.cardType);

      if (manufacturerRef.current) {
        manufacturerRef.current.value = cardInfo.manufacturer;
      } else {
        missingFields.push("Manufacturer");
      }

      if (setRef.current) {
        setRef.current.value = cardInfo.set;
      } else {
        missingFields.push("Set");
      }

      if (startingPriceRef.current) {
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
    }
  };

  const handleBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const filePreview = URL.createObjectURL(file);
    setBackPreview(filePreview);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const filePreview = URL.createObjectURL(file);
    setFrontPreview(filePreview);
    cardPhotosRef.current = file;

    const formData = new FormData();
    formData.append("file", file);

    formatCardUploadData(formData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!frontPhotoPreview) {
      setToast({
        message: "Please upload a front photo",
        severity: Severity.Warning,
      });
      return;
    }

    if (
      (startDateRef.current && !endDateRef.current) ||
      (endDateRef.current && !startDateRef.current)
    ) {
      setToast({
        message: "Please set either both start date and end date or neither",
        severity: Severity.Warning,
      });
      return;
    }

    if (
      startDateRef.current &&
      endDateRef.current &&
      new Date(startDateRef.current.value) >= new Date(endDateRef.current.value)
    ) {
      setToast({
        message: "Start date must be before end date",
        severity: Severity.Warning,
      });
      return;
    }

    if (
      startDateRef.current &&
      endDateRef.current &&
      new Date(endDateRef.current.value).getTime() - new Date(startDateRef.current.value).getTime() < 5 * 60 * 1000
    ) {
      setToast({
        message: "The auction duration must be at least 5 minutes",
        severity: Severity.Warning,
      });
      return;
    }
    const auctionData: any = {
      auctioneerId: user.accountId,
      name: cardNameRef.current?.value || "Unknown Name",
      description: descriptionRef.current?.value || "No description provided",
      startPrice: parseFloat(startingPriceRef.current?.value || "0"),
      spread: parseFloat(spreadRef.current?.value || "0"),
      startTime: startDateRef.current && startDateRef.current.value != "" ? new Date(startDateRef.current.value).toISOString() : "",
      endTime: endDateRef.current && endDateRef.current.value != "" ? new Date(endDateRef.current.value).toISOString() : "",
      type: type,
      cards:
      type === "Card"
      ? {
        game: cardType,
        name: cardNameRef.current?.value || "Unknown Card Name",
        description: descriptionRef.current?.value || "No description provided",
        manufacturer: manufacturerRef.current?.value || "Unknown Manufacturer",
        quality: quality,
        rarity: rarity,
        set: setRef.current?.value || "Unknown Set",
        isFoil: isFoil === "Yes",
      }
      : undefined,
    };

    if (type === "Bundle") {
      auctionData.bundle = {
        game: cardType,
        name: cardNameRef.current?.value || "",
        description: descriptionRef.current?.value || "",
        manufacturer: manufacturerRef.current?.value || "",
        set: setRef.current?.value || "",
      };
    }

    createAuction(setToast, auctionData).then((auction) =>
      setCurPage("auction", JSON.stringify({auctionId: auction.auctionId}))
    );
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
    <Container maxWidth={false} style={{ padding: 40 }}>
      <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={3}>
        <Box flex={1} maxWidth="50%">
          {(frontPhotoPreview || backPhotoPreview) && (
            <Box
              border={1}
              borderRadius={2}
              boxShadow={3}
              padding={1}
              paddingBottom={1}
              borderColor="grey.500"
            >
              <Slider {...settings}>
                {frontPhotoPreview && (
                  <img src={frontPhotoPreview} alt="Front Preview" />
                )}
                {backPhotoPreview && (
                  <img src={backPhotoPreview} alt="Back Preview" />
                )}
              </Slider>
            </Box>
          )}
        </Box>
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
              Card Listing Form
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Card Type</InputLabel>
              <Select
                value={cardType}
                onChange={(e) => setCardType(e.target.value)}
                required
              >
                <MenuItem value="MTG">Magic: The Gathering</MenuItem>
                <MenuItem value="Yugioh">Yu-Gi-Oh!</MenuItem>
                <MenuItem value="Pokemon">Pokemon</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ marginTop: "8px" }}>
              <InputLabel id="type-label">Type</InputLabel>
              <Select
                labelId="type-label"
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

            {type === "Card" && (
              <>
                <FormControl fullWidth sx={{ marginTop: "11px" }}>
                  <InputLabel>Quality</InputLabel>
                  <Select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                    required
                  >
                    {qualityList.map((quality: string, index: number) => (
                      <MenuItem value={quality} key={index}>
                        {quality}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ marginTop: "14px" }}>
                  <InputLabel>Foil (y/n)</InputLabel>
                  <Select
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
              inputRef={cardNameRef}
              fullWidth
              sx={{ marginTop: "13px" }}
              required
              InputLabelProps={{ shrink: true }}
            />

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
              component="label"
              fullWidth
              sx={{ marginBottom: "10px" }}
            >
              Upload Front Photo
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChange}
                required
              />
            </Button>

            <Button
              variant="contained"
              component="label"
              fullWidth
              sx={{ margin: "normal" }}
            >
              Upload Back Photo
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleBackChange}
              />
            </Button>

            <TextField
              label="Manufacturer"
              inputRef={manufacturerRef}
              fullWidth
              margin="normal"
              required
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Set"
              inputRef={setRef}
              fullWidth
              margin="normal"
              required
              InputLabelProps={{ shrink: true }}
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

            <TextField
              label="Start Date and Time"
              type="datetime-local"
              inputRef={startDateRef}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              inputProps={{
                min: new Date().toISOString().slice(0, 16),
              }}
            />

            <TextField
              label="End Date and Time"
              type="datetime-local"
              inputRef={endDateRef}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              inputProps={{
                min: new Date().toISOString().slice(0, 16),
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
          </form>
        </Box>
      </Box>
    </Container>
  );
};

export default CardListing;

"use client";

import React, { useRef, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { TextField, Button, Select, MenuItem, FormControl, InputLabel, Container, Typography, Box } from "@mui/material";
import { fetchCardPrice } from "@/app/api/apiEndpoints";
import cardRarities, { qualityList } from "@/types/cardGameInfo";
import styles from "@/styles/CardListing.module.css";
import { ErrorType, Severity } from "@/types/errorTypes";

function SampleNextArrow(props: any) {
  const { className,  onClick } = props;
  return (
    <div
      className={className}
      style={{display: "block", background: "#f44336", borderRadius: "30%"}}
      onClick={onClick}
    >
    </div>
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
}

const CardListing: React.FC<CardListingProps> = ({ setToast }) => {
  const cardPhotosRef = useRef<File | null>(null);
  const [frontPhotoPreview, setFrontPreview] = useState<string>();
  const [backPhotoPreview, setBackPreview] = useState<string>();
  const [cardType, setCardType] = useState<string>("MTG");

  const cardNameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const manufacturerRef = useRef<HTMLInputElement>(null);
  const qualityRef = useRef<HTMLSelectElement>(null);
  const rarityRef = useRef<HTMLSelectElement>(null);
  const setRef = useRef<HTMLInputElement>(null);
  const isFoilRef = useRef<HTMLSelectElement>(null);
  const startingPriceRef = useRef<HTMLInputElement>(null);
  const spreadRef = useRef<HTMLInputElement>(null);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);



  //TODO format correctly
  const formatCardUploadData = async (uploadFormData: FormData) => {
    try {
      const response = await fetch("http://localhost:3000/api", {
        method: "POST",
        body: uploadFormData,
      });

      const data = await response.json();
      console.log(data);
      const cardInfo = JSON.parse(data.response);
      const price = await fetchCardPrice(
        cardInfo.cardType,
        cardInfo.cardName,
        cardInfo.setCode,
        cardInfo.collectorNumber,
        cardInfo.foil === "Yes"
      );

      let missingFields = [];

      if (cardNameRef.current) {
        cardNameRef.current.value = cardInfo.cardName;
      } else {
        missingFields.push("Card name");
      }

      setCardType(cardInfo.cardType);

      if (isFoilRef.current) {
        isFoilRef.current.value = cardInfo.foil === "Yes" ? "Yes" : "No";
      } else {
        missingFields.push("Foil information");
      }

      if (manufacturerRef.current) {
        manufacturerRef.current.value = cardInfo.manufacturer;
      } else {
        missingFields.push("Manufacturer");
      }

      if (qualityRef.current) {
        qualityRef.current.value = cardInfo.quality;
      } else {
        missingFields.push("Quality");
      }

      if (rarityRef.current) {
        rarityRef.current.value = cardInfo.rarity;
      } else {
        missingFields.push("Rarity");
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
        setToast({ message: `Unable to get these fields: ${missingFields.join(", ")}`, severity: Severity.Warning });
      }
    } catch (error) {
      setToast({message: "Error uploading card", severity: Severity.Critical}); 
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

    const formData = {
      cardType: cardType,
      cardName: cardNameRef.current?.value,
      description: descriptionRef.current?.value,
      cardPhotos: cardPhotosRef.current,
      manufacturer: manufacturerRef.current?.value,
      quality: qualityRef.current?.value,
      rarity: rarityRef.current?.value,
      set: setRef.current?.value,
      isFoil: isFoilRef.current?.value,
      startingPrice: startingPriceRef.current?.value,
      spread: spreadRef.current?.value,
      startDate: startDateRef.current?.value,
      endDate: endDateRef.current?.value,
    };
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
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
        <Box flex={1} maxWidth="50%">
            {(frontPhotoPreview || backPhotoPreview) &&
            <Box border={1} borderRadius={2} boxShadow={3} padding={1} paddingBottom={1} borderColor="grey.500">
              <Slider {...settings}>
              {frontPhotoPreview && <img src={frontPhotoPreview} alt="Front Preview" />}
              {backPhotoPreview && <img src={backPhotoPreview} alt="Back Preview" />}
              </Slider>
            </Box>
            }
        </Box>
        <Box flex={1} maxWidth="50%">
          <form onSubmit={handleSubmit} style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', height: '100%', gap: '5px' }}>
            <Typography variant="h3" component="h1" gutterBottom style={{ fontWeight: 'bold' }}>
            Card Listing Form
            </Typography>
          <FormControl fullWidth margin="normal" >
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

            <TextField
              label="Card Name"
              inputRef={cardNameRef}
              fullWidth
              sx={{ margin: "normal" }}
              required
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
              sx={{ marginBottom: "10px"}}
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
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Quality</InputLabel>
              <Select inputRef={qualityRef} required>
                {qualityList.map((quality: string, index: number) => (
                  <MenuItem value={quality} key={index}>
                    {quality}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Rarity</InputLabel>
              <Select inputRef={rarityRef} required>
                {cardRarities[cardType]?.rarities.map(
                  (rarity: string, index: number) => (
                    <MenuItem value={rarity} key={index}>
                      {rarity}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>

            <TextField
              label="Set"
              inputRef={setRef}
              fullWidth
              margin="normal"
              required
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Foil (y/n)</InputLabel>
              <Select inputRef={isFoilRef} required>
                <MenuItem value="No">No</MenuItem>
                <MenuItem value="Yes">Yes</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Starting Price"
              type="number"
              inputRef={startingPriceRef}
              fullWidth
              margin="normal"
              required
            />

            <TextField
              label="Spread"
              type="number"
              inputRef={spreadRef}
              fullWidth
              margin="normal"
              required
            />

            <TextField
              label="Start Date"
              type="date"
              inputRef={startDateRef}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              required
            />

            <TextField
              label="End Date"
              type="date"
              inputRef={endDateRef}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              required
            />

            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ padding: '15px', fontSize: '20px', marginTop: '20px' }}>
              Submit Listing
            </Button>
          </form>
        </Box>
      </Box>
    </Container>
  );
};

export default CardListing;
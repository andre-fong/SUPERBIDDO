'use client';

import React, { useRef, useState, useEffect } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import styles from './CardListing.module.css'; // Ensure you have this CSS file
import { fetchCardPrice } from '../api/apiEndpoints';
import cardRarities, { qualityList } from './cardGameInfo';

const CardListing: React.FC = () => {
  const cardPhotosRef = useRef<File | null>(null);
  const [frontPhotoPreview, setFrontPreview] = useState<string>();
  const [backPhotoPreview, setBackPreview] = useState<string>();
  const [cardType, setCardType] = useState<string>('MTG');

  const startPriceRef = useRef<HTMLInputElement>(null);
  const cardNameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const manufacturerRef = useRef<HTMLInputElement>(null);
  const qualityRef = useRef<HTMLSelectElement>(null);
  const rarityRef = useRef<HTMLSelectElement>(null);
  const setRef = useRef<HTMLInputElement>(null);
  const isFoilRef = useRef<HTMLSelectElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const startingPriceRef = useRef<HTMLInputElement>(null);
  const spreadRef = useRef<HTMLInputElement>(null);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  const formatCardUploadData = async (uploadFormData: FormData) => {
    try {
      const response = await fetch('http://localhost:3000/api', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json();
      const cardInfo = JSON.parse(data.response);
      const price = await fetchCardPrice(cardInfo.cardType, cardInfo.cardName, cardInfo.setCode, cardInfo.collectorNumber, cardInfo.foil === 'Yes');

      if (cardNameRef.current) cardNameRef.current.value = cardInfo.cardName;
      setCardType(cardInfo.cardType);
      if (isFoilRef.current) isFoilRef.current.value = cardInfo.foil === 'Yes' ? 'Yes' : 'No';
      if (manufacturerRef.current) manufacturerRef.current.value = cardInfo.manufacturer;
      if (qualityRef.current) qualityRef.current.value = cardInfo.quality;
      if (rarityRef.current) rarityRef.current.value = cardInfo.rarity;
      if (setRef.current) setRef.current.value = cardInfo.set;
      if (startingPriceRef.current) startingPriceRef.current.value = price || '';

    } catch (error) {
      console.error('Error:', error);
    }
  }

  const handleBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const filePreview = URL.createObjectURL(file);
    setBackPreview(filePreview);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const filePreview = URL.createObjectURL(file);
    setFrontPreview(filePreview);
    cardPhotosRef.current = file;

    const formData = new FormData();
    formData.append('file', file);

    formatCardUploadData(formData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = {
      startPrice: startPriceRef.current?.value,
      cardType: cardType,
      cardName: cardNameRef.current?.value,
      description: descriptionRef.current?.value,
      cardPhotos: cardPhotosRef.current,
      manufacturer: manufacturerRef.current?.value,
      quality: qualityRef.current?.value,
      rarity: rarityRef.current?.value,
      set: setRef.current?.value,
      isFoil: isFoilRef.current?.value,
      name: nameRef.current?.value,
      startingPrice: startingPriceRef.current?.value,
      spread: spreadRef.current?.value,
      startDate: startDateRef.current?.value,
      endDate: endDateRef.current?.value,
    };

    console.log('Submitted Data:', formData);
  };

  const settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Card Listing Form</h1>

      <Slider {...settings} className={styles.slider}>
          <img src={frontPhotoPreview} className={styles.image}  />
          <img src={backPhotoPreview} className={styles.image} />
      </Slider>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="cardType">Card Type*</label>
          <select value={cardType} onChange={(e) => setCardType(e.target.value)} required>
            <option value="MTG">Magic: The Gathering</option>
            <option value="Yugioh">Yu-Gi-Oh!</option>
            <option value="Pokemon">Pokemon</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Card Name*</label>
          <input type="text" ref={cardNameRef} required />
        </div>

        <div className={styles.formGroup}>
          <label>Description</label>
          <textarea ref={descriptionRef}></textarea>
        </div>

        <div className={styles.formGroup}>
          <label>Upload Front Photo</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>

        <div className={styles.formGroup}>
          <label>Upload Back Photo</label>
          <input type="file" accept="image/*" onChange={handleBackChange}/>
        </div>

        <div className={styles.formGroup}>
          <label>Manufacturer*</label>
          <input type="text" ref={manufacturerRef} required />
        </div>

        <div className={styles.formGroup}>
          <label>Quality*</label>
          <select ref={qualityRef} required>
            {qualityList.map((quality: string, index: number) => (
              <option value={quality} key={index}>{quality}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Rarity*</label>
          <select ref={rarityRef} required>
            {cardRarities[cardType]?.rarities.map((rarity: string, index: number) => (
              <option value={rarity} key={index}>{rarity}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Set</label>
          <input type="text" ref={setRef} />
        </div>

        <div className={styles.formGroup}>
          <label>Foil (y/n)*</label>
          <select ref={isFoilRef}>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Name*</label>
          <input type="text" ref={nameRef} required />
        </div>

        <div className={styles.formGroup}>
          <label>Starting Price*</label>
          <input type="text" ref={startingPriceRef} required />
        </div>

        <div className={styles.formGroup}>
          <label>Spread*</label>
          <input type="text" ref={spreadRef} required />
        </div>

        <div className={styles.formGroup}>
          <label>Start Date</label>
          <input type="date" ref={startDateRef} />
        </div>

        <div className={styles.formGroup}>
          <label>End Date</label>
          <input type="date" ref={endDateRef} />
        </div>

        <button type="submit" className={styles.submitButton}>Submit Listing</button>
      </form>
    </div>
  );
};

export default CardListing;
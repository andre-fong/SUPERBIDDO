import { ErrorType } from "@/types/errorTypes";
import { PageName } from "@/types/pageTypes";
import { User } from "@/types/userTypes";
import React from "react";
import styles from "@/styles/home.module.css";
import Image from "next/image";
import Button from "@mui/material/Button";

export default function Home({
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
  return (
    <>
      <div className={styles.hero_container}>
        <div className={styles.hero_banner}>
          <Image
            src="/pokemon-banner-1.jpg"
            alt="Pokemon Banner"
            fill
            priority
            style={{
              objectFit: "cover",
              objectPosition: "-20px center",
              transform: "scaleX(-1)",
            }}
          />
          <div className={styles.hero_text}>
            <h2 className={styles.hero_title}>Pokémon</h2>
            <p className={styles.hero_subtitle}>Cards, bundles, and more</p>
            <Button
              variant="contained"
              sx={{
                width: "fit-content",
                fontWeight: 600,
              }}
              onClick={() =>
                setCurPage("results", JSON.stringify({ category: "pokemon" }))
              }
            >
              View Auctions
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.section_container}>
        <h2 className={styles.section_title}>Recommended For You</h2>

        <div className={styles.recommended}></div>
      </div>

      <div className={styles.section_container}>
        <h2 className={styles.section_title}>Trending Now</h2>

        <div className={styles.trending}></div>
      </div>

      <div className={styles.section_container}>
        <h2 className={styles.section_title}>Games</h2>

        <div className={styles.games}>
          <button
            className={styles.game}
            onClick={() =>
              setCurPage("results", JSON.stringify({ category: "pokemon" }))
            }
          >
            <Image
              src="/pokemon-banner-2.jpg"
              alt="Pokémon banner"
              fill
              style={{
                objectFit: "cover",
                objectPosition: "center",
              }}
            />
            <div className={styles.game_overlay}>
              <h3 className={styles.game_title}>Pokémon</h3>
            </div>
          </button>

          <button
            className={styles.game}
            onClick={() =>
              setCurPage("results", JSON.stringify({ category: "mtg" }))
            }
          >
            <Image
              src="/mtg-banner-1.avif"
              alt="Magic: The Gathering banner"
              fill
              style={{
                objectFit: "cover",
                objectPosition: "center",
              }}
            />
            <div className={styles.game_overlay}>
              <h3 className={styles.game_title}>Magic: The Gathering</h3>
            </div>
          </button>

          <button
            className={styles.game}
            onClick={() =>
              setCurPage("results", JSON.stringify({ category: "yugioh" }))
            }
          >
            <Image
              src="/yugioh-banner-1.jpg"
              alt="Yu-Gi-Oh! banner"
              fill
              style={{
                objectFit: "cover",
                objectPosition: "bottom",
              }}
            />
            <div className={styles.game_overlay}>
              <h3 className={styles.game_title}>Yu-Gi-Oh!</h3>
            </div>
          </button>

          <div className={`${styles.game} ${styles.game_unclickable}`}>
            <Image
              src="/pokemon-banner-3.webp"
              alt="And more banner"
              fill
              style={{
                objectFit: "cover",
                objectPosition: "center",
              }}
            />
            <div
              className={`${styles.game_overlay} ${styles.game_overlay_dark}`}
            >
              <h3 className={`${styles.game_title} ${styles.game_title_small}`}>
                ...and more to come!
              </h3>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

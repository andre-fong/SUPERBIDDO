import { ErrorType } from "@/types/errorTypes";
import { PageName } from "@/types/pageTypes";
import { User } from "@/types/userTypes";
import { useState, useEffect } from "react";
import styles from "@/styles/home.module.css";
import { getAuctionSearchResults } from "@/utils/fetchFunctions";
import Image from "next/image";
import Button from "@mui/material/Button";
import { AnimatePresence, motion } from "motion/react";
import { Auction } from "@/types/backendAuctionTypes";
import ListingSkeleton from "@/components/listingSkeleton";
import Listing from "@/components/listing";

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
  const [recommended, setRecommended] = useState<Auction[]>([]);
  const [recommendedLoading, setRecommendedLoading] = useState(false);

  // Load recommendations if user is signed in
  useEffect(() => {
    if (user) {
      setRecommendedLoading(true);
      getAuctionSearchResults(setToast, {
        recommendedFor: user.accountId, includeWatchingFor: user.accountId,
      })
        .then((res) => {
          setRecommended(res.auctions);
          setRecommendedLoading(false);
        })
      
    }
    
  }, [setToast, user]);

  const [trending, setTrending] = useState<Auction[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);

  useEffect(() => {
    setTrendingLoading(true);
    getAuctionSearchResults(setToast, {
      auctionStatus: "Ongoing",
      sortBy: "numBidsDesc",
      pageSize: 10,
    })
      .then((res) => {
        setTrending(res.auctions);
        setTrendingLoading(false);
      })
      .catch((err) => {
        setToast(err);
        setTrendingLoading(false);
      });
  }, [setToast]);

  const [endingSoon, setEndingSoon] = useState<Auction[]>([]);
  const [endingSoonLoading, setEndingSoonLoading] = useState(false);

  useEffect(() => {
    setEndingSoonLoading(true);
    getAuctionSearchResults(setToast, {
      auctionStatus: "Ongoing",
      sortBy: "endTimeAsc",
      pageSize: 10,
    })
      .then((res) => {
        setEndingSoon(res.auctions);
        setEndingSoonLoading(false);
      })
      .catch((err) => {
        setToast(err);
        setEndingSoonLoading(false);
      });
  }, [setToast]);

  const [heroIndex, setHeroIndex] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setHeroIndex((prev) => (prev + 1) % 3);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [heroIndex]);

  return (
    <>
      <div className={styles.hero_container}>
        <AnimatePresence initial={false} mode="popLayout">
          {heroIndex === 0 && (
            <motion.div
              key="pokemon"
              className={styles.hero_banner}
              initial={{
                x: "100vw",
              }}
              animate={{
                x: 0,
              }}
              exit={{
                x: "-100vw",
              }}
              transition={{
                type: "spring",
                duration: 0.4,
              }}
            >
              <Image
                src="/pokemon-banner-3.webp"
                alt="Pokemon Banner"
                fill
                priority
                sizes="100vw"
                style={{
                  objectFit: "cover",
                  objectPosition: "0 35%",
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
                    setCurPage(
                      "results",
                      JSON.stringify({ category: "pokemon" })
                    )
                  }
                >
                  View Auctions
                </Button>
              </div>
            </motion.div>
          )}

          {heroIndex === 1 && (
            <motion.div
              key="mtg"
              className={styles.hero_banner}
              initial={{
                x: "100vw",
              }}
              animate={{
                x: 0,
              }}
              exit={{
                x: "-100vw",
              }}
              transition={{
                type: "spring",
                duration: 0.4,
              }}
            >
              <Image
                src="/mtg-banner-2.jpg"
                alt="Magic: The Gathering Banner"
                fill
                priority
                sizes="100vw"
                style={{
                  objectFit: "cover",
                  objectPosition: "15% 35%",
                }}
              />
              <div className={styles.hero_text}>
                <h2 className={styles.hero_title}>Magic: The Gathering</h2>
                <p
                  className={styles.hero_subtitle}
                  style={{ color: "#ff5e45" }}
                >
                  Cards, bundles, and more
                </p>
                <Button
                  variant="contained"
                  color="warning"
                  sx={{
                    width: "fit-content",
                    fontWeight: 600,
                  }}
                  onClick={() =>
                    setCurPage("results", JSON.stringify({ category: "mtg" }))
                  }
                >
                  View Auctions
                </Button>
              </div>
            </motion.div>
          )}

          {heroIndex === 2 && (
            <motion.div
              key="yugioh"
              className={styles.hero_banner}
              initial={{
                x: "100vw",
              }}
              animate={{
                x: 0,
              }}
              exit={{
                x: "-100vw",
              }}
              transition={{
                type: "spring",
                duration: 0.4,
              }}
            >
              <Image
                src="/yugioh-banner-2.jpg"
                alt="Yu-Gi-Oh! Banner"
                fill
                priority
                sizes="100vw"
                style={{
                  objectFit: "cover",
                  objectPosition: "center",
                }}
              />
              <div className={styles.hero_text}>
                <h2 className={styles.hero_title}>Yu-Gi-Oh!</h2>
                <p
                  className={styles.hero_subtitle}
                  style={{ color: "lightgray" }}
                >
                  Cards, bundles, and more
                </p>
                <Button
                  variant="contained"
                  color="info"
                  sx={{
                    width: "fit-content",
                    fontWeight: 600,
                  }}
                  onClick={() =>
                    setCurPage(
                      "results",
                      JSON.stringify({ category: "yugioh" })
                    )
                  }
                >
                  View Auctions
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {user && (
        <>
          <h2
            className={styles.section_title}
            title="Recommended auctions for you based on your viewing and bidding history."
          >
            Recommended For You
          </h2>
          <div
            className={`${styles.section_container} ${styles.list_container}`}
          >
            <div className={styles.recommended}>
              {recommendedLoading
                ? [...Array(10).keys()].map((i) => <ListingSkeleton key={i} />)
                : recommended?.map((auction) => (
                    <Listing
                      key={auction.auctionId}
                      auction={auction}
                      setCurPage={setCurPage}
                      accountId={user?.accountId}
                      setToast={setToast}
                      watchingSet={auction.watching || false}
                    />
                  ))}
            </div>
          </div>
        </>
      )}

      <h2 className={styles.section_title}>Trending Auctions</h2>
      <div className={`${styles.section_container} ${styles.list_container}`}>
        <div className={styles.trending}>
          {trendingLoading
            ? [...Array(10).keys()].map((i) => <ListingSkeleton key={i} />)
            : trending?.map((auction) => (
                <Listing
                  key={auction.auctionId}
                  auction={auction}
                  setCurPage={setCurPage}
                  accountId={user?.accountId}
                  setToast={setToast}
                  watchingSet={auction.watching || false}
                />
              ))}
        </div>
      </div>

      <h2 className={styles.section_title}>Ending Soon</h2>
      <div className={`${styles.section_container} ${styles.list_container}`}>
        <div className={styles.ending_soon}>
          {endingSoonLoading
            ? [...Array(10).keys()].map((i) => <ListingSkeleton key={i} />)
            : endingSoon?.map((auction) => (
                <Listing
                  key={auction.auctionId}
                  auction={auction}
                  setCurPage={setCurPage}
                  accountId={user?.accountId}
                  setToast={setToast}
                  watchingSet={auction.watching || false}
                />
              ))}
        </div>
      </div>

      <div className={styles.sell_container}>
        <Image
          src="/mtg-cards.webp"
          alt="Magic: The Gathering cards"
          fill
          sizes="100vw"
          style={{
            objectFit: "cover",
          }}
        />
        <div className={styles.hero_text}>
          <h2 className={styles.sell_title}>Sell your card in days</h2>
          <p className={styles.sell_subtitle}>
            Use SuperBiddo&apos;s robust auction and bidding system to turn your{" "}
            <span className={styles.sell_emphasis}>packs</span> into{" "}
            <span className={styles.sell_emphasis}>stacks</span>.
          </p>
          <Button
            variant="contained"
            sx={{
              width: "fit-content",
              fontWeight: 600,
            }}
            onClick={() => {
              if (user) setCurPage("create");
              else setCurPage("login");
            }}
          >
            {user ? "Start Selling Now" : "Sign In to Start Selling"}
          </Button>
        </div>
      </div>

      <h2 className={styles.section_title}>Games</h2>
      <div className={styles.section_container}>
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
              sizes="(max-width: 600px) 50vw, 100vw"
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
              sizes="(max-width: 600px) 50vw, 100vw"
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
              sizes="(max-width: 600px) 50vw, 100vw"
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
              src="/pokemon-banner-1.jpg"
              alt="And more banner"
              fill
              sizes="(max-width: 600px) 50vw, 100vw"
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

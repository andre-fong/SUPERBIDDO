type AccountInput = {
  email: string;
  password: string;
  username: string;
};

type Account = {
  accountId: string;
  email: string;
  username: string;
};

type AuctionInput = {
  auctioneerId: string;
  name: string;
  description?: string;
  startPrice: number;
  spread: number;
  startTime: Date;
  endTime: Date;
} & (
  | { cards: CardInput<Game>[]; bundle?: never }
  | { cards?: never; bundle: BundleInput }
);

type Auction = {
  auctionId: string;
  auctioneer: Account;
  name: string;
  description?: string;
  startPrice: number;
  spread: number;
  minNewBidPrice: number;
  startTime: Date;
  endTime: Date;
  topBid: Bid;
  numBids: number;
  auctionStatus: AuctionStatus;
  bidStatus?: BidStatus;
} & (
  | { cards: Card<Game>[]; bundle?: never }
  | { cards?: never; bundle: Bundle }
);

type AuctionStatus = "Not scheduled" | "Scheduled" | "Ongoing" | "Ended";

type BidStatus =
  | "Not bid (ended)"
  | "Not bid"
  | "Leading"
  | "Outbid"
  | "Won"
  | "Lost";

type CardInput<T extends Game> = {
  game: T;
  name: string;
  description?: string;
  manufacturer: string;
  rarity: CardRarity<T>;
  set: string;
  isFoil: boolean;
  imageUrl: string;
} & (
  | { qualityPsa: QualityPsa; qualityUngraded?: never }
  | { qualityPsa?: never; qualityUngraded: QualityUngraded }
);

type Card<T extends Game> = {
  cardId: string;
  game: T;
  name: string;
  description?: string;
  manufacturer: string;
  rarity: CardRarity<T>;
  set: string;
  isFoil: boolean;
  imageUrl: string;
} & (
  | { qualityPsa: QualityPsa; qualityUngraded?: never }
  | { qualityPsa?: never; qualityUngraded: QualityUngraded }
);

type CardRarity<T extends Game> = T extends "MTG"
  ? MTGRarity
  : T extends "Pokemon"
  ? PokemonRarity
  : T extends "Yugioh"
  ? YugiohRarity
  : never;

type BundleInput = {
  game: Game;
  name: string;
  description?: string;
  manufacturer: string;
  set: string;
  imageUrl: string;
};

type Bundle = {
  bundleId: string;
  game: Game;
  name: string;
  description?: string;
  manufacturer: string;
  set: string;
  imageUrl: string;
};

type BidInput = {
  bidderId: string;
  amount: number;
};

type Bid = {
  bidId: string;
  auctionId: string;
  bidder: Account;
  amount: number;
  timestamp: Date;
};

type QualityUngraded =
  | "Mint"
  | "Near Mint"
  | "Lightly Played"
  | "Moderately Played"
  | "Heavily Played"
  | "Damaged";

type QualityPsa = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

type Game = "MTG" | "Yugioh" | "Pokemon";

type MTGRarity =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Mythic Rare"
  | "Special / Bonus Cards"
  | "Basic Land"
  | "Masterpiece Series"
  | "Promos"
  | "Extended Art"
  | "Borderless";

type PokemonRarity =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Holo Rare"
  | "Reverse Holo"
  | "Rare Holo V"
  | "Ultra Rare"
  | "Full Art"
  | "Secret Rare"
  | "Amazing Rare"
  | "Rainbow Rare"
  | "Gold Secret Rare"
  | "Promos"
  | "Radiant Collection";

type YugiohRarity =
  | "Common"
  | "Rare"
  | "Super Rare"
  | "Ultra Rare"
  | "Secret Rare"
  | "Ultimate Rare"
  | "Ghost Rare"
  | "Starlight Rare"
  | "Collector's Rare"
  | "Prismatic Secret Rare"
  | "Parallel Rare"
  | "Platinum Rare";

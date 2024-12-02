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

type Address = {
  addressFormatted: string;
  latitude: number;
  longitude: number;
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
  auctioneer: Account & {
    address?: Address;
  };
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
  watching?: boolean;
} & (
  | { cards: Card<Game>[]; bundle?: never }
  | { cards?: never; bundle: Bundle }
);

type AuctionStatus =
  | "Not scheduled"
  | "Scheduled"
  | "Ongoing"
  | "Successful"
  | "Unsuccessful";

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

type AuctionBidHistory = {
  bidder: string;
  bids: number;
  highBid: number;
  lastBidTime: Date;
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

type UserActionsData = {
  // GAME COUNTS
  games: {
    MTG?: number;
    Pokemon?: number;
    Yugioh?: number;
  };

  // PRICE RANGES
  prices: {
    zero_to_ten?: number;
    ten_to_twenty_five?: number;
    twenty_five_to_fifty?: number;
    fifty_to_hundred?: number;
    hundred_to_three_hundred?: number;
    three_hundred_to_thousand?: number;
    thousand_to_five_thousand?: number;
    five_thousand_to_ten_thousand?: number;
    ten_thousand_plus?: number;
  };
};

type PriceRange =
  | "zero_to_ten"
  | "ten_to_twenty_five"
  | "twenty_five_to_fifty"
  | "fifty_to_hundred"
  | "hundred_to_three_hundred"
  | "three_hundred_to_thousand"
  | "thousand_to_five_thousand"
  | "five_thousand_to_ten_thousand"
  | "ten_thousand_plus";

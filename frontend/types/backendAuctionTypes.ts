// TODO: Remove these types if unneeded?

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
  | { cards: CardInput[]; bundle?: never }
  | { cards?: never; bundle: BundleInput }
);

type Auction = {
  auctionId: string;
  auctioneerId: string;
  name: string;
  description?: string;
  startPrice: number;
  spread: number;
  startTime: Date;
  endTime: Date;
  currentPrice: number;
  topBid: Bid;
} & ({ cards: Card[]; bundle?: never } | { cards?: never; bundle: Bundle });

type CardInput = {
  game: Game;
  name: string;
  description?: string;
  manufacturer: string;
  quality: Quality;
  rarity: Rarity;
  set: string;
  isFoil: boolean;
};

type Card = {
  cardId: string;
  game: Game;
  name: string;
  description?: string;
  manufacturer: string;
  quality: Quality;
  rarity: Rarity;
  set: string;
  isFoil: boolean;
};

type BundleInput = {
  game: Game;
  name: string;
  description?: string;
  manufacturer: string;
  set: string;
};

type Bundle = {
  bundleId: string;
  game: Game;
  name: string;
  description?: string;
  manufacturer: string;
  set: string;
};

type BidInput = {
  auctionId: string;
  bidderId: string;
  amount: number;
};

type Bid = {
  bidId: string;
  auctionId: string;
  bidderId: string;
  amount: number;
  timestamp: Date;
};

enum Game {
  MTG = "MTG",
  YGO = "YGO",
  PKM = "PKM",
  DBS = "DBS",
  FF = "FF",
  WS = "WS",
  VG = "VG",
}

enum Quality {
  NM = "NM",
  LP = "LP",
  MP = "MP",
  HP = "HP",
}

type CardRarities = {
  MTG: {
    rarities: [
      "Common",
      "Uncommon",
      "Rare",
      "Mythic Rare",
      "Special / Bonus Cards",
      "Basic Land",
      "Masterpiece Series",
      "Promos",
      "Extended Art",
      "Borderless"
    ];
  };
  Pokemon: {
    rarities: [
      "Common",
      "Uncommon",
      "Rare",
      "Holo Rare",
      "Reverse Holo",
      "Rare Holo V",
      "Ultra Rare",
      "Full Art",
      "Secret Rare",
      "Amazing Rare",
      "Rainbow Rare",
      "Gold Secret Rare",
      "Promos",
      "Radiant Collection"
    ];
  };
  Yugioh: {
    rarities: [
      "Common",
      "Rare",
      "Super Rare",
      "Ultra Rare",
      "Secret Rare",
      "Ultimate Rare",
      "Ghost Rare",
      "Starlight Rare",
      "Collector’s Rare",
      "Prismatic Secret Rare",
      "Parallel Rare",
      "Platinum Rare"
    ];
  };
};

enum Rarity {
  C = "C",
  U = "U",
  R = "R",
  M = "M",
}

export type AuctionSelfType = 'biddings' | 'listings';
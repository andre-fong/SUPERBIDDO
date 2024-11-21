export type Bid = {
  bidder: string;
  amount: number;
  date: Date;
};

export type AuctionBidHistory = {
  bidder: string;
  bids: number;
  highBid: number;
  /**
   * Date
   */
  lastBidTime: string;
};

export enum AuctionStatusEnum {
  NotScheduled = "Not scheduled",
  Scheduled = "Scheduled",
  Ongoing = "Ongoing",
  Successful = "Successful",
  Unsuccessful = "Unsuccessful",
}

export enum AuctionStatusColorEnum {
  NotScheduled = "gray",
  Scheduled = "blue",
  Ongoing = "green",
  Successful = "gold",
  Unsuccessful = "red",
}

export enum BiddingStatusEnum {
  Winning = "Winning",
  Outbidded = "Outbidded",
  Won = "Won",
  Lost = "Lost",
}

export enum BiddingStatusColorEnum {
  Winning = "green",
  Outbidded = "orange",
  Won = "gold",
  Lost = "red",
}

export type BiddingStatus = keyof typeof BiddingStatusEnum;
export type AuctionStatus = keyof typeof AuctionStatusEnum;

export interface Auction {
  auctionId: string;
  name: string;
  status: AuctionStatusEnum | BiddingStatusEnum;
  image: string | null;
  description: string;
  topBid: number | null;
  numberOfBids: number;
  endDate: Date | null;
}

export type AuctionQualityFilters = {
  default: boolean;
  graded: boolean;
  psaGrade: boolean;
  lowGrade: number | null;
  highGrade: number | null;
  ungraded: boolean;
  nearMint: boolean;
  excellent: boolean;
  veryGood: boolean;
  poor: boolean;
};

export type AuctionFoilFilters = "default" | "foil" | "noFoil";

export type AuctionCategoryFilters = {
  default: boolean;
  pokemon: boolean;
  mtg: boolean;
  yugioh: boolean;
  bundles: boolean;
};

export type AuctionPriceFilters = {
  includeMinPrice: boolean;
  includeMaxPrice: boolean;
  minPrice: number | null;
  maxPrice: number | null;
};

export type AuctionSortByOption =
  | "bestMatch"
  | "endingSoon"
  | "newlyListed"
  | "priceLowToHigh"
  | "priceHighToLow"
  | "bidsMostToLeast"
  | "bidsLeastToMost"
  | "location";

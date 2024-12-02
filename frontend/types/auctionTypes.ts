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
  Leading = "Leading",
  Outbid = "Outbid",
  Won = "Won",
  Lost = "Lost",
}

export enum BiddingStatusColorEnum {
  Leading = "green",
  Outbid = "orange",
  Won = "gold",
  Lost = "red",
}

export type BiddingStatus = keyof typeof BiddingStatusEnum;
export type AuctionStatus = keyof typeof AuctionStatusEnum;

export interface AuctionListings {
  auctionId: string;
  name: string;
  status: AuctionStatusEnum | BiddingStatusEnum;
  image: string | null;
  description: string;
  topBid: number | null;
  numberOfBids: number;
  endDate: Date | null;
  imageUrl: string | null;
}

export type AuctionQualityFilters = {
  default: boolean;
  graded: boolean;
  psaGrade: boolean;
  lowGrade: number | null;
  highGrade: number | null;
  ungraded: boolean;
  mint: boolean;
  nearMint: boolean;
  lightlyPlayed: boolean;
  moderatelyPlayed: boolean;
  heavilyPlayed: boolean;
  damaged: boolean;
};

export type AuctionFoilFilters = "default" | "foil" | "noFoil";

export type AuctionCategoryFilters = {
  default: boolean;
  pokemon: boolean;
  mtg: boolean;
  yugioh: boolean;
};

export type AuctionPriceFilters = {
  includeMinPrice: boolean;
  includeMaxPrice: boolean;
  minPrice: number | null;
  maxPrice: number | null;
};

export type AuctionSortByOption =
  // | "bestMatch"
  | "endTimeAsc"
  | "startTimeDesc"
  | "minNewBidPriceAsc"
  | "minNewBidPriceDesc"
  | "numBidsDesc"
  | "numBidsAsc";
// | "location";

export type AuctionSearchQuery = {
  name?: string;
  recommendedFor?: string;
  auctionStatus?: (AuctionStatus | "Not scheduled") | (AuctionStatus | "Not scheduled")[];
  includeBidStatusFor?: BiddingStatus | BiddingStatus[];
  minMinNewBidPrice?: number;
  maxMinNewBidPrice?: number;
  minStartTime?: Date;
  maxStartTime?: Date;
  minEndTime?: Date;
  maxEndTime?: Date;
  cardGame?: string | string[];
  cardName?: string;
  cardManufacturer?: string;
  cardQualityUngraded?: string | string[];
  minCardQualityPsa?: number;
  maxCardQualityPsa?: number;
  cardRarity?: string | string[];
  cardSet?: string;
  cardIsFoil?: boolean;
  bundleGame?: string | string[];
  bundleName?: string;
  bundleManufacturer?: string;
  bundleSet?: string;
  isBundle?: boolean;
  sortBy?: AuctionSortByOption;
  page?: number;
  pageSize?: number;
  watchedBy?: string;
  includeWatchingFor?: string | undefined;
};

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
  Unsuccessful = "Unsuccessful"
}

export enum AuctionStatusColorEnum {
  NotScheduled = "gray",
  Scheduled = "blue",
  Ongoing = "green",
  Successful = "gold",
  Unsuccessful = "red"
}

export type AuctionStatus = keyof typeof AuctionStatusEnum;

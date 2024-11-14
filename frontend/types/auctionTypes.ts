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

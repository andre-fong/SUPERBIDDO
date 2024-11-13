type AuctionDb = {
  auction_id: string;
  auctioneer_id: string;
  name: string;
  description: string;
  start_price: number;
  spread: number;
  start_time: Date;
  end_time: Date;
  current_price: number;
};

type CardDb = {
  card_id: string;
  auction_id: string;
  game: Game;
  name: string;
  description: string;
  manufacturer: string;
  quality: Quality;
  rarity: Rarity;
  set: string;
  is_foil: boolean;
};

type BundleDb = {
  bundle_id: string;
  auction_id: string;
  game: Game;
  name: string;
  description: string;
  manufacturer: string;
  set: string;
};

type BidDb = {
  bid_id: string;
  auction_id: string;
  bidder_id: string;
  amount: number;
  timestamp: Date;
};

type AccountDb = {
  account_id: string;
  username: string;
  email: string;
  passhash: string;
  address_formatted: string;
  latitude: number;
  longitude: number;
};

type AuctionDb = {
  auction_id: string;
  auctioneer_id: string;
  name: string;
  description: string;
  start_price: string;
  spread: string;
  start_time: Date;
  end_time: Date;
};

type CardDb<T extends Game> = {
  card_id: string;
  auction_id: string;
  game: T;
  name: string;
  description: string;
  manufacturer: string;
  quality_ungraded: QualityUngraded;
  quality_psa: QualityPsaDb;
  rarity: CardRarity<T>;
  set: string;
  is_foil: boolean;
  image_url: string;
};

type BundleDb = {
  bundle_id: string;
  auction_id: string;
  game: Game;
  name: string;
  description: string;
  manufacturer: string;
  set: string;
  image_url: string;
};

type BidDb = {
  bid_id: string;
  auction_id: string;
  bidder_id: string;
  amount: string;
  timestamp: Date;
};

type QualityPsaDb = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10";

type UserActionDb = {
  account_id: string;
  game: string;
  price: number;
  action: UserAction;
  timestamp: Date;
};

type UserActionDataDb = {
  game: Game;
  price_range: PriceRange;
  frequency: string;
};

type UserAction = "view" | "bid";

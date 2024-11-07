-- trigger definition

CREATE OR REPLACE FUNCTION public.set_default_current_price()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Set target_column to the value of source_column
    NEW.current_price := NEW.start_price;
    RETURN NEW;
END;
$function$
;


-- public.account definition

-- Drop table

-- DROP TABLE public.account;

CREATE TABLE public.account (
	account_id uuid NOT NULL DEFAULT gen_random_uuid(),
	CONSTRAINT account_pk PRIMARY KEY (account_id)
);


-- public."session" definition

-- Drop table

-- DROP TABLE public."session";

CREATE TABLE public."session" (
	sid varchar NOT NULL,
	sess json NOT NULL,
	expire timestamp(6) NOT NULL,
	CONSTRAINT session_pkey PRIMARY KEY (sid)
);
CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


-- public.auction definition

-- Drop table

-- DROP TABLE public.auction;

CREATE TABLE public.auction (
	auction_id uuid NOT NULL DEFAULT gen_random_uuid(),
	auctioneer_id uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	description varchar(500) NULL,
	start_price money NOT NULL,
	spread money NOT NULL,
	start_time timestamptz NOT NULL DEFAULT now(),
	end_time timestamptz NOT NULL,
	current_price money NOT NULL DEFAULT 0,
	CONSTRAINT auction_check_end_time_after_start_time CHECK ((end_time > start_time)),
	CONSTRAINT auction_check_spread_positive CHECK ((spread >= (0)::money)),
	CONSTRAINT auction_check_start_price_positive CHECK ((start_price >= (0)::money)),
	CONSTRAINT auction_check_start_time_in_future CHECK ((start_time >= now())),
	CONSTRAINT auction_pk PRIMARY KEY (auction_id),
	CONSTRAINT auction_fk_auctioneer FOREIGN KEY (auctioneer_id) REFERENCES public.account(account_id)
);
CREATE INDEX auction_auctioneer_id_idx ON public.auction USING btree (auctioneer_id);

-- Table Triggers

CREATE TRIGGER set_default_current_price AFTER
INSERT
    ON
    public.auction FOR EACH ROW EXECUTE FUNCTION set_default_current_price();


-- public.bid definition

-- Drop table

-- DROP TABLE public.bid;

CREATE TABLE public.bid (
	bid_id uuid NOT NULL DEFAULT gen_random_uuid(),
	auction_id uuid NOT NULL,
	bidder_id uuid NOT NULL,
	bid_amount money NOT NULL,
	CONSTRAINT bid_pk PRIMARY KEY (bid_id),
	CONSTRAINT bid_fk_auction FOREIGN KEY (auction_id) REFERENCES public.auction(auction_id),
	CONSTRAINT bid_fk_bidder FOREIGN KEY (bidder_id) REFERENCES public.account(account_id)
);
CREATE INDEX bid_auction_id_idx ON public.bid USING btree (auction_id);
CREATE INDEX bid_bidder_id_idx ON public.bid USING btree (bidder_id);


-- public.bundle definition

-- Drop table

-- DROP TABLE public.bundle;

CREATE TABLE public.bundle (
	bundle_id uuid NOT NULL DEFAULT gen_random_uuid(),
	auction_id uuid NOT NULL,
	game varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	description varchar(500) NULL,
	manufacturer varchar(100) NOT NULL,
	"set" varchar(100) NOT NULL,
	CONSTRAINT bundle_pk PRIMARY KEY (bundle_id),
	CONSTRAINT bundle_fk_auction FOREIGN KEY (auction_id) REFERENCES public.auction(auction_id)
);
CREATE INDEX bundle_auction_id_idx ON public.bundle USING btree (auction_id);


-- public.card definition

-- Drop table

-- DROP TABLE public.card;

CREATE TABLE public.card (
	card_id uuid NOT NULL DEFAULT gen_random_uuid(),
	auction_id uuid NOT NULL,
	game varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	description varchar(500) NULL,
	manufacturer varchar(100) NOT NULL,
	quality varchar(100) NOT NULL,
	rarity varchar(100) NOT NULL,
	"set" varchar(100) NULL,
	is_foil bool NOT NULL,
	CONSTRAINT card_pk PRIMARY KEY (card_id),
	CONSTRAINT card_fk_auction FOREIGN KEY (auction_id) REFERENCES public.auction(auction_id)
);
CREATE INDEX card_auction_id_idx ON public.card USING btree (auction_id);
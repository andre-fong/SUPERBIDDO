CREATE OR REPLACE FUNCTION public.check_bid_valid()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    max_current_bid NUMERIC(12,2);
    auction_spread NUMERIC(12,2);
    min_valid_bid NUMERIC(12,2);
BEGIN
	SELECT COALESCE(MAX(amount), 0) INTO max_current_bid
	FROM bid WHERE auction_id = NEW.auction_id;
	
	SELECT spread INTO auction_spread FROM auction WHERE auction_id = NEW.auction_id;

	min_valid_bid := max_current_bid + auction_spread;
	
	
	IF 
	    NEW.amount < min_valid_bid THEN
        RAISE EXCEPTION 'bid_ammount_insufficient';
    END IF;
   
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_highest_bid()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    max_current_bid MONEY;
    spread MONEY;
    min_valid_bid MONEY;
BEGIN
	SELECT COALESCE(MAX(amount), 0.00::MONEY) INTO max_current_bid
	FROM bid WHERE auction_id = NEW.auction_id;
	
	SELECT spread INTO spread FROM auction WHERE auction_id = NEW.auction_id;

	min_valid_bid := max_current_bid + spread;
	
	
	IF 
	    NEW.bid_amount < min_valid_bid THEN
        RAISE EXCEPTION 'bid_ammount_insufficient';
    END IF;
   
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_column_to_now()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Set target_column to the value of source_column
    NEW := json_populate_record(NEW, json_build_object(TG_ARGV[0], now()));
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_initial_current_price()
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
	username varchar(30) NOT NULL,
	email public.citext NOT NULL,
	passhash bpchar(60) NOT NULL,
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
	start_price numeric(12, 2) NOT NULL,
	spread numeric(12, 2) NOT NULL,
	start_time timestamptz NOT NULL DEFAULT now(),
	end_time timestamptz NOT NULL,
	current_price numeric(12, 2) NOT NULL DEFAULT 0,
	CONSTRAINT auction_check_min_duration CHECK (((end_time - '00:05:00'::interval) >= start_time)),
	CONSTRAINT auction_check_spread_positive CHECK ((spread >= (0)::numeric)),
	CONSTRAINT auction_check_start_price_positive CHECK ((start_price >= (0)::numeric)),
	CONSTRAINT auction_check_start_time_in_future CHECK ((start_time >= now())),
	CONSTRAINT auction_pk PRIMARY KEY (auction_id),
	CONSTRAINT auction_fk_auctioneer FOREIGN KEY (auctioneer_id) REFERENCES public.account(account_id)
);
CREATE INDEX auction_auctioneer_id_idx ON public.auction USING btree (auctioneer_id);


-- public.bid definition

-- Drop table

-- DROP TABLE public.bid;

CREATE TABLE public.bid (
	bid_id uuid NOT NULL DEFAULT gen_random_uuid(),
	auction_id uuid NOT NULL,
	bidder_id uuid NOT NULL,
	amount numeric(12, 2) NOT NULL,
	"timestamp" timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT bid_pk PRIMARY KEY (bid_id),
	CONSTRAINT bid_fk_auction FOREIGN KEY (auction_id) REFERENCES public.auction(auction_id) ON DELETE CASCADE,
	CONSTRAINT bid_fk_bidder FOREIGN KEY (bidder_id) REFERENCES public.account(account_id)
);
CREATE INDEX bid_auction_id_idx ON public.bid USING btree (auction_id);
CREATE INDEX bid_bidder_id_idx ON public.bid USING btree (bidder_id);

-- Table Triggers

CREATE TRIGGER set_bid_timestamp_now_trigger BEFORE
INSERT
    ON
    public.bid FOR EACH ROW EXECUTE FUNCTION set_column_to_now('timestamp');
CREATE TRIGGER check_bid_valid_trigger BEFORE
INSERT
    ON
    public.bid FOR EACH ROW EXECUTE FUNCTION check_bid_valid();


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
	CONSTRAINT bundle_fk_auction FOREIGN KEY (auction_id) REFERENCES public.auction(auction_id) ON DELETE CASCADE
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
	CONSTRAINT card_fk_auction FOREIGN KEY (auction_id) REFERENCES public.auction(auction_id) ON DELETE CASCADE
);
CREATE INDEX card_auction_id_idx ON public.card USING btree (auction_id);
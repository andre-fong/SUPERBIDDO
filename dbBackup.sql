CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE OR REPLACE FUNCTION public.check_auction_ongoing()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
	_start_time timestamptz;
	_end_time timestamptz;
BEGIN
	SELECT start_time, end_time INTO _start_time, _end_time FROM auction WHERE auction_id = NEW.auction_id;
	IF 
		_start_time IS NULL OR _start_time > now() THEN
			RAISE EXCEPTION 'auction_not_started' 
			USING CONSTRAINT = 'auction_not_started';
	END IF;
	IF 
		_end_time < now() THEN
			RAISE EXCEPTION 'auction_ended' 
			USING CONSTRAINT = 'auction_ended';
	END IF;
	RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_bid_valid()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    max_current_bid NUMERIC(12,2);
	current_leading_bidder_id UUID;
    auction_spread NUMERIC(12,2);
    min_valid_bid NUMERIC(12,2);
BEGIN
	SELECT amount, bidder_id INTO max_current_bid, current_leading_bidder_id FROM bid WHERE auction_id = NEW.auction_id ORDER BY amount DESC LIMIT 1;
	
	IF current_leading_bidder_id = NEW.bidder_id THEN
		RAISE EXCEPTION 'already_leading' 
		USING CONSTRAINT = 'already_leading';
	END IF;

	IF max_current_bid IS NULL THEN
		max_current_bid := (SELECT start_price FROM auction WHERE auction_id = NEW.auction_id);
	END IF;
	
	SELECT spread INTO auction_spread FROM auction WHERE auction_id = NEW.auction_id;

	min_valid_bid := max_current_bid + auction_spread;

	IF 
	    NEW.amount < min_valid_bid THEN
        RAISE EXCEPTION 'bid_amount_insufficient'
       	USING CONSTRAINT = 'bid_amount_insufficient',
       	HINT = FORMAT('Must bid at least %s (current bid amount + spread).', min_valid_bid);
    END IF;
   
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_bidder_not_auctioneer()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE _auctioneer_id uuid;
BEGIN

	SELECT auctioneer_id INTO _auctioneer_id FROM auction WHERE auction_id = NEW.auction_id;

	IF 
	    NEW.bidder_id = _auctioneer_id THEN
        RAISE EXCEPTION 'bidder_same_as_auctioneer' 
        USING CONSTRAINT = 'bidder_same_as_auctioneer';
    END IF;
   
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_start_timestamp_in_future()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
		IF NEW.start_time < now() - INTERVAL '1 second' THEN -- 1 SECOND buffer FOR TRIGGER TO run
				RAISE EXCEPTION 'start_time_in_past';
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

-- public.account definition

-- Drop table

-- DROP TABLE public.account;

CREATE TABLE public.account (
	account_id uuid NOT NULL DEFAULT gen_random_uuid(),
	username varchar(40) NOT NULL,
	email public."citext" NOT NULL,
	passhash bpchar(60) NULL,
	address_formatted varchar(300) NULL,
	longitude float8 NULL,
	latitude float8 NULL,
	CONSTRAINT account_email_un UNIQUE (email),
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
	start_time timestamptz NULL DEFAULT now(),
	end_time timestamptz NULL,
	CONSTRAINT auction_check_min_duration CHECK (((end_time - '00:05:00'::interval) >= start_time)),
	CONSTRAINT auction_check_spread_positive CHECK ((spread >= (0)::numeric)),
	CONSTRAINT auction_check_start_price_positive CHECK ((start_price >= (0)::numeric)),
	CONSTRAINT auction_pk PRIMARY KEY (auction_id),
	CONSTRAINT auction_fk_auctioneer FOREIGN KEY (auctioneer_id) REFERENCES public.account(account_id)
);
CREATE INDEX auction_auctioneer_id_idx ON public.auction USING btree (auctioneer_id);
CREATE INDEX trgm_idx ON public.auction USING gist (name gist_trgm_ops);

-- Table Triggers

CREATE TRIGGER check_start_time_in_future_trigger BEFORE
INSERT
    ON
    public.auction FOR EACH ROW EXECUTE FUNCTION check_start_timestamp_in_future();


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

CREATE TRIGGER check_auction_ongoing_trigger BEFORE
INSERT
    ON
    public.bid FOR EACH ROW EXECUTE FUNCTION check_auction_ongoing();
CREATE TRIGGER check_bid_valid_trigger BEFORE
INSERT
    ON
    public.bid FOR EACH ROW EXECUTE FUNCTION check_bid_valid();
CREATE TRIGGER check_bidder_not_auctioneer_trigger BEFORE
INSERT
    ON
    public.bid FOR EACH ROW EXECUTE FUNCTION check_bidder_not_auctioneer();
CREATE TRIGGER set_bid_timestamp_now_trigger BEFORE
INSERT
    ON
    public.bid FOR EACH ROW EXECUTE FUNCTION set_column_to_now('timestamp');


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
	image_url varchar(140) NOT NULL,
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
	quality_ungraded varchar(100) NULL,
	rarity varchar(100) NOT NULL,
	"set" varchar(100) NULL,
	is_foil bool NOT NULL,
	quality_psa int4 NULL,
	image_url varchar(140) NOT NULL,
	CONSTRAINT card_check_exact_one_quality CHECK (((quality_ungraded IS NULL) <> (quality_psa IS NULL))),
	CONSTRAINT card_check_psa_range CHECK (((quality_psa IS NULL) OR ((1 <= quality_psa) AND (quality_psa <= 10)))),
	CONSTRAINT card_pk PRIMARY KEY (card_id),
	CONSTRAINT card_fk_auction FOREIGN KEY (auction_id) REFERENCES public.auction(auction_id) ON DELETE CASCADE
);
CREATE INDEX card_auction_id_idx ON public.card USING btree (auction_id);


-- public.recommendation definition

-- Drop table

-- DROP TABLE public.recommendation;

CREATE TABLE public.recommendation (
	account_id uuid NOT NULL,
	game varchar(30) NOT NULL,
	price numeric(12, 2) NOT NULL,
	"action" varchar(30) NOT NULL,
	"timestamp" timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT recommendation_pk PRIMARY KEY (account_id, "timestamp"),
	CONSTRAINT recommendation_fk_account FOREIGN KEY (account_id) REFERENCES public.account(account_id)
);


-- public.watch definition

-- Drop table

-- DROP TABLE public.watch;

CREATE TABLE public.watch (
	account_id uuid NOT NULL,
	auction_id uuid NOT NULL,
	CONSTRAINT watch_pk PRIMARY KEY (account_id, auction_id),
	CONSTRAINT watch_fk_account FOREIGN KEY (account_id) REFERENCES public.account(account_id),
	CONSTRAINT watch_fk_auction FOREIGN KEY (auction_id) REFERENCES public.auction(auction_id) ON DELETE CASCADE
);
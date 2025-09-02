create table public.odds ( id uuid not null default gen_random_uuid (), eventid character
varying(100) null, sportsbook character varying(50) not null, marketname character varying(50) not
null, statid character varying(100) null, bettypeid character varying(50) null, closebookodds
numeric(10, 2) null, bookodds integer null, odds_type character varying(10) null default
'current'::character varying, fetched_at timestamp with time zone null default now(), created_at
timestamp with time zone null default now(), leagueid character varying(50) null, hometeam character
varying(100) null, awayteam character varying(100) null, oddid character varying(100) null, playerid
character varying(100) null, periodid character varying(50) null, sideid character varying(50) null,
fanduelodds numeric(10, 2) null, fanduellink text null, espnbetodds numeric(10, 2) null, espnbetlink
text null, ceasarsodds numeric(10, 2) null, ceasarslink text null, mgmodds numeric(10, 2) null,
mgmlink text null, fanaticsodds numeric(10, 2) null, fanaticslink text null, draftkingsodds
numeric(10, 2) null, draftkingslink text null, score character varying(50) null, updated_at
timestamp with time zone null, line character varying null, constraint odds_pkey primary key (id),
constraint odds_game_id_fkey foreign KEY (eventid) references games (id) on delete CASCADE )
TABLESPACE pg_default;

create index IF not exists idx_odds_game_id on public.odds using btree (eventid) TABLESPACE
pg_default;

create index IF not exists idx_odds_market_type on public.odds using btree (marketname) TABLESPACE
pg_default;

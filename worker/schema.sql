create table if not exists connections(company_id text primary key,owner_id text not null,token text not null,updated_at text not null);
create table if not exists oauth_states(state text primary key,company_id text not null,owner_id text not null,expires integer not null);
create table if not exists event_links(company_id text not null,entry_id text not null,google_id text not null,content text not null,last_sync text not null,primary key(company_id,entry_id));
create table if not exists daily_quota(day text primary key,calls integer not null);
create table if not exists sync_locks(company_id text primary key,expires integer not null,lease text not null);

-- Index for fast webhook lookup by mux_asset_id
create index if not exists idx_sessions_mux_asset_id
  on public.programme_sessions(mux_asset_id)
  where mux_asset_id is not null;

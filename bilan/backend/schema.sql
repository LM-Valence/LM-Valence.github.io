-- Bilan Valence : une ligne par date, UAG et UAD.
-- Les autres champs du bilan ne sont pas centralisés.
CREATE TABLE IF NOT EXISTS daily_history (
  day TEXT PRIMARY KEY NOT NULL,
  l_picks INTEGER NOT NULL CHECK(l_picks >= 0 AND l_picks <= 10000000),
  r_picks INTEGER NOT NULL CHECK(r_picks >= 0 AND r_picks <= 10000000),
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_daily_history_day ON daily_history(day DESC);

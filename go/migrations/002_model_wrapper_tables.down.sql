-- 回滚 002：删除补齐的表，并按 001 结构重建 trader_config

DROP TABLE IF EXISTS account_equity_snapshots;
DROP TABLE IF EXISTS market_assets;
DROP TABLE IF EXISTS market_asset_ctx;
DROP TABLE IF EXISTS price_latest;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS model_analytics;
DROP TABLE IF EXISTS trader_config_history;
DROP TABLE IF EXISTS trader_state;
DROP TABLE IF EXISTS trader_runtime_state;
DROP TABLE IF EXISTS trader_symbol_cooldowns;

DROP TABLE IF EXISTS trader_config;
CREATE TABLE trader_config (
    id                TEXT PRIMARY KEY,
    exchange_provider TEXT           NOT NULL,
    market_provider   TEXT           NOT NULL,
    detail            JSONB          NOT NULL,
    detail_checksum   INT            NOT NULL DEFAULT 1,
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trader_config_providers
    ON trader_config (exchange_provider, market_provider);

ALTER TABLE trades DROP COLUMN IF EXISTS close_ts_ms;

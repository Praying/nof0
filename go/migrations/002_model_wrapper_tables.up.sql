-- NOF0 Model Wrapper Tables
--
-- 补齐 internal/model 自定义模型所需的表（见 docs/data-store.md、docs/blueprint-db-todo-v2.md）。
-- goctl 生成代码（internal/model/*_gen.go）与 pkg/repo、internal/persistence 对以下
-- 列名/类型有编译期依赖，写库路径（自定义 InsertTx）还依赖列顺序，务必保持同步：
--
--   trader_config.InsertTx 值序: id, version, exchange_provider, market_provider,
--                                allocation_pct, detail, created_by
--   trader_config_history.InsertTx 值序: trader_id, version, config_snapshot,
--                                       changed_fields, change_reason, changed_by, changed_at
--
-- 注意：allocation_pct 使用 DOUBLE PRECISION（而非 NUMERIC），保证 goctl 映射为 float64。

-- ============================================================================
-- exchange/account：权益快照（自定义 LatestSnapshots 依赖下列列名）
-- ============================================================================

CREATE TABLE account_equity_snapshots (
    id BIGSERIAL PRIMARY KEY,
    model_id TEXT NOT NULL,
    ts_ms BIGINT NOT NULL,
    dollar_equity DOUBLE PRECISION NOT NULL DEFAULT 0,
    realized_pnl DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_unrealized_pnl DOUBLE PRECISION NOT NULL DEFAULT 0,
    cum_pnl_pct DOUBLE PRECISION,
    sharpe_ratio DOUBLE PRECISION,
    since_inception_hourly_marker BIGINT,
    since_inception_minute_marker BIGINT,
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (model_id, ts_ms)
);

CREATE INDEX idx_account_equity_snapshots_model_ts
    ON account_equity_snapshots(model_id, ts_ms DESC);

-- ============================================================================
-- exchange/market：行情元数据与最新价
-- ============================================================================

CREATE TABLE market_assets (
    id BIGSERIAL PRIMARY KEY,
    provider TEXT NOT NULL,
    symbol TEXT NOT NULL,
    is_delisted BOOLEAN NOT NULL DEFAULT FALSE,
    detail JSONB NOT NULL DEFAULT '{}'::jsonb,
    event_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, symbol)
);

CREATE TABLE market_asset_ctx (
    id BIGSERIAL PRIMARY KEY,
    provider TEXT NOT NULL,
    symbol TEXT NOT NULL,
    funding_rate DOUBLE PRECISION,
    open_interest DOUBLE PRECISION,
    impact_price DOUBLE PRECISION,
    detail JSONB NOT NULL DEFAULT '{}'::jsonb,
    event_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, symbol)
);

CREATE TABLE price_latest (
    id BIGSERIAL PRIMARY KEY,
    provider TEXT NOT NULL,
    symbol TEXT NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    ts_ms BIGINT NOT NULL DEFAULT 0,
    detail JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, symbol)
);

-- ============================================================================
-- executor/llm：会话与模型分析
-- ============================================================================

-- RecordConversation 写入依赖列: model_id, topic, created_at, id
CREATE TABLE conversations (
    id BIGSERIAL PRIMARY KEY,
    model_id TEXT NOT NULL,
    topic TEXT,
    detail JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_model ON conversations(model_id);

CREATE TABLE model_analytics (
    id BIGSERIAL PRIMARY KEY,
    model_id TEXT NOT NULL,
    detail JSONB NOT NULL DEFAULT '{}'::jsonb,
    event_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (model_id)
);

-- ============================================================================
-- manager：交易员配置 / 运行时状态
-- ============================================================================

-- engine 收盘写入依赖 close_ts_ms（buildTradeRecord / CloseTsMs 字段）
ALTER TABLE trades ADD COLUMN IF NOT EXISTS close_ts_ms BIGINT NOT NULL DEFAULT 0;

-- 重建 trader_config：001 版本缺少 version/allocation_pct/created_by，
-- 且 detail_checksum 不再使用；列顺序需匹配自定义 InsertTx 值序。
DROP TABLE IF EXISTS trader_config;
CREATE TABLE trader_config (
    id TEXT PRIMARY KEY,
    version INT NOT NULL DEFAULT 1,
    exchange_provider TEXT NOT NULL,
    market_provider TEXT NOT NULL,
    allocation_pct DOUBLE PRECISION NOT NULL DEFAULT 0,
    detail JSONB NOT NULL,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (allocation_pct >= 0 AND allocation_pct <= 100)
);

CREATE INDEX idx_trader_config_providers
    ON trader_config (exchange_provider, market_provider);

CREATE TABLE trader_config_history (
    id BIGSERIAL PRIMARY KEY,
    trader_id TEXT NOT NULL,
    version INT NOT NULL,
    config_snapshot JSONB NOT NULL,
    changed_fields TEXT[],
    change_reason TEXT,
    changed_by TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_config_history_trader_version
    ON trader_config_history(trader_id, version DESC);

CREATE TABLE trader_state (
    trader_id TEXT PRIMARY KEY,
    exchange_provider TEXT NOT NULL,
    market_provider TEXT NOT NULL,
    allocation_pct DOUBLE PRECISION,
    cooldown JSONB,
    risk_guards JSONB,
    last_decision_at TIMESTAMPTZ,
    pause_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE trader_runtime_state (
    trader_id TEXT PRIMARY KEY,
    active_config_version INT NOT NULL DEFAULT 1,
    is_running BOOLEAN NOT NULL DEFAULT FALSE,
    detail JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE trader_symbol_cooldowns (
    id BIGSERIAL PRIMARY KEY,
    trader_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    cooldown_until TIMESTAMPTZ NOT NULL,
    detail JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (trader_id, symbol)
);

-- 注：blueprint 中的 `WHERE cooldown_until > NOW()` 谓词不可用（NOW() 非 IMMUTABLE）
CREATE INDEX idx_cooldowns_expire
    ON trader_symbol_cooldowns(cooldown_until);

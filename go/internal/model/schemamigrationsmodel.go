package model

import (
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ SchemaMigrationsModel = (*customSchemaMigrationsModel)(nil)

type (
	// SchemaMigrationsModel is an interface to be customized, add more methods here,
	// and implement the added methods in customSchemaMigrationsModel.
	SchemaMigrationsModel interface {
		schemaMigrationsModel
	}

	customSchemaMigrationsModel struct {
		*defaultSchemaMigrationsModel
	}
)

// NewSchemaMigrationsModel returns a model for the database table.
func NewSchemaMigrationsModel(conn sqlx.SqlConn, c cache.CacheConf, opts ...cache.Option) SchemaMigrationsModel {
	return &customSchemaMigrationsModel{
		defaultSchemaMigrationsModel: newSchemaMigrationsModel(conn, c, opts...),
	}
}

const Config = require("../Shiori/ShioriConfig");

class DatabaseSubsystem {
    constructor() {
        this.connectionInstance = null;

        this.database = "database";
        this.databaseHost = "localhost";
        this.databasePort = "port";
        this.databaseUser = "database";
        this.databasePassword = "database";

        this.cache = [];
        this.cache_timer_handle = null;
    }

    get Connected() {
        return this.connectionInstance != null;
    }

    Connect() {
        throw new Error("not implemented");
    }

    Query(q, ...values) {
        throw new Error("not implemented");
    }

    GetCachedQuery(query) {
        this.ResetCacheTimer();
        if (this.cache.length > 0) {
            let c = this.cache.filter(c => c.q == query)[0];
            if (c) return c.r;
        }
        return null;
    }

    AddQueryToCache(query, result) {
        this.ResetCacheTimer();
        this.cache.push({
            q: query,
            r: result
        });
    }

    ResetCache() {
        this.cache = [];
    }

    ResetCacheTimer() {
        if (this.cache_timer_handle)
            clearTimeout(this.cache_timer_handle);
        this.cache_timer_handle = setInterval(this.ResetCache, Config.database.cache_reset * 1000);
    }

    Close() {
        throw new Error("not implemented");
    }
}

module.exports = DatabaseSubsystem;
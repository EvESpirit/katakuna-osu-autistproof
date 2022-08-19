const DatabaseSubsystem = require('../DatabaseSubsystem');
const MySQL = require('sync-mysql');
const SQLQuery = require("./SQLSyntax")
const Logger = require("../../Logger");

class MySQLSubsystem extends DatabaseSubsystem {
    Connect() {
        if (this.Connected) return;
        this.connectionInstance = new MySQL({
            host: this.databaseHost,
            user: this.databaseUser,
            password: this.databasePassword,
            database: this.database
        });
    }

    Query(q, ...values) {
        let start = Date.now();
        let cs = 0;

        if (!this.Connected) {
            let c = Date.now();
            this.Connect();
            cs = Date.now() - c;
        }

        let cache = this.GetCachedQuery(q);

        let _q = cache ? cache : this.connectionInstance.query(q, values);
        if (!cache) this.AddQueryToCache(q, _q);

        let qu = Date.now() - start;

        Logger.Warning("Query took", (qu - cs) + 'ms', "in total, connection took", cs + 'ms,', "Query + Connection took", qu + 'ms');

        return _q;
    }

    Close() {
        if (!this.Connected) return;
        this.connectionInstance.dispose();
        this.connectionInstance = null;
    }

    ExecuteQuery(q) {
        return this.Query(SQLQuery(q));
    }

    GenerateQuery(q) {
        return SQLQuery(q);
    }
}

module.exports = MySQLSubsystem;
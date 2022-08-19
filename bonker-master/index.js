/**
osu!katakuna bonker! Avatar Server
Written by r0neko
**/

var Logger = require('./src/Logger');
const fs = require('fs');
const path = require('path');
const SQLEscape = require('sqlstring').escape;
const MySQL = require('sync-mysql');

const defaultConfiguration = {
  database: {
    host: process.env.DB_HOST || "localhost",
    port: 3306,
    username: process.env.DB_USER || "shiori",
    password: process.env.DB_PASSWORD || "shiori",
    database: process.env.DB_DATABASE || "shiori"
  },
  avatarPath: process.env.STORAGE_LOCATION || "/katakuna/storage/a",
  defaultAvatar: "default/default.png",
  ssl: {
    enabled: false,
    key: "/path/to/key.pem",
    cert: "/path/to/cacert.pem"
  },
  port: 3000,
  isUnderProxy: false,
};

// logo moment
console.log("\x1b[32m");
console.log(Buffer.from("Ojo6Ojo6Ojo6ICAgOjo6Ojo6OjogIDo6OjogICAgOjo6IDo6OiAgICA6OjogOjo6Ojo6Ojo6OiA6Ojo6Ojo6OjogIAo6KzogICAgOis6IDorOiAgICA6KzogOis6KzogICA6KzogOis6ICAgOis6ICA6KzogICAgICAgIDorOiAgICA6KzogCis6KyAgICArOisgKzorICAgICs6KyA6KzorOisgICs6KyArOisgICs6KyAgICs6KyAgICAgICAgKzorICAgICs6KyAKKyMrKzorKyMrICArIysgICAgKzorICsjKyArOisgKyMrICsjKys6KysgICAgKyMrKzorKyMgICArIysrOisrIzogIAorIysgICAgKyMrICsjKyAgICArIysgKyMrICArIysjKyMgKyMrICArIysgICArIysgICAgICAgICsjKyAgICArIysgCiMrIyAgICAjKyMgIysjICAgICMrIyAjKyMgICAjKyMrIyAjKyMgICAjKyMgICMrIyAgICAgICAgIysjICAgICMrIyAKIyMjIyMjIyMjICAgIyMjIyMjIyMgICMjIyAgICAjIyMjICMjIyAgICAjIyMgIyMjIyMjIyMjIyAjIyMgICAgIyMjIA==", 'base64').toString());
console.log("\x1b[0m");
// done.

Logger.Info(`Welcome to Bonker, the best avatar server written by r0neko!`);

// load config
let configPath = path.join(path.dirname(require.main.filename), `./config/config.json`);
Logger.Info(`Loading the configuration...`);
if(!fs.existsSync(configPath)) {
  Logger.Failure(`Configuration not found!`);

  Logger.Info("Creating a new configuration file...");
  fs.writeFileSync(configPath, JSON.stringify(defaultConfiguration, null, 2));

  Logger.Success(`Created a new configuration file at ${configPath}\nPlease edit the configuration file!`);
  process.exit(1);
}

let config = require(configPath);
Logger.Success(`Configuration loaded successfully!`);

// database connection

Logger.Info(`Connecting to the database...`);
let dbInstance = new MySQL({
  host: config.database.host,
  user: config.database.username,
  password: config.database.password,
  database: config.database.database
});

Logger.Info(`Testing the DB connection...`);
try {
  dbInstance.query(`SHOW TABLES FROM ${config.database.database}`);
}
catch(e) {
  Logger.Failure("DB connection failed!");
  process.exit(1);
}

// avatar server moment
var app = require('express')();

Logger.Info(`Starting the avatar server...`);
const Server = config.ssl.enabled ? require('https') : require('http');
var options = config.ssl.enabled ? {
  key: fs.readFileSync(path.resolve(path.dirname(require.main.filename), config.ssl.key)),
  cert: fs.readFileSync(path.resolve(path.dirname(require.main.filename), config.ssl.cert))
} : {};

if(config.isUnderProxy) app.set('trust proxy', 'loopback');

const callback = () => {
  Logger.Success(`bonker! started on port ${config.port}${config.ssl.enabled ? "(with SSL enabled)" : ""}.`);
}

app.get("/:uid", AvatarHandler);
app.get("/", (req, res) => {
  res.write("<pre>bonker! - osu! avatar server<br>written by r0neko / <a href=\"https://github.com/osu-katakuna/bonker\">https://github.com/osu-katakuna/bonker<\/a></pre>");
  res.end();
});

if(config.ssl.enabled) Server.createServer(options, app).listen(config.port, callback);
else Server.createServer(app).listen(config.port, callback);

function AvatarHandler(req, res) {
  Logger.Info(`[${req.params.uid}] ${req.ip} - ${new Date()} - ${req.get('User-Agent')}`);

  if(isNaN(req.params.uid)) {
    res.sendFile(path.join(config.avatarPath, config.defaultAvatar));
    return;
  }

  try {
    let u = dbInstance.query(`SELECT avatar FROM users WHERE id = ${SQLEscape(req.params.uid)}`);
    if(u.length > 0 && u[0].avatar != null) {
      if(fs.existsSync((x = path.join(config.avatarPath, u[0].avatar))))
        res.sendFile(x);
      else res.sendFile(path.join(config.avatarPath, config.defaultAvatar));
    } else {
      res.sendFile(path.join(config.avatarPath, config.defaultAvatar));
    }
  }
  catch(e) {
    Logger.Failure(e);
    res.sendFile(path.join(config.avatarPath, config.defaultAvatar));
  }
}

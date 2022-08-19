var GlobalRouter = require('express').Router();
var BanchoEmulator = require("../BanchoEmulator");
var fs = require('fs');
var path = require('path');

function noop() {}

function RegisterRoute(cb) {
  if(!cb) throw new Error("a callback should be provided.");
  cb(GlobalRouter);
}

function StartServer(callback = noop) {
  var app = require('express')();
  const Config = require("../Shiori/ShioriConfig");

  const Server = Config.server.ssl.enabled ? require('https') : require('http');

  var options = Config.server.ssl.enabled ? {
    key: fs.readFileSync(path.resolve(path.dirname(require.main.filename), Config.server.ssl.key)),
    cert: fs.readFileSync(path.resolve(path.dirname(require.main.filename), Config.server.ssl.cert))
  } : {};

  if(Config.server.isUnderProxy) app.set('trust proxy', 'loopback');

  app.use(function (req, res, next) {
    const Logger = require("../Logger");
    Logger.Info(`${req.method} ${req.path} - ${req.ip} - ${new Date()} - ${req.get('User-Agent')}`);
    if(req.get("Content-Type") != null && req.get("Content-Type").toLowerCase().indexOf("multipart/form-data") >= 0) next();
    else {
      req.pipe(require('concat-stream')(function(data){
    		req.body = data;
    		next();
    	}));
    }
  });

  app.use(GlobalRouter);
  app.use(BanchoEmulator);

  if(Config.server.ssl.enabled) Server.createServer(options, app).listen(Config.server.port, callback);
  else Server.createServer(app).listen(Config.server.port, callback);
}

module.exports = {
  RegisterRoute,
  StartServer
};

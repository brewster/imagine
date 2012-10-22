"use strict";

var fs = require('fs');
var cluster = require('cluster');
var winston = require('winston');
var operations = require('./lib/imagine/operations');
var Server = require('./lib/imagine/server');
var SignVerifier = require('./lib/imagine/sign_verifier');
var statsd = require('./lib/imagine/statsd');
var storage = require('./lib/imagine/storage');

// Get the configuration
var config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

// Each worker runs a server
if (!cluster.isMaster || config.disable_cluster) {

  // Configure logging
  if (config.logging) {
    winston.remove(winston.transports.Console);
    config.logging.forEach(function (info) {
      var type = info.type;
      delete info.type;
      winston.add(winston.transports[type], info);
    });
  }

  // Configure statsd
  statsd.configure(config.statsd || { silent: true });

  // Configure the Hmac key
  if (config.signedKey) {
    SignVerifier.signedKey = config.signedKey;
  }

  // Load up the operations modules
  operations.configure(config.operations);

  // Start up the storage module and then the server
  storage.configure(config, function () {
    new Server(config).start();
  });

} else {

  // Set the worker amount to either the configuration option or the cpu count
  var workerCount = config.workers || require('os').cpus().length;

  // Fork off the workers
  var i;
  for (i = 0; i < workerCount; i += 1) {
    cluster.fork();
  }

  // Restart workers if they die
  cluster.on('exit', function (worker) {
    winston.warn('worker ' + worker.process.pid + ' died, restarting...');
    cluster.fork();
  });

}

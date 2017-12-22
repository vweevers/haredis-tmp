assert = require('assert');
util = require('util');
tmp = require('../');
haredis = require('haredis');
ioredis = require('ioredis');
existsSync = require('fs').existsSync || require('path').existsSync;
spawn = require('child_process').spawn;
path = require('path');
net = require('net');

assertPorts = function (ports, done) {
  var latch = ports.length;
  ports.forEach(function (port) {
    var socket = net.createConnection(port);
    socket.once('error', done);
    socket.once('connect', function () {
      socket.once('close', function () {
        if (!--latch) done();
      });
      socket.end();
    });
  });
};

assertNoPorts = function (ports, done) {
  var latch = ports.length;
  ports.forEach(function (port) {
    var socket = net.createConnection(port);
    socket.once('error', function (err) {
      if (!--latch) done();
    });
    socket.once('connect', function () {
      assert.fail('connected', 'not connected');
    });
  });
};

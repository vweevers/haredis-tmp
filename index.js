var exec = require('child_process').exec
  , spawn = require('child_process').spawn
  , fs = require('fs')
  , path = require('path')
  , mkdirp = require('mkdirp')
  , rimraf = require('rimraf')
  , idgen = require('idgen')
  , tmpdir = require('os').tmpdir()

module.exports = function tmp (ports, cb) {
  var p = path.join(tmpdir, 'haredis-tmp-' + idgen())
    , servers = {}
    , killed = false

  function makeServer (port, cb) {
    exec('redis-server --version', function (err, stdout, stderr) {
      if (err) return cb(err);
      var version;
      var matches = stdout.match(/Redis server v=(.*) sha=/);
      if (matches) version = matches[1];
      else {
        matches = stdout.match(/version ([^ ]+) /);
        if (matches) version = matches[1];
        else return cb(new Error('could not detect redis-server version! ' + stdout));
      }
      var dir = path.join(p, String(port));
      var configfile = path.join(dir, 'redis.conf');
      mkdirp(dir, function (err) {
        if (err) return cb(err);
        var conf = 'port ' + port + '\ndir ' + dir + '\n';
        if (!version.match(/^2\.(2|3|4)\./)) conf += 'slave-read-only no\n';

        fs.writeFile(configfile, conf, function (err) {
          if (err) return cb(err)

          var child = spawn('redis-server', [configfile], { stdio: ['ignore', 'pipe', 'inherit'] });
          var started = false;
          var buf = '';

          child.stdout.on('data', function handleData (chunk) {
            if (/The server is now ready/.test(buf+= chunk)) {
              child.stdout.removeListener('data', handleData)
              clearTimeout(timeout);
              cb(null, child);
            }
          });

          var timeout = setTimeout(function () {
            cb(new Error('redis-server on port ' + port + ' failed to start'));
          }, 10000);

          timeout.unref();
        });
      });
    });
  }

  function shutdown (cb) {
    if (killed) return;
    else killed = true;

    process.removeListener('SIGTERM', shutdown);
    process.removeListener('SIGINT', shutdown);

    var latch = Object.keys(servers).length;

    Object.keys(servers).forEach(function (port) {
      servers[port].once('exit', function () {
        if (!--latch) {
          if (typeof cb === 'function') rimraf(p, cb);
          else rimraf.sync(p);
        }
      });
      servers[port].kill('SIGKILL');
    });
  }
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);

  var errored = false, latch = ports.length;
  function onErr (err) {
    if (errored) return;
    errored = true;
    if (cb) cb(err);
    else throw err;
  }
  ports.forEach(function (port) {
    if (typeof port === 'string') port = Number(port.split(':')[1]);
    makeServer(port, function (err, server) {
      if (err || errored) return onErr(err);
      servers[port] = server;
      if (!--latch) cb && cb(null, p, shutdown, servers);
    });
  });
};

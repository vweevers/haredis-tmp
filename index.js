var exec = require('child_process').exec
  , spawn = require('child_process').spawn
  , mkdirp = require('mkdirp')
  , rimraf = require('rimraf')
  , idgen = require('idgen')

module.exports = function tmp (ports, cb) {
  var p = '/tmp/haredis-tmp-' + idgen()
    , servers = {}

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
      var dir = p + '/' + port;
      mkdirp(dir, function (err) {
        if (err) return cb(err);
        var conf = 'port ' + port + '\ndir ' + dir + '\n';
        if (!version.match(/^2\.(2|3|4)\./)) conf += 'slave-read-only no\n';
        var child = spawn('redis-server', ['-']);
        var started = false;
        child.stdin.end(conf);
        child.stderr.pipe(process.stderr);
        child.stdout.on('data', function (chunk) {
          if (~String(chunk).indexOf('The server is now ready')) {
            started = true;
            cb(null, child);
          }
        });
        setTimeout(function () {
          if (!started) return cb(new Error('redis-server on port ' + port + ' failed to start'));
        }, 10000);
      });
    });
  }

  function shutdown (cb) {
    var latch = Object.keys(servers).length;
    rimraf.sync(p);
    Object.keys(servers).forEach(function (port) {
      servers[port].once('exit', function () {
        if (!--latch && typeof cb === 'function') cb();
      });
      servers[port].kill('SIGKILL');
    });
    servers = {};
  }
  process.once('exit', shutdown);
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

describe('cli', function () {
  var ports = [6383, 6384, 6385]
    , child
    , p
    , client

  it('create a cluster', function (done) {
    child = spawn(path.join(__dirname, '../bin/haredis-tmp'), ports);
    child.stderr.pipe(process.stderr);
    child.stdout.on('data', function (data) {
      var match = String(data).match(/started: (.*)/);
      p = match[1];
      assert(~p.indexOf('haredis-tmp'));
      assert(existsSync(p));
      done();
    });
  });

  it('ports accessible', function (done) {
    assertPorts(ports, done);
  });

  it('connect to cluster', function (done) {
    client = haredis.createClient(ports, {log_level: 0});
    client.once('connect', function () {
      assert.equal(client.up.length, 3);
      done();
    });
  });

  it('quit client', function (done) {
    client.quit(done);
  });

  it('shutdown cluster', function (done) {
    child.once('exit', function (status) {
      assert(!status);
      done();
    });
    child.kill('SIGINT');
  });

  it('ports not accessible', function (done) {
    assertNoPorts(ports, done);
  });

  it('no files left over', function () {
    assert(!existsSync(p));
  });
});

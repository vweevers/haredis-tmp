/* global it describe assert assertPorts assertNoPorts haredis tmp existsSync */

describe('basic test', function () {
  let ports = [6380, 6381, 6382]
  let shutdown
  let client
  let p
  let servers

  it('create a cluster', function (done) {
    tmp(ports, function (err, arg1, arg2, arg3) {
      assert.ifError(err)
      p = arg1
      shutdown = arg2
      servers = arg3
      assert.equal(typeof shutdown, 'function')
      assert.equal(typeof p, 'string')
      assert(~p.indexOf('haredis-tmp'))
      assert(existsSync(p))
      assert.equal(Object.keys(servers).length, 3)
      done()
    })
  })

  it('ports accessible', function (done) {
    assertPorts(ports, done)
  })

  it('connect to cluster', function (done) {
    client = haredis.createClient(ports, { log_level: 0 })
    client.once('connect', function () {
      assert.equal(client.up.length, 3)
      done()
    })
  })

  it('quit client', function (done) {
    client.quit(done)
  })

  it('shutdown cluster', function (done) {
    shutdown(done)
  })

  it('ports not accessible', function (done) {
    assertNoPorts(ports, done)
  })

  it('no files left over', function () {
    assert(!existsSync(p))
  })
})

/* global it describe assert assertPorts assertNoPorts tmp existsSync */

const Redis = require('ioredis')

describe('password test with ioredis', function () {
  let port = 6380
  let shutdown
  let client
  let p
  let servers

  it('create an instance', function (done) {
    tmp([port], { password: 'qwerty' }, function (err, arg1, arg2, arg3) {
      assert.ifError(err)
      p = arg1
      shutdown = arg2
      servers = arg3
      assert.equal(typeof shutdown, 'function')
      assert.equal(typeof p, 'string')
      assert(~p.indexOf('haredis-tmp'))
      assert(existsSync(p))
      assert.equal(Object.keys(servers).length, 1)
      done()
    })
  })

  it('ports accessible', function (done) {
    assertPorts([port], done)
  })

  it('connect to instance', function (done) {
    client = new Redis({
      port: port,
      host: '127.0.0.1',
      family: 4,
      password: 'qwerty'
    })

    client.once('connect', function () {
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
    assertNoPorts([port], done)
  })

  it('no files left over', function () {
    assert(!existsSync(p))
  })
})

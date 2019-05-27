/* global it describe */

const tmp = require('..')
const haredis = require('haredis')
const Redis = require('ioredis')
const assert = require('assert')
const existsSync = require('fs').existsSync
const net = require('net')

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
      assert.strictEqual(typeof shutdown, 'function')
      assert.strictEqual(typeof p, 'string')
      assert(~p.indexOf('haredis-tmp'))
      assert(existsSync(p))
      assert.strictEqual(Object.keys(servers).length, 3)
      done()
    })
  })

  it('ports accessible', function (done) {
    assertPorts(ports, done)
  })

  it('connect to cluster', function (done) {
    client = haredis.createClient(ports, { log_level: 0 })
    client.once('connect', function () {
      assert.strictEqual(client.up.length, 3)
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
      assert.strictEqual(typeof shutdown, 'function')
      assert.strictEqual(typeof p, 'string')
      assert(~p.indexOf('haredis-tmp'))
      assert(existsSync(p))
      assert.strictEqual(Object.keys(servers).length, 1)
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

function assertPorts (ports, done) {
  let latch = ports.length

  ports.forEach(function (port) {
    const socket = net.createConnection(port)

    socket.once('error', done)
    socket.once('connect', function () {
      socket.once('close', function () {
        if (!--latch) done()
      })

      socket.end()
    })
  })
}

function assertNoPorts (ports, done) {
  let latch = ports.length

  ports.forEach(function (port) {
    const socket = net.createConnection(port)

    socket.once('error', function () {
      if (!--latch) done()
    })

    socket.once('connect', function () {
      assert.fail('connected', 'not connected')
    })
  })
}

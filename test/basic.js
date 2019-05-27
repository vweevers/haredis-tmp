'use strict'

const test = require('tape')
const haredis = require('haredis')
const Redis = require('ioredis')
const existsSync = require('fs').existsSync
const net = require('net')
const tmp = require('..')

test('basic', function (t) {
  let ports = [6380, 6381, 6382]
  let shutdown
  let client
  let p
  let servers

  t.test('create a cluster', function (t) {
    tmp(ports, function (err, arg1, arg2, arg3) {
      t.ifError(err)
      p = arg1
      shutdown = arg2
      servers = arg3
      t.is(typeof shutdown, 'function')
      t.is(typeof p, 'string')
      t.ok(~p.indexOf('haredis-tmp'))
      t.ok(existsSync(p))
      t.is(Object.keys(servers).length, 3)
      t.end()
    })
  })

  t.test('ports accessible', function (t) {
    assertPorts(t, ports, t.end.bind(t))
  })

  t.test('connect to cluster', function (t) {
    client = haredis.createClient(ports, { log_level: 0 })
    client.once('connect', function () {
      t.is(client.up.length, 3)
      t.end()
    })
  })

  t.test('quit client', function (t) {
    client.quit(t.end.bind(t))
  })

  t.test('shutdown cluster', function (t) {
    shutdown(t.end.bind(t))
  })

  t.test('ports not accessible', function (t) {
    assertNoPorts(t, ports, t.end.bind(t))
  })

  t.test('no files left over', function (t) {
    t.ok(!existsSync(p))
    t.end()
  })

  t.end()
})

test('password test with ioredis', function (t) {
  let port = 6380
  let shutdown
  let client
  let p
  let servers

  t.test('create an instance', function (t) {
    tmp([port], { password: 'qwerty' }, function (err, arg1, arg2, arg3) {
      t.ifError(err)
      p = arg1
      shutdown = arg2
      servers = arg3
      t.is(typeof shutdown, 'function')
      t.is(typeof p, 'string')
      t.ok(~p.indexOf('haredis-tmp'))
      t.ok(existsSync(p))
      t.is(Object.keys(servers).length, 1)
      t.end()
    })
  })

  t.test('ports accessible', function (t) {
    assertPorts(t, [port], t.end.bind(t))
  })

  t.test('connect to instance', function (t) {
    client = new Redis({
      port: port,
      host: '127.0.0.1',
      family: 4,
      password: 'qwerty'
    })

    client.once('ready', function () {
      t.end()
    })
  })

  t.test('quit client', function (t) {
    client.quit(t.end.bind(t))
  })

  t.test('shutdown cluster', function (t) {
    shutdown(t.end.bind(t))
  })

  t.test('ports not accessible', function (t) {
    assertNoPorts(t, [port], t.end.bind(t))
  })

  t.test('no files left over', function (t) {
    t.ok(!existsSync(p))
    t.end()
  })
})

function assertPorts (t, ports, done) {
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

function assertNoPorts (t, ports, done) {
  let latch = ports.length

  ports.forEach(function (port) {
    const socket = net.createConnection(port)

    socket.once('error', function () {
      if (!--latch) done()
    })

    socket.once('connect', function () {
      t.fail('connected')
    })
  })
}

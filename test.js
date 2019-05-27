'use strict'

const test = require('tape')
const Redis = require('ioredis')
const existsSync = require('fs').existsSync
const net = require('net')
const tmp = require('.')

test('basic', function (t) {
  const port = 6380

  let shutdown
  let path

  t.test('start redis', function (t) {
    tmp(port, function (err, shutdown_, path_) {
      t.ifError(err)
      shutdown = shutdown_
      path = path_
      t.is(typeof shutdown, 'function')
      t.is(typeof path, 'string')
      t.end()
    })
  })

  t.test('connect', function (t) {
    const client = new Redis({
      port: port,
      host: '127.0.0.1',
      family: 4
    })

    client.once('ready', function () {
      t.pass('ready')
      client.disconnect()
      t.end()
    })
  })

  t.test('shutdown', function (t) {
    shutdown(function (err) {
      t.ifError(err, 'no shutdown error')
      t.end()
    })
  })

  t.test('ports not accessible', function (t) {
    assertNoPorts(t, [port], t.end.bind(t))
  })

  t.test('no files left over', function (t) {
    t.ok(!existsSync(path))
    t.end()
  })

  t.end()
})

test('password test with ioredis', function (t) {
  let port = 6380
  let shutdown

  t.test('start redis', function (t) {
    tmp(port, { password: 'qwerty' }, function (err, shutdown_) {
      t.ifError(err)
      shutdown = shutdown_
      t.end()
    })
  })

  t.test('connect', function (t) {
    const client = new Redis({
      port: port,
      host: '127.0.0.1',
      family: 4,
      password: 'qwerty'
    })

    client.once('ready', function () {
      t.pass('ready')
      client.disconnect()
      t.end()
    })
  })

  t.test('shutdown', function (t) {
    shutdown(t.end.bind(t))
  })
})

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

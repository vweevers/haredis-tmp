global.assert = require('assert')
// global.util = require('util')
global.tmp = require('..')
global.haredis = require('haredis')
global.existsSync = require('fs').existsSync || require('path').existsSync
global.spawn = require('child_process').spawn
global.path = require('path')

const net = require('net')
const assert = require('assert')

global.assertPorts = function (ports, done) {
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

global.assertNoPorts = function (ports, done) {
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

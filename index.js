'use strict'

const spawn = require('child_process').spawn
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const idgen = require('idgen')
const tmpdir = require('os').tmpdir()

let warned = false

module.exports = function tmp (port, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }

  if (Array.isArray(port)) {
    if (port.length > 1) {
      throw new Error('Redis cluster support was removed. Provide a single port.')
    } else if (!warned) {
      warned = true
      process.emitWarning('Redis cluster support was removed. Provide a single port.', 'haredis-tmp')
    }

    port = port[0]
  }

  // TODO: use tempy
  const p = path.join(tmpdir, 'haredis-tmp-' + idgen() + '-' + Date.now())
  const servers = {}
  const ports = [port]

  let killed = false

  // TODO: throw error on premature exit
  function makeServer (port, cb) {
    const dir = p
    const configfile = path.join(dir, 'redis.conf')

    mkdirp(dir, function (err) {
      if (err) return cb(err)

      let conf = 'port ' + port + '\ndir ' + dir + '\n'

      if (opts.password) {
        conf += 'requirepass ' + opts.password.trim() + '\n'
      }

      if (opts.bufferLimit === false) {
        conf += 'client-output-buffer-limit pubsub 0 0 0\n'
        conf += 'client-output-buffer-limit slave 0 0 0\n'
      }

      fs.writeFile(configfile, conf, function (err) {
        if (err) return cb(err)

        const child = spawn('redis-server', [configfile], { stdio: ['ignore', 'pipe', 'inherit'] })

        let started = false
        let buf = ''

        child.stdout.on('data', function handleData (chunk) {
          if (!started && /The server is now ready/.test(buf += chunk)) {
            if (opts.verbose) {
              child.stdout.removeListener('data', handleData)
              child.stdout.pipe(process.stderr)
            }

            started = true
            clearTimeout(timeout)
            cb(null, child)
          }
        })

        const timeout = setTimeout(function () {
          cb(new Error('redis-server on port ' + port + ' failed to start'))
        }, 10000)

        timeout.unref()
      })
    })
  }

  function shutdown (cb) {
    if (killed) return
    else killed = true

    let latch = Object.keys(servers).length

    Object.keys(servers).forEach(function (port) {
      servers[port].once('exit', function () {
        if (!--latch) {
          if (typeof cb === 'function') rimraf(p, cb)
          else rimraf.sync(p)
        }
      })

      servers[port].kill('SIGKILL')
    })
  }

  let errored = false
  let latch = ports.length

  function onErr (err) {
    if (errored) return
    errored = true
    if (cb) cb(err)
    else throw err
  }

  ports.forEach(function (port) {
    if (typeof port === 'string') port = Number(port.split(':')[1])

    makeServer(port, function (err, server) {
      if (err || errored) return onErr(err)
      servers[port] = server
      if (!--latch) cb && cb(null, shutdown, p)
    })
  })
}

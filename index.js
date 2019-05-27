'use strict'

const tempy = require('tempy')
const rimraf = require('rimraf')
const spawn = require('child_process').spawn
const fs = require('fs')
const path = require('path')

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
      process.emitWarning('Redis cluster support was removed. Provide a single port.', 'tmp-redis')
    }

    port = port[0]
  }

  const dir = tempy.directory()
  const configfile = path.join(dir, 'redis.conf')

  let started = false
  let killed = false
  let onExit
  let buf = ''
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

    const cp = spawn('redis-server', [configfile], { stdio: ['ignore', 'pipe', 'inherit'] })

    cp.stdout.on('data', handleData)
    cp.once('exit', handleExit)

    function handleData (chunk) {
      if (!started && /The server is now ready/.test(buf += chunk)) {
        if (opts.verbose) {
          cp.stdout.removeListener('data', handleData)
          cp.stdout.pipe(process.stderr)
        }

        started = true
        cb(null, shutdown, dir)
      }
    }

    function handleExit (code) {
      cp.stdout.removeListener('data', handleData)

      if (!started) return cb(new Error(`Premature exit with code ${code}`))
      if (!killed) throw new Error(`Premature exit with code ${code}`)

      rimraf(dir, { glob: false }, onExit)
    }

    function shutdown (cb) {
      if (typeof cb !== 'function') {
        throw new Error('The first argument of shutdown() must be a function')
      } else if (killed) {
        throw new Error('Cannot call shutdown() twice')
      }

      killed = true
      onExit = cb
      cp.kill('SIGKILL')
    }
  })
}

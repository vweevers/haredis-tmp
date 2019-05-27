# tmp-redis

> **Start a single Redis server for testing or ephemeral data.**  
> `redis-server` must be available in `PATH`. No cluster support.

[![npm](https://img.shields.io/npm/v/tmp-redis.svg?label=&logo=npm)](https://www.npmjs.com/package/tmp-redis)
[![Node version](https://img.shields.io/node/v/tmp-redis.svg)](https://www.npmjs.com/package/tmp-redis)
[![Travis](https://img.shields.io/travis/vweevers/tmp-redis.svg?logo=travis&label=)](https://travis-ci.org/vweevers/tmp-redis)
[![AppVeyor](https://img.shields.io/appveyor/ci/vweevers/tmp-redis.svg?logo=appveyor&label=)](https://ci.appveyor.com/project/vweevers/tmp-redis)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Usage

Start a Redis server on port 6380:

```js
const tmp = require('tmp-redis')

tmp(6380, function (err, shutdown) {
  if (err) throw err

  // When you're done
  shutdown(function (err) {
    if (err) throw err
  })
})
```

## API

### `tmp(port[, options], callback)`

Port must be a number. The `callback` will receive an error if any, a `shutdown` function that stops Redis, and a `path` string to the configuration on disk (in a temporary directory). The optional `options` object may contain the following properties:

- `verbose`: boolean, if `true`, pipe Redis output to stderr
- `password`: string, default none, require clients to connect with this password
- `bufferLimit`: boolean, if `false`, disable `client-output-buffer-limit`

## License

[MIT](LICENSE.md) © 2013-present [Carlos Rodriguez](http://s8f.org/), [Terra Eclipse, Inc.](http://www.terraeclipse.com/) and [Contributors](CONTRIBUTORS.md). Forked from [`haredis-tmp`](https://github.com/carlos8f/haredis-tmp).

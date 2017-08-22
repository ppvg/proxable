# Proxable

Simple, unobtrosive function wrapper to allow for direct stubbing and spying.
This is useful when writing tests for code that declares its dependencies using
object destructuring or ESM `import` statements.

Returns the original function when `NODE_ENV=production` for zero overhead in
production. This can be overruled by also setting `PROXABLE=true`.

## Functions

### `createProxable(fn)`

Takes a function `fn` to wrap (required).

Returns a wrapped function that proxies throught to `fn` by default.

_Aliases: `proxable()`, `create()`_

### `installStub(proxable, [stub])`

Takes a wrapped `proxable` function (required) and a `stub` function or value.

- If `stub` is a function, it is installed as the `proxable`'s' replacement
  function.  function's original.
- If `stub` is any other value, a new function that returns the value `stub` is
  installed as the `proxable`'s replacement.

Returns the replacement function.

_Alias: `stub()`_

### `installProxy(proxable, proxyMap)`

Takes a wrapped `proxable` function (required) and a function that maps the
original function to a replacement function (required).

Returns the replacement function.

_Alias: `proxy()`_

### `restoreOriginal(proxable)`

Takes a wrapped `proxable` function (required) and restores its original
behaviour.

_Alias: `restore()`_

## Use case

What if you want to unit test the following code?

```js
// users.js

const { find } = require('./database')

module.exports = {
  findUser (username) {
    return find('user', { name: username });
  }
}
```

You might want to stub out `database.find` using [sinon](http://sinonjs.org/)
(or similar). Normally you'd do something like this:

```js
// users.test.js

const sinon = require('sinon')
const users = require('./users')
const database = require('./database')

sinon.stub(database, 'find')
```

But this won't work, since `users.js` has a direct reference to the orignal,
unstubbed `database.find`:

```js
const users.findUser('steve')
assert.equal(database.find.callCount, 1) // !-> AssertionError [ERR_ASSERTION]: 0 == 1
```

That's where proxable comes in. By instrumenting `database.find`, you can stub
or spy on it even for code that has a direct reference to it:

```js
// database.js

const { createProxable } = require('proxable')

module.exports {
  find: createProxable(function find (table, params) {
    // [...]
  })
}
```

Which allows you to stub it in your test:

```js
// users.test.js

const { installStub, restoreOriginal } = require('proxable')
const sinon = require('sinon')
const users = require('./users')
const database = require('./database')

installStub(database.find, sinon.stub())

const users.findUser('steve')
assert.equal(database.find.callCount, 1) // -> OK

restoreOriginal(database.find)
```

# License

Distributed under the ISC license (see
[LICENSE](https://github.com/ppvg/proxable/blob/master/LICENSE)).

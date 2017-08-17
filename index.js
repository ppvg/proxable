'use strict'

module.exports = {
  createProxable,
  installProxy,
  installStub,
  restoreOriginal,
  proxable: createProxable,
  proxy: installProxy,
  stub: installStub,
  restore: restoreOriginal
}

const PROXABLE = Symbol('proxable')
const ORIGINAL = Symbol('original')
const PROXY = Symbol('proxy')

function createProxable (fn) {
  return shouldWrap() ? wrap(fn) : fn
}

function shouldWrap () {
  return (
    process.env.NODE_ENV !== 'production' ||
    process.env.PROXABLE === 'true' ||
    process.env.PROXABLE === '1' ||
    process.env.PROXABLE === true
  )
}

function wrap (fn) {
  const name = fn.name ? `${fn.name}Proxy` : 'proxy'
  return Object.defineProperties(
    function proxy () {
      return (proxy[PROXY] || proxy[ORIGINAL]).apply(this, arguments)
    },
    {
      name: {value: name, writable: false},
      [PROXABLE]: {value: true, writable: false},
      [ORIGINAL]: {value: fn, writable: false},
      [PROXY]: {value: fn, writable: true}
    }
  )
}

function installProxy (proxable, mapFn) {
  if (!proxable || !proxable[PROXABLE]) { throw new Error('Not proxable') }
  if (typeof mapFn !== 'function') { throw new Error('Not a function') }
  const fn = mapFn(proxable[ORIGINAL])
  if (typeof fn !== 'function') { throw new Error('Not a function') }
  proxable[PROXY] = fn
  return fn
}

function installStub (proxable, stub) {
  return installProxy(
    proxable,
    () => ((typeof stub === 'function') ? stub : () => stub)
  )
}

function restoreOriginal (proxable) {
  if (!proxable || !proxable[PROXABLE]) { throw new Error('Not proxable') }
  proxable[PROXY] = undefined
}

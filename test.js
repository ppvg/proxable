'use strict'

const tap = require('tap')

const createProxable = require('./index').createProxable
const installStub = require('./index').installStub
const installProxy = require('./index').installProxy
const restoreOriginal = require('./index').restoreOriginal

if (process.env.NODE_ENV === 'production') {
  tap.bailout('Unable to run tests because NODE_ENV=production.')
}

tap.test('createProxable', t => {
  const proxable = createProxable(() => 'original')
  t.equal(proxable(), 'original')
  t.equal(proxable.name, 'proxy')

  const namedProxable = createProxable(function named () {})
  t.equal(namedProxable.name, 'namedProxy')

  t.end()
})

tap.test('installProxy', t => {
  const original = () => 'original'
  const proxable = createProxable(original)

  t.throws(() => {
    installProxy(
      original,
      a => a
    )
  }, /Not proxable/, 'Invalid target')
  t.equal(proxable(), 'original')

  t.throws(() => {
    installProxy(
      proxable,
      'not original?'
    )
  }, /mapFn is not a function/, 'Invalid map function')
  t.equal(proxable(), 'original')

  t.throws(() => {
    installProxy(
      proxable,
      original => 'not original?'
    )
  }, /mapFn does not return a function/, 'Invalid proxy')
  t.equal(proxable(), 'original')

  let replacement
  const result = installProxy(
    proxable,
    original => {
      replacement = () => `not ${original()}!`
      return replacement
    }
  )
  t.equal(proxable(), 'not original!')
  t.equal(result, replacement, 'installProxy returns unproxied replacement function')

  t.end()
})

tap.test('installStub', t => {
  const original = () => 'original'
  const proxable = createProxable(original)

  t.throws(() => {
    installStub(original)
  }, /Not proxable/, 'Invalid target')
  t.equal(proxable(), 'original')

  installStub(proxable, 'stub value')
  t.equal(proxable(), 'stub value')

  const stubFunc = () => 'stub function'
  const result = installStub(proxable, stubFunc)
  t.equal(proxable(), 'stub function')
  t.equal(result, stubFunc, 'installStub returns unproxied replacement function')

  t.end()
})

tap.test('restoreOriginal', t => {
  const original = () => 'original'
  const proxable = createProxable(original)
  installStub(proxable, () => 'stub')

  t.throws(() => {
    restoreOriginal(original)
  }, /Not proxable/, 'Invalid target')
  t.equal(proxable(), 'stub')

  restoreOriginal(proxable)
  t.equal(proxable(), 'original')

  t.end()
})

tap.test('skip', t => {
  const original = () => 'original'
  const NODE_ENV = process.env.NODE_ENV

  t.notEqual(original, createProxable(original))

  process.env.NODE_ENV = 'production'
  t.equal(original, createProxable(original))

  process.env.PROXABLE = 'true'
  t.notEqual(original, createProxable(original))

  process.env.PROXABLE = '1'
  t.notEqual(original, createProxable(original))

  process.env.PROXABLE = true
  t.notEqual(original, createProxable(original))

  process.env.NODE_ENV = NODE_ENV
  t.end()
})

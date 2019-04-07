'use strict'

const tap = require('tap')
const getColorizer = require('../../lib/colors')
const utils = require('../../lib/utils')

tap.test('prettifyLevel', t => {
  const { prettifyLevel } = utils

  t.test('returns `undefined` for unknown level', async t => {
    const colorized = prettifyLevel({ log: {} })
    t.is(colorized, undefined)
  })

  t.test('returns non-colorized value for default colorizer', async t => {
    const log = {
      level: 30
    }
    const colorized = prettifyLevel({ log })
    t.is(colorized, 'INFO ')
  })

  t.test('returns colorized value for color colorizer', async t => {
    const log = {
      level: 30
    }
    const colorizer = getColorizer(true)
    const colorized = prettifyLevel({ log, colorizer })
    t.is(colorized, '\u001B[32mINFO \u001B[39m')
  })

  t.end()
})

tap.test('prettifyMessage', t => {
  const { prettifyMessage } = utils

  t.test('returns `undefined` if `messageKey` not found', async t => {
    const str = prettifyMessage({ log: {} })
    t.is(str, undefined)
  })

  t.test('returns `undefined` if `messageKey` not string', async t => {
    const str = prettifyMessage({ log: { msg: {} } })
    t.is(str, undefined)
  })

  t.test('returns non-colorized value for default colorizer', async t => {
    const str = prettifyMessage({ log: { msg: 'foo' } })
    t.is(str, 'foo')
  })

  t.test('returns non-colorized value for alternate `messageKey`', async t => {
    const str = prettifyMessage({ log: { message: 'foo' }, messageKey: 'message' })
    t.is(str, 'foo')
  })

  t.test('returns colorized value for color colorizer', async t => {
    const colorizer = getColorizer(true)
    const str = prettifyMessage({ log: { msg: 'foo' }, colorizer })
    t.is(str, '\u001B[36mfoo\u001B[39m')
  })

  t.test('returns colorized value for color colorizer for alternate `messageKey`', async t => {
    const colorizer = getColorizer(true)
    const str = prettifyMessage({ log: { message: 'foo' }, messageKey: 'message', colorizer })
    t.is(str, '\u001B[36mfoo\u001B[39m')
  })

  t.end()
})

tap.test('prettifyTime', t => {
  const { prettifyTime } = utils

  t.test('returns `undefined` if `time` or `timestamp` not in log', async t => {
    const str = prettifyTime({ log: {} })
    t.is(str, undefined)
  })

  t.test('returns prettified formatted time', async t => {
    let log = { time: 1554642900000 }
    let str = prettifyTime({ log, translateFormat: true })
    t.is(str, '[2019-04-07 13:15:00.000 +0000]')

    log = { timestamp: 1554642900000 }
    str = prettifyTime({ log, translateFormat: true })
    t.is(str, '[2019-04-07 13:15:00.000 +0000]')

    log = { time: '2019-04-07T09:15:00.000-04:00' }
    str = prettifyTime({ log, translateFormat: true })
    t.is(str, '[2019-04-07 13:15:00.000 +0000]')

    log = { timestamp: '2019-04-07T09:15:00.000-04:00' }
    str = prettifyTime({ log, translateFormat: true })
    t.is(str, '[2019-04-07 13:15:00.000 +0000]')

    log = { time: 1554642900000 }
    str = prettifyTime({ log, translateFormat: 'd mmm yyyy H:MM' })
    t.is(str, '[7 Apr 2019 13:15]')

    log = { timestamp: 1554642900000 }
    str = prettifyTime({ log, translateFormat: 'd mmm yyyy H:MM' })
    t.is(str, '[7 Apr 2019 13:15]')

    log = { time: '2019-04-07T09:15:00.000-04:00' }
    str = prettifyTime({ log, translateFormat: 'd mmm yyyy H:MM' })
    t.is(str, '[7 Apr 2019 13:15]')

    log = { timestamp: '2019-04-07T09:15:00.000-04:00' }
    str = prettifyTime({ log, translateFormat: 'd mmm yyyy H:MM' })
    t.is(str, '[7 Apr 2019 13:15]')
  })

  t.test('passes through value', async t => {
    let log = { time: 1554642900000 }
    let str = prettifyTime({ log })
    t.is(str, '[1554642900000]')

    log = { timestamp: 1554642900000 }
    str = prettifyTime({ log })
    t.is(str, '[1554642900000]')

    log = { time: '2019-04-07T09:15:00.000-04:00' }
    str = prettifyTime({ log })
    t.is(str, '[2019-04-07T09:15:00.000-04:00]')

    log = { timestamp: '2019-04-07T09:15:00.000-04:00' }
    str = prettifyTime({ log })
    t.is(str, '[2019-04-07T09:15:00.000-04:00]')
  })

  t.end()
})
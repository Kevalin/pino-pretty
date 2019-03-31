'use strict'

const chalk = require('chalk')
const jmespath = require('jmespath')
const colors = require('./lib/colors')
const { ERROR_LIKE_KEYS, MESSAGE_KEY } = require('./lib/constants')
const {
  prettifyLevel,
  prettifyMessage,
  prettifyMetadata,
  prettifyObject,
  prettifyTime,
  internals
} = require('./lib/utils')
const { joinLinesWithIndentation } = internals

const bourne = require('bourne')
const jsonParser = input => {
  try {
    return { value: bourne.parse(input, { protoAction: 'remove' }) }
  } catch (err) {
    return { err }
  }
}

const defaultOptions = {
  colorize: chalk.supportsColor,
  crlf: false,
  errorLikeObjectKeys: ERROR_LIKE_KEYS,
  errorProps: '',
  levelFirst: false,
  messageKey: MESSAGE_KEY,
  translateTime: false,
  useMetadata: false,
  outputStream: process.stdout
}

function isObject (input) {
  return Object.prototype.toString.apply(input) === '[object Object]'
}

module.exports = function prettyFactory (options) {
  const opts = Object.assign({}, defaultOptions, options)
  const EOL = opts.crlf ? '\r\n' : '\n'
  const IDENT = '    '
  const messageKey = opts.messageKey
  const errorLikeObjectKeys = opts.errorLikeObjectKeys
  const errorProps = opts.errorProps.split(',')
  const ignoreKeys = opts.ignore ? new Set(opts.ignore.split(',')) : undefined

  const colorizer = colors(opts.colorize)
  const search = opts.search

  return pretty

  function pretty (inputData) {
    let log
    if (!isObject(inputData)) {
      const parsed = jsonParser(inputData)
      log = parsed.value
      if (parsed.err) {
        // pass through
        return inputData + EOL
      }
    } else {
      log = inputData
    }

    // Short-circuit for spec allowed primitive values.
    if ([null, true, false].includes(log)) {
      return `${log}\n`
    }

    if (search && !jmespath.search(log, search)) {
      return
    }

    if (ignoreKeys) {
      log = Object.keys(log)
        .filter(key => !ignoreKeys.has(key))
        .reduce((res, key) => {
          res[key] = log[key]
          return res
        }, {})
    }

    const standardKeys = [
      'pid',
      'hostname',
      'name',
      'level',
      'time',
      'v'
    ]

    const prettifiedLevel = prettifyLevel({ log, colorizer })
    const prettifiedMessage = prettifyMessage({ log, messageKey, colorizer })
    const prettifiedMetadata = prettifyMetadata({ log })
    const prettifiedTime = prettifyTime({ log, translateFormat: opts.translateTime })

    let line = ''
    if (opts.levelFirst && prettifiedLevel) {
      line = `${prettifiedLevel}`
    }

    if (prettifiedTime && line === '') {
      line = `${prettifiedTime}`
    } else if (prettifiedTime) {
      line = `${line} ${prettifiedTime}`
    }

    if (!opts.levelFirst && prettifiedLevel) {
      if (line.length > 0) {
        line = `${line} ${prettifiedLevel}`
      } else {
        line = prettifiedLevel
      }
    }

    if (prettifiedMetadata) {
      line = `${line} ${prettifiedMetadata}:`
    }

    if (line.endsWith(':') === false && line !== '') {
      line += ':'
    }

    if (prettifiedMessage) {
      line = `${line} ${prettifiedMessage}`
    }

    if (line.length > 0) {
      line += EOL
    }

    /// !!!!!!!!!!

    if (log.type === 'Error' && log.stack) {
      const stack = log.stack
      line += IDENT + joinLinesWithIndentation({ input: stack }) + EOL

      let propsForPrint
      if (errorProps && errorProps.length > 0) {
        // don't need print these props for 'Error' object
        const excludedProps = standardKeys.concat([messageKey, 'type', 'stack'])

        if (errorProps[0] === '*') {
          // print all log props excluding 'excludedProps'
          propsForPrint = Object.keys(log).filter((prop) => excludedProps.indexOf(prop) < 0)
        } else {
          // print props from 'errorProps' only
          // but exclude 'excludedProps'
          propsForPrint = errorProps.filter((prop) => excludedProps.indexOf(prop) < 0)
        }

        for (var i = 0; i < propsForPrint.length; i++) {
          const key = propsForPrint[i]
          if (!log.hasOwnProperty(key)) continue
          if (log[key] instanceof Object) {
            // call 'filterObjects' with 'excludeStandardKeys' = false
            // because nested property might contain property from 'standardKeys'
            const prettifiedObject = prettifyObject({ input: log[key], errorLikeKeys: errorLikeObjectKeys, excludeLoggerKeys: false, eol: EOL, ident: IDENT })
            line += `${key}: {${EOL}${prettifiedObject}}${EOL}`
            continue
          }
          line += key + ': ' + log[key] + EOL
        }
      }
    } else {
      const skipKeys = typeof log[messageKey] === 'string' ? [messageKey] : undefined
      const prettifiedObject = prettifyObject({ input: log, skipKeys, errorLikeKeys: errorLikeObjectKeys, eol: EOL, ident: IDENT })
      line += prettifiedObject
    }

    return line
  }
}

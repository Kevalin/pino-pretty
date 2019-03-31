'use strict'

const dateformat = require('dateformat')
const stringifySafe = require('fast-safe-stringify')
const defaultColorizer = require('./colors')()
const {
  DATE_FORMAT,
  ERROR_LIKE_KEYS,
  MESSAGE_KEY,
  LEVELS,
  LOGGER_KEYS
} = require('./constants')

module.exports = {
  prettifyLevel,
  prettifyMessage,
  prettifyMetadata,
  prettifyObject,
  prettifyTime
}

module.exports.internals = {
  formatTime,
  joinLinesWithIndentation
}

function formatTime (epoch, translateTime) {
  const instant = new Date(epoch)
  if (translateTime === true) {
    return dateformat(instant, 'UTC:' + DATE_FORMAT)
  } else {
    const upperFormat = translateTime.toUpperCase()
    return (!upperFormat.startsWith('SYS:'))
      ? dateformat(instant, 'UTC:' + translateTime)
      : (upperFormat === 'SYS:STANDARD')
        ? dateformat(instant, DATE_FORMAT)
        : dateformat(instant, translateTime.slice(4))
  }
}

function joinLinesWithIndentation ({ input, ident = '    ', eol = '\n' }) {
  const lines = input.split(/\r?\n/)
  for (var i = 1; i < lines.length; i += 1) {
    lines[i] = ident + lines[i]
  }
  return lines.join(eol)
}

function prettifyLevel ({ log, colorizer = defaultColorizer }) {
  if ('level' in log === false) return undefined
  return LEVELS.hasOwnProperty(log.level) ? colorizer[log.level](LEVELS[log.level]) : colorizer.default(LEVELS.default)
}

function prettifyMessage ({ log, messageKey = MESSAGE_KEY, colorizer = defaultColorizer }) {
  if (messageKey in log === false) return undefined
  if (typeof log[messageKey] !== 'string') return undefined
  return colorizer.message(log[messageKey])
}

function prettifyMetadata ({ log }) {
  if (log.name || log.pid || log.hostname) {
    let line = '('

    if (log.name) {
      line += log.name
    }

    if (log.name && log.pid) {
      line += '/' + log.pid
    } else if (log.pid) {
      line += log.pid
    }

    if (log.hostname) {
      // If `pid` and `name` were in the ignore keys list then we don't need
      // the leading space.
      line += `${line === '(' ? 'on' : ' on'} ${log.hostname}`
    }

    line += ')'
    return line
  }
  return undefined
}

function prettifyObject ({ input, ident = '    ', eol = '\n', skipKeys = [], errorLikeKeys = ERROR_LIKE_KEYS, excludeLoggerKeys = true }) {
  const objectKeys = Object.keys(input)
  const keysToIgnore = [].concat(skipKeys)

  if (excludeLoggerKeys === true) Array.prototype.push.apply(keysToIgnore, LOGGER_KEYS)

  let result = ''

  const keysToIterate = objectKeys.filter(k => keysToIgnore.includes(k) === false)
  for (var i = 0; i < objectKeys.length; i += 1) {
    const keyName = keysToIterate[i]
    const keyValue = input[keyName]

    if (keyValue === undefined) continue

    const lines = stringifySafe(input[keyName], null, 2)
    if (lines === undefined) continue
    const joinedLines = joinLinesWithIndentation({ input: lines, ident, eol })

    if (errorLikeKeys.includes(keyName) === true) {
      const splitLines = `${ident}${keyName}: ${joinedLines}${eol}`.split(eol)
      for (var j = 0; j < splitLines.length; j += 1) {
        if (j !== 0) result += eol

        const line = splitLines[j]
        if (/^\s*"stack"/.test(line)) {
          const matches = /^(\s*"stack":)\s*(".*"),?$/.exec(line)
          if (matches && matches.length === 3) {
            const indentSize = /^\s*/.exec(line)[0].length + 4
            const indentation = ' '.repeat(indentSize)
            const stackMessage = matches[2]
            result += matches[1] + eol + indentation + JSON.parse(stackMessage).replace(/\n/g, eol + indentation)
          }
        } else {
          result += line
        }
      }
    } else if (keysToIgnore.includes(keyName) === false) {
      result += `${ident}${keyName}: ${joinedLines}${eol}`
    }
  }

  return result
}

function prettifyTime ({ log, translateFormat = undefined }) {
  if ('time' in log === false) return undefined
  if (translateFormat) {
    return '[' + formatTime(log.time, translateFormat) + ']'
  }
  return `[${log.time}]`
}

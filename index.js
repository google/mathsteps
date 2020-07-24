const ChangeTypes = require('./lib/ChangeTypes')
const Node = require('./lib/node')
const stepThrough = require('./lib/simplifyExpression/stepThrough')
const solveEquation = require('./lib/solveEquation')
const normalizeExpression = require('./lib/util/normalizeExpression')
const print = require('./lib/util/print').ascii
const printLatex = require('./lib/util/print').latex
const math = require('mathjs')
const removeUnnecessaryParens = require('./lib/util/removeUnnecessaryParens.js')

const CACHE_ENABLED             = true
const CACHE_LOG_MISSING_ENABLED = false
const CACHE_LOG_REUSED_ENABLED  = false

const CACHE_COMPARE      = {}
const CACHE_TEXT_TO_TEX  = {}
const CACHE_TEXT_TO_NODE = {}

function _compareByTextInternal(x, y) {
  try {
    return math.compare(x, y)
  } catch(err) {
    return NaN
  }
}

function _removeObviousParentheses(node) {
  // Process child nodes recursively.
  if ((node.fn || node.object) && node.value) {
    // x = ...
    // Go into right node (rval).
    _removeObviousParentheses(node.value)


  } else if (node.content) {
    // (x)
    // Go into parentheses.
    _removeObviousParentheses(node.content)

  } else if (node.args) {
    // Process child nodes recursively.
    node.args.forEach((childNode) => _removeObviousParentheses(childNode))

  } else {
    // Give up. Unsupported node type.
  }

  // Process current node.
  if ((node.op === '/') && (node.args.length === 2)) {
    // (x) / (y) -> x/y
    // Remove unneded parentheses from left node (numerator).
    if (node.args[0].content) {
      node.args[0] = node.args[0].content
    }

    // Remove unneded parentheses from right node (denominator).
    if (node.args[1].content) {
      node.args[1] = node.args[1].content
    }
  } else if ((node.op === '^') && (node.args.length === 2)) {
    // x ^ (y) -> x^y
    // Remove unneded parentheses from exponent.
    if (node.args[1].content) {
      node.args[1] = node.args[1].content
    }
  }

  return node
}

function _postProcessResultTeX(resultTeX) {
  // Don't use x := y definitions.
  // We want x = y everywhere.
  return resultTeX.replace(':=', '=')
}

function printAsTeX(node) {
  return _postProcessResultTeX(printLatex(node))
}

function compareByText(x, y) {
  let rv = NaN

  if (CACHE_ENABLED) {
    const cacheKey = x + '|' + y

    rv = CACHE_COMPARE[cacheKey]

    if (rv == null) {
      // Cache missing.
      if (CACHE_LOG_MISSING_ENABLED) {
        console.log('[ KMATHSTEPS ] Cache missing (compare)', x, y)
      }

      rv = _compareByTextInternal(x, y)

      CACHE_COMPARE[cacheKey] = rv
    } else {
      // Already cached - reuse previous result.
      if (CACHE_LOG_REUSED_ENABLED) {
        console.log('[ KMATHSTEPS ] Cache reused (compare)', x, y)
      }
    }
  } else {
    // Cache disabled - just wrap original call.
    rv = _compareByTextInternal(x, y)
  }

  return rv
}

function convertTextToTeX(text) {
  let rv = text

  if (text && (text.trim() !== '')) {
    if (CACHE_ENABLED) {
      rv = CACHE_TEXT_TO_TEX[text]

      if (rv == null) {
        // Cache missing.
        if (CACHE_LOG_MISSING_ENABLED) {
          console.log('[ KMATHSTEPS ] Cache missing (text to TeX)', text)
        }

        rv = printAsTeX(parseText(text))

        CACHE_TEXT_TO_TEX[text] = rv
      } else {
        // Already cached - reuse previous result.
        if (CACHE_LOG_REUSED_ENABLED) {
          console.log('[ KMATHSTEPS ] Cache reused (text to TeX)', text)
        }
      }
    } else {
      // Cache disabled - just wrap original call.
      rv = printAsTeX(math.parse(text))
    }
  }

  return rv
}

function parseText(text) {
  let rv = null

  if (CACHE_ENABLED) {
    rv = CACHE_TEXT_TO_NODE[text]

    if (rv == null) {
      // Cache missing.
      if (CACHE_LOG_MISSING_ENABLED) {
        console.log('[ KMATHSTEPS ] Cache missing (text to node)', text)
      }

      rv = _removeObviousParentheses(math.parse(text))

      CACHE_TEXT_TO_NODE[text] = rv
    } else {
      // Already cached - reuse previous result.
      if (CACHE_LOG_REUSED_ENABLED) {
        console.log('[ KMATHSTEPS ] Cache reused (text to node)', text)
      }
    }
  } else {
    // Cache disabled - just wrap original call.
    rv = _removeObviousParentheses(math.parse(text))
  }

  return rv
}

function simplifyExpression(expressionAsText, debug = false, expressionCtx = null) {
  let rv = []

  try {
    const expressionNode = parseText(expressionAsText)
    rv = stepThrough(expressionNode, debug, expressionCtx)

    // Make sure there is always at last one result-step.
    if ((rv.length === 0) && expressionNode.args) {
      rv.push(Node.Status.nodeChanged(ChangeTypes.REARRANGE_COEFF, expressionNode, expressionNode))
    }
  } catch (err) {
    console.log(err)
  }

  return rv
}

function isOkAsSymbolicExpression(expressionAsText) {
  let rv = false

  if (expressionAsText && (expressionAsText.search(/\-\s*\-/) === -1)) {
    try {
      const expressionNode = parseText(expressionAsText + '*1')
      const steps = stepThrough(expressionNode)
      rv = (steps.length > 0)
    } catch (e) {
      // Hide exceptions.
    }
  }

  return rv
}

module.exports = {
  simplifyExpression,
  solveEquation,
  ChangeTypes,
  normalizeExpression,
  print,
  printAsTeX,
  compareByText,
  math,
  removeUnnecessaryParens,
  convertTextToTeX,
  parseText,
  isOkAsSymbolicExpression,
}

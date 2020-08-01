const clone = require('./clone')
const flatten = require('./flattenOperands')
const Node = require('../node')

// Prints an expression node in asciimath
// If showPlusMinus is true, print + - (e.g. 2 + -3)
// If it's false (the default) 2 + -3 would print as 2 - 3
// (The + - is needed to support the conversion of subtraction to addition of
// negative terms. See flattenOperands for more details if you're curious.)
function printAscii(node, showPlusMinus = false) {
  node = flatten(clone(node))

  let string = printTreeTraversal(node)
  if (!showPlusMinus) {
    string = string.replace(/\s*?\+\s*?\-\s*?/g, ' - ')
  }

  return string
}

function printTreeTraversal(node, parentNode) {
  if (Node.PolynomialTerm.isPolynomialTerm(node)) {
    const polyTerm = new Node.PolynomialTerm(node)
    // This is so we don't print 2/3 x^2 as 2 / 3x^2
    // Still print x/2 as x/2 and not 1/2 x though
    if (polyTerm.hasFractionCoeff() && node.op !== '/') {
      const coeffTerm = polyTerm.getCoeffNode()
      const coeffStr = printTreeTraversal(coeffTerm)

      const nonCoeffTerm = Node.Creator.polynomialTerm(
        polyTerm.getSymbolNode(), polyTerm.exponent, null)
      const nonCoeffStr = printTreeTraversal(nonCoeffTerm)

      return `${coeffStr} ${nonCoeffStr}`
    }
  }

  if (Node.Type.isIntegerFraction(node)) {
    return `${printTreeTraversal(node.args[0])}/${printTreeTraversal(node.args[1])}`
  }

  if (Node.Type.isOperator(node)) {
    if (node.op === '/' && Node.Type.isOperator(node.args[1])) {
      return `${printTreeTraversal(node.args[0])} / (${printTreeTraversal(node.args[1])})`
    }

    let opString = ''

    switch (node.op) {
      case '+':
      case '-':
        // add space between operator and operands
        opString = ` ${node.op} `
        break

      case '*':
        if (node.implicit) {
          break
        }
        opString = ` ${node.op} `
        break

      case '/':
        // no space for constant fraction divisions (slightly easier to read)
        if (Node.Type.isConstantFraction(node, true)) {
          opString = `${node.op}`
        } else {
          opString = ` ${node.op} `
        }
        break

      case '^': {
        const baseNode     = node.args[0]
        const exponentNode = node.args[1]

        let baseAsString     = printTreeTraversal(baseNode)
        let exponentAsString = printTreeTraversal(exponentNode)

        if (Node.Type.isOperator(baseNode)) {
          baseAsString = `(${baseAsString})`
        }

        if (Node.Type.isOperator(exponentNode)) {
          exponentAsString = `(${exponentAsString})`
        }

        return `${baseAsString}^${exponentAsString}`

        break
      }
    }

    let str = node.args.map(arg => printTreeTraversal(arg, node)).join(opString)

    // Need to add parens around any [+, -] operation
    // nested in [/, *, ^] operation
    // Check #120, #126 issues for more details.
    // { "/" [{ "+" ["x", "2"] }, "2"] } -> (x + 2) / 2.
    if (parentNode &&
        Node.Type.isOperator(parentNode) &&
        node.op && parentNode.op &&
        '*/^'.indexOf(parentNode.op) >= 0 &&
        '+-'.indexOf(node.op) >= 0) {

      str = `(${str})`
    }

    return str

  } else if (Node.Type.isParenthesis(node)) {
    return `(${printTreeTraversal(node.content)})`

  } else if (Node.Type.isUnaryMinus(node)) {
    if (Node.Type.isOperator(node.args[0]) &&
        '*/^'.indexOf(node.args[0].op) === -1 &&
        !Node.PolynomialTerm.isPolynomialTerm(node)) {
      return `-(${printTreeTraversal(node.args[0])})`

    } else if (Node.Type.kemuIsConstantNegative(node.args[0])) {
      // Avoid double minus: --x.
      return '-(' + node.args[0].value + ')'
    } else {
      return `-${printTreeTraversal(node.args[0])}`
    }

  } else if ((parentNode) &&
           (parentNode.op === '^') &&
           (parentNode.args[0] === node) &&
           (Node.Type.kemuIsConstantNegative(node))) {

    // Wrap negative constant base into parenthesis to avoid -3^2 result.
    return '(' + node.value + ')'

  } else if ((parentNode) &&
             (parentNode.op === '-') &&
             (parentNode.args[0] !== node) &&
             (Node.Type.kemuIsConstantNegative(node))) {

    // Wrap negative constant base into parenthesis to avoid -3^2 result.
    return '(' + node.value + ')'

  } else if (Node.Type.isFunction(node) && node.fn.nameForPresentation) {
    // Function has user specific name prefered for presentation.
    // Use this name instead of internal one.
    // Example: ctg (internal use) vs cot (name given by user).
    let rv  = node.fn.nameForPresentation + '('
    let sep = ''

    // <nameForPresentation>(arg1, arg2, arg3, ...)
    node.args.forEach((oneArg) => {
      rv += sep + printTreeTraversal(node.args, parentNode)
      sep = ', '
    })

    rv += ')'

    return rv

  } else {
    return node.toString({notation: 'fixed'})
  }
}

function kemuAddParenthesisBeforePrintLatex(node) {
  if (node.content) {
    node = node.content
  }

  // Possible improvement: optimize it.
  if (node.args) {
    if (Node.Type.isUnaryMinus(node) &&
        Node.Type.kemuIsConstantNegative(node.args[0])) {

      node.kemuIsReadyForPrintLatex = true

      // Avoid double minus: --x.
      node._toTex = () => {
        return '-\\left(' + node.args[0].value + '\\right)'
      }

    } else {
      node.args.forEach((oneArg, argIdx) => {
        // We skip add operation (+), because it's already handled by
        // showPlusMinus fix in original mathsteps.
        const isRightArg        = (argIdx > 0)
        const isPowBase         = (node.op === '^') && (argIdx === 0)
        const isAddOp           = (node.op === '+')
        const shouldBeProcessed = !isAddOp && (isRightArg || isPowBase)

        if (shouldBeProcessed && Node.Type.kemuIsConstantNegative(oneArg)) {
          // Wrap negative cosntant arguments into parenthesis.
          oneArg._toTex = () => {
            return '\\left(' + oneArg.value + '\\right)'
          }

        } else if (!oneArg.kemuIsReadyForPrintLatex) {
          // Avoid processing the same node twice.
          oneArg.kemuIsReadyForPrintLatex = true

          // Process child nodes recursively.
          kemuAddParenthesisBeforePrintLatex(oneArg)
        }
      })
    }
  }
}

function _printLatexInternal(node) {
  let rv = null

  if (Node.Type.kemuIsConstantInteger(node)) {
    // Avoid sciencific notation for single integer.
    rv = printTreeTraversal(node)

  } else if (Node.Type.isOperator(node) && (node.args.length == 2)) {
    const x = _printLatexInternal(node.args[0])
    const y = _printLatexInternal(node.args[1])

    switch (node.op) {
      case '+':
      case '-': {
        rv = `${x}${node.op}${y}`
        break
      }

      case '^': {
        rv = `{${x}}^{${y}}`
        break
      }

      case '*': {
        if (node.implicit) {
          rv = `${x}~${y}`
        } else {
          rv = `${x}\\cdot${y}`
        }
        break
      }

      case '/': {
        rv = `\\frac{${x}}{${y}}`
        break
      }
    }
  }

  if (rv == null) {
    // Fallback to default mathjs render.
    return node.toTex({
      parenthesis: 'keep'
    })
  }

  return rv
}

// Prints an expression node in LaTeX
// (The + - is needed to support the conversion of subtraction to addition of
// negative terms. See flattenOperands for more details if you're curious.)
function printLatex(node, showPlusMinus = false) {
  kemuAddParenthesisBeforePrintLatex(node)

  let nodeTex = node.toTex({
    handler: _printLatexInternal,
    parenthesis: 'keep'
  })

  if (!showPlusMinus) {
    // Replaces '+ -' with '-'
    nodeTex = nodeTex.replace(/\s*?\+\s*?\-\s*?/g, ' - ')
  }

  return nodeTex
}

module.exports = {
  ascii: printAscii,
  latex: printLatex,
}

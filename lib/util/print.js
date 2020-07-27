const {print, toTex} = require('math-parser')

// Prints an expression node in asciimath
// If showPlusMinus is true, print + - (e.g. 2 + -3)
// If it's false (the default) 2 + -3 would print as 2 - 3

function printAscii(node, showPlusMinus = false) {
  // TODO(math-parser or porting): add smarter printing based off of what
  // we had here (can't keep it without adding paren logic)
  let string = print(node)
  // TODO(math-parser) should this be an option passed into the math-parser print?
  if (!showPlusMinus) {
    string = string.replace(/\s*?\+\s*?\-\s*?/g, ' - ')
  }
  return string
}

// Prints an expression node in LaTeX
function printLatex(node) {
  // TODO(math-parser): export toTex
  const nodeTex = toTex(node)

  // TODO(math-parser): adding an option for if we want + - ?
  // because that would have to be done within printing, pretty sure - can't
  // do after the fact here

  return nodeTex
}

module.exports = {
  ascii: printAscii,
  latex: printLatex,
}

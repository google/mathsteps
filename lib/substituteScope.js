function substituteScope(scope) {
  // create a copy of the provided scope
  const newScope = Object.assign({}, scope);

  // iterate over symbols
  for (var symbol in newScope) {
    // store the symbol's current value in a variable
    const targetVal = newScope[symbol].toString();
    // iterate through scope (again)
    for (var sym in newScope) {
      // extract the value of a symbol as a string
      const valStr = newScope[sym].toString();
      // within the stored value, replace symbol (from the outer loop)
      // with its respective value
      const replaced = valStr.replace(symbol, targetVal);
      // store the substituted value in the new scope under the same symbol
      newScope[sym] = replaced;
    }
  }

  return newScope;
}

module.exports = substituteScope;

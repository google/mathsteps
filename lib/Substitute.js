function substituteScope(scope) {
  const newScope = Object.assign({}, scope);

  for (var symbol in newScope) {
    const targetVal = newScope[symbol].toString();
    for (var sym in newScope) {
      const valStr = newScope[sym].toString();
      const replaced = valStr.replace(symbol, targetVal);
      newScope[sym] = replaced;
    }
  }

  return newScope;
}

module.exports = substituteScope;
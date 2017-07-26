const math = require('mathjs');

const scope = {
  baz: '(bar^2)',
  x: 10,
  bar: '(foo + x)',
  foo: 20,
};

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

// eslint-disable-next-line
console.log(substituteScope(scope));

const newScope = substituteScope(scope);
for (var symbol in newScope) {
  // eslint-disable-next-line
  console.log(math.eval(newScope[symbol]));
}
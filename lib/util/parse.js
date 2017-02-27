const {parse, replace} = require("../../parser/docs/bundle");

const opFns = {
  neg: 'unaryMinus',
  add: 'add',
  mul: 'multiply',
  div: 'divide',
  pow: 'pow',
}

const ops = {
  neg: '-',
  add: '+',
  mul: '*',
  div: '/',
  pow: '^',
};

function transform(ast) {
  return replace(ast, {
    enter: () => { },
    leave: (node) => {
      switch (node.type) {
        case 'Function':
          return {
            type: 'FunctionNode',
            fn: {
              type: 'SymbolNode',
              name: node.fn,
            },
            args: node.args,
          };
        case 'Identifier':
          return {
            type: 'SymbolNode',
            name: node.name,
          };
        case 'Number':
          return {
            type: 'ConstantNode',
            value: node.value,
            valueType: 'number',
          };
        case 'Operation':
          return {
            type: 'OperatorNode',
            op: ops[node.op],
            fn: opFns[node.op],
            implicit: !!node.implicit,
            args: node.args,
          };
        case 'Brackets':
          return {
            type: 'ParenthesisNode',
            content: node.content,
          };
        default:
          throw new Error(`'${node.type}' node cannot be transformed`);
      }
    }
  });
}

module.exports = (str) => {
  const ast = transform(parse(str));
  // console.log(JSON.stringify(ast, null, 2));
  return ast;
};

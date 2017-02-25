const {parse, transformMathJS} = require("../../parser/docs/bundle");

module.exports = (str) => transformMathJS(parse(str));

function clone (node) {
  return JSON.parse(JSON.stringify(node));
}

module.exports = clone;

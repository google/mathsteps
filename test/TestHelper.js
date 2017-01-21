// Remove some property used in mathjs that we don't need and prevents node
// equality checks from passing
const TestHelper = {};
TestHelper.removeComments = function (node) {
  node.filter(node => node.comment !== undefined).forEach(
    node => delete node.comment);
}

module.exports = TestHelper;


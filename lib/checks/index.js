const canAddLikeTermPolynomialNodes = require('./canAddLikeTermPolynomialNodes');
const canMultiplyLikeTermPolynomialNodes = require('./canMultiplyLikeTermPolynomialNodes');
const canRearrangeCoefficient = require('./canRearrangeCoefficient');
const canSimplifyPolynomialTerms = require('./canSimplifyPolynomialTerms');
const hasUnsupportedNodes = require('./hasUnsupportedNodes');
const resolvesToConstant = require('./resolvesToConstant');

module.exports = {
  canAddLikeTermPolynomialNodes: canAddLikeTermPolynomialNodes,
  canMultiplyLikeTermPolynomialNodes: canMultiplyLikeTermPolynomialNodes,
  canRearrangeCoefficient: canRearrangeCoefficient,
  canSimplifyPolynomialTerms: canSimplifyPolynomialTerms,
  hasUnsupportedNodes: hasUnsupportedNodes,
  resolvesToConstant: resolvesToConstant
};

const canAddLikeTermPolynomialNodes = require('./canAddLikeTermPolynomialNodes');
const canMultiplyLikeTermPolynomialNodes = require('./canMultiplyLikeTermPolynomialNodes');
const canRearrangeCoefficient = require('./canRearrangeCoefficient');
const canSimplifyPolynomialTerms = require('./canSimplifyPolynomialTerms');
const hasUnsupportedNodes = require('./hasUnsupportedNodes');
const isQuadratic = require('./isQuadratic');
const resolvesToConstant = require('./resolvesToConstant');
const canMultiplyLikeTermConstantNodes = require('./canMultiplyLikeTermConstantNodes');

module.exports = {
  canAddLikeTermPolynomialNodes,
  canMultiplyLikeTermPolynomialNodes,
  canMultiplyLikeTermConstantNodes,
  canRearrangeCoefficient,
  canSimplifyPolynomialTerms,
  hasUnsupportedNodes,
  isQuadratic,
  resolvesToConstant,
};

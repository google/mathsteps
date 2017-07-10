const canAddLikeTermPolynomialNodes = require('./canAddLikeTermPolynomialNodes');
const canMultiplyLikeTermConstantNodes = require('./canMultiplyLikeTermConstantNodes');
const canMultiplyLikeTermPolynomialNodes = require('./canMultiplyLikeTermPolynomialNodes');
const canRearrangeCoefficient = require('./canRearrangeCoefficient');
const canSimplifyPolynomialTerms = require('./canSimplifyPolynomialTerms');
const hasUnsupportedNodes = require('./hasUnsupportedNodes');
const isPolynomialToConstantPower = require('./isPolynomialToConstantPower');
const isQuadratic = require('./isQuadratic');
const resolvesToConstant = require('./resolvesToConstant');

module.exports = {
  canAddLikeTermPolynomialNodes,
  canMultiplyLikeTermConstantNodes,
  canMultiplyLikeTermPolynomialNodes,
  canRearrangeCoefficient,
  canSimplifyPolynomialTerms,
  hasUnsupportedNodes,
  isQuadratic,
  resolvesToConstant,
  isPolynomialToConstantPower,
};

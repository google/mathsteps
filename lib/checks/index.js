const canAddLikeTermPolynomialNodes = require('./canAddLikeTermPolynomialNodes');
const canDivideLikeTermConstantNodes = require('./canDivideLikeTermConstantNodes');
const canDivideLikeTermPolynomialNodes = require('./canDivideLikeTermPolynomialNodes');
const canMultiplyLikeTermConstantNodes = require('./canMultiplyLikeTermConstantNodes');
const canMultiplyLikeTermPolynomialNodes = require('./canMultiplyLikeTermPolynomialNodes');
const canRearrangeCoefficient = require('./canRearrangeCoefficient');
const canSimplifyPolynomialTerms = require('./canSimplifyPolynomialTerms');
const hasUnsupportedNodes = require('./hasUnsupportedNodes');
const isQuadratic = require('./isQuadratic');
const resolvesToConstant = require('./resolvesToConstant');


module.exports = {
  canAddLikeTermPolynomialNodes,
  canDivideLikeTermConstantNodes,
  canDivideLikeTermPolynomialNodes,
  canMultiplyLikeTermConstantNodes,
  canMultiplyLikeTermPolynomialNodes,
  canRearrangeCoefficient,
  canSimplifyPolynomialTerms,
  hasUnsupportedNodes,
  isQuadratic,
  resolvesToConstant,
};

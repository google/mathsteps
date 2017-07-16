const canAddLikeTerms = require('./canAddLikeTerms');
const canFindRoots = require('./canFindRoots');
const canMultiplyLikeTermConstantNodes = require('./canMultiplyLikeTermConstantNodes');
const canMultiplyLikeTermPolynomialNodes = require('./canMultiplyLikeTermPolynomialNodes');
const canMultiplyLikeTermsNthRoots = require('./canMultiplyLikeTermsNthRoots');
const canRearrangeCoefficient = require('./canRearrangeCoefficient');
const canSimplifyPolynomialTerms = require('./canSimplifyPolynomialTerms');
const hasUnsupportedNodes = require('./hasUnsupportedNodes');
const isQuadratic = require('./isQuadratic');
const resolvesToConstant = require('./resolvesToConstant');

module.exports = {
  canFindRoots,
  canAddLikeTerms,
  canMultiplyLikeTermConstantNodes,
  canMultiplyLikeTermPolynomialNodes,
  canMultiplyLikeTermsNthRoots,
  canRearrangeCoefficient,
  canSimplifyPolynomialTerms,
  hasUnsupportedNodes,
  isQuadratic,
  resolvesToConstant,
};

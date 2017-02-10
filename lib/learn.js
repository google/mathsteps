const Node = require('./node/Type');
const Creator = require('./node/Creator');
const Status = require('./node/Status');
const Polynomial = require('./node/PolynomialTerm');
const canAddLikeTermPolynomialNodes = require('./checks/canAddLikeTermPolynomialNodes');
const canMultiply = require('./checks/canMultiplyLikeTermPolynomialNodes');
const canRearrange = require('./checks/canRearrangeCoefficient');
const canSimplify = require('./checks/canSimplifyPolynomialTerms');
const hasUnsupportedNodes = require('./checks/hasUnsupportedNodes');
const resolvesConstant = require('./checks/resolvesToConstant');
const Factors = require('./factor/ConstantFactors');
const math = require('mathjs');

// -------------------------------- Node -------------------------------


                              // ------- Node Creator ---------------

// Manually creating a node in the expression tree for parsing the expression.

// Creates a operator node for type(+, *, -, /, ^) which takes an array of args
// console.log(Creator.operator('+', [math.parse(1), math.parse('x')]));


                            // ------- Status Object ------------------

// Creates a status object with changeType -> NO_CHANGE to reprsent the current expression being simplified
// let obj = new Status('ABSOLUTE_VALUE', math.parse('-3'), math.parse('3'));
//
// console.log(obj);

// console.log(obj.hasChanged());

// Returns the changesGroup 1 while simplifying the expression.
// console.log(Status.nodeChanged('ADD_POLYNOMIAL_TERMS', math.parse('x + x'), math.parse('2x')));


                           // ------- Node Type ------------------

// Check node type. Returns a boolean (Type.js)
// console.log(Node.isIntegerFraction(math.parse('')));


                          // ------- Storing polynomial term -----

// Creates a polynomial term and returns the symbolName, exponent, coefficient
// console.log(new Polynomial(math.parse('2*x^2')));

// Class Polynomial also has helper methods to get the symobol, exponent and coefficient
// from the polynomial term. (getSymbolNode(), getCoeffNode(), getExponentNode())

// Returns a boolean if the node is a polynomial term or not.
// console.log(Polynomial.isPolynomialTerm(math.parse('x')));


// ----------------------------------- Checks ------------------------------------------

// Returns a boolean value if the input is polynomial term that can be added.
// console.log(canAddLikeTermPolynomialNodes(math.parse('x + 2x')));

// Returns a boolean value if the input is polynomial term that can be multiplied
// console.log(canMultiply(math.parse('x * y^2')));

// Returns a boolean value if the input is polynomial term that can be rearranged.
// console.log(canRearrange(math.parse('x^2 * 2')));

// Returns a boolean value if the input is polynomial term that can be simplified.
// console.log(canSimplify(math.parse('x+x')));
// console.log(canSimplify(math.parse('x*x')));

// Returns a boolean value if the input is polynomial term that has unsupported nodes
// console.log(hasUnsupportedNodes(math.parse('x')));

// Returns a boolean value if the input is constant term that can be resolved
// console.log(resolvesConstant(math.parse('-(2) * -3')));


// ----------------------------------- Get Factors --------------------------------------
console.log(Factors.getPrimeFactors('20'));
// console.log(Factors.getFactorPairs('10'));

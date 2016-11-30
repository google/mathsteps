// The text to identify rules for each possible step that can be taken

module.exports = {
  NO_CHANGE: 'No change',

  REMOVE_PARENS: 'Remove unnecessary brackets',
  COLLECT_LIKE_TERMS: 'Collect like terms',
  COLLECT_AND_COMBINE_LIKE_TERMS: 'Collect and combine like terms',

  UNARY_MINUS_TO_NEG_ONE: 'A minus is just like a coefficient of -1',
  ADD_COEFFICIENT_OF_ONE: 'No coefficient is the same a coefficient equal to 1',
  ADD_EXPONENT_OF_ONE: 'No exponent is the same as a coefficient of 1',
  GROUP_COEFFICIENTS: 'Group coefficients together',
  COLLECT_EXPONENTS: 'Sum up the exponents',
  MULTIPLY_COEFFICIENTS: 'Multiply coefficients together',
  ADD_POLYNOMIAL_TERMS: 'Add terms together',
  MULT_POLYNOMIAL_TERMS: 'Multiply terms together',
  MULT_POLY_BY_CONST: 'Multiply term by a number',

  SIMPLIFY_ARITHMETIC: 'Evaluate',
  REMOVE_ADDITION_OF_ZERO: 'Remove addition of zero',
  ABSOLUTE_VALUE: 'Take the absolute value',
  SIMPLIFY_DIVISION: 'Simplify chain of division',
  RESOLVE_ADD_UNARY_MINUS: 'Simplify + - to -',
  RESOLVE_DOUBLE_MINUS: '- - cancels out',
  DIVISION_BY_NEG_ONE: 'Divide by -1 to make it negative',
  DIVISION_BY_ONE: 'Divide by 1 by getting rid of the 1',

  DISTRIBUTE_NEG_ONE: 'Distribute negative sign into the parentheses',
  DISTRIBUTE: 'Distribute',

  COMMON_DENOMINATOR: 'Make all the denominators the same as the LCD',
  SIMPLIFY_FRACTION: 'Simplify by dividing the top and bottom by the GCD',
  SIMPLIFY_SIGNS: 'Move the - to the numerator',
  COMBINE_NUMERATORS: 'Write numerators above the common denominator',
  ADD_FRACTIONS: 'Add fractions together',
  MULTIPLY_FRACTIONS: 'Multiply fractions together',
  CONVERT_INTEGER_TO_FRACTION: 'Change the number to a fraction with the same denominator',
  MULTIPLY_BY_INVERSE: 'Multiply by the inverse of the denominator',
  BREAK_UP_FRACTION: 'Break up the numerator to make multiple fractions',

  CANCEL_TERMS: 'Cancel like terms in numerator and denominator',

  SWAP_SIDES: 'Swap sides',
  ADD_TO_BOTH_SIDES: 'Add term to both sides',
  SUBTRACT_FROM_BOTH_SIDES: 'Subtract term from both sides',
  MULTIPLY_TO_BOTH_SIDES: 'Multiply term to both sides',
  DIVIDE_FROM_BOTH_SIDES: 'Divide term from both sides',
  MULTIPLY_BOTH_SIDES_BY_INVERSE_FRACTION: 'Multiply both sides by inverse of the fraction',
  MULTIPLY_BOTH_SIDES_BY_NEGATIVE_ONE: 'Multiply both sides by -1',

  STATEMENT_IS_TRUE: 'The statement is True',
  STATEMENT_IS_FALSE: 'The statement is False',
};

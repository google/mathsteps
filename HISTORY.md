# History

## 2020-07-23, version k1.0.0
The first version published by [Calculla](https://calculla.com) team.
This is the fork derived from **mathsteps 0.1.7** originaly created by **Evy Kassirer**.

  ### Introduction from Calculla team
  We've started using mathsteps experimentally in Calculla's code in 2017. After a while we've started adding small extensions as well as additional tests and automation. Our fork diverged more and more from original mathsteps code as we had our own ideas for improvements and we've made technical decisions which may not be in line with original authors way of thinking (e.g. we've introduced *bignumber* for constants accuracy). Also, the original project looks a bit abandoned.

  With all this in mind, we've decided that instead of putting effort to merge back to original repo, we're gonna publish our changes as fork. If that works and current state persists, we're gonna move to separate repository (non-forked one) to avoid confusions. Also we added "k" to the version numbering to clearly state that is not exactly original versioning of mathsteps.

  TLDR:
  - this is diverged version of mathsteps, called kmathsteps
  - version is now k1.0.0
  - we will release it as separate npm package (soon)

  #### Special thanks
  Special thanks to:
  - the team that actually built original mathsteps - we really like and appreciate your work
  - Sylwester Wysocki (dzik-at-ke.mu) for his hard work pushing this forward

  ### General improvements
  - Show parentheses removal as separate step,
  - Initial support for user delivered **context** (symbolic vs numerical),
  - All constants are stored as **bignumber rational** in **symbolic mode** e.g. *986/100* instead of *9.86*,
  - Values are presented as **bingumber decimals** in **numerical mode** e.g. *1.23* instead of *123/100*,
  - Initial support for **domains** e.g. *sqrt(a)* gives *a* if **a is positive** and *|a|* in general case.

  ### New simplify steps:

  *NOTE: we are going to clean up all "kemu" references from this code in next few chunks of changes. This was added initially to clearly distinguish the orignal code from our extensions, but is no longer needed.*

  - KEMU_REDUCE - better *(a b c ...)/(d e f ...)* cancelation,
  - KEMU_MULTIPLY_SQRTS - *sqrt(a) sqrt(b)* gives *sqrt(a b)*,
  - KEMU_MULTIPLY_SQRTS_WITH_COMMON_ROOT - *sqrt(a) sqrt(a)* gives *a*,
  - KEMU_POWER_FACTORS - *(a b c ...)^x* gives *ax bx cx ...*,
  - KEMU_POWER_FRACTION - *(a/b)^x* gives *a^x / b^x*,
  - KEMU_POWER_SQRT - *sqrt(a)^b* gives *a^(b/2)*,
  - KEMU_SQRT_FROM_ZERO - *sqrt(0)* gives *0*,
  - KEMU_SQRT_FROM_ONE - *sqrt(1)* gives *1*,
  - KEMU_SQRT_FROM_POW - *sqrt(x^2)* gives *|x|* or *x* etc.,
  - KEMU_SQRT_FROM_CONST - *sqrt(8)* gives *2 sqrt(2)* etc.
  - KEMU_POWER_TO_MINUS_ONE - *(a/b)^-1* gives *b/a*,
  - KEMU_POWER_TO_NEGATIVE_EXPONENT - *x^-a* gives *1/(x^a)* etc.,
  - KEMU_MULTIPLY_EXPONENTS - *(a^x)^y* gives *a^(x y)*,
  - KEMU_REMOVE_UNNEDED_PARENTHESIS - show parenthesis remove as another step,
  - KEMU_REMOVE_FRACTION_WITH_UNIT_NUMERATOR - *(a 1)/x* gives *a/x*,
  - KEMU_REMOVE_DOUBLE_FRACTION - *x/y/z* gives *x/(y*z)*,
  - KEMU_NUMERICAL_SQRT - evaluate *sqrt(a)* as decimal (non-fraction) e.g. *sqrt(3)* gives *1.73205080756887729357...*,
  - KEMU_NUMERICAL_DIV - evaluate *a/b* as decimal (non-fraction) e.g. *1/3* gives *0.3333333333333333333...*,
  - KEMU_FACTOR_EXPRESSION_UNDER_ROOT - *sqrt(8)* gives *sqrt(4*2)* etc.,
  - KEMU_DECIMAL_TO_FRACTION - *3.14* gives *314/100* etc.,

  - KEMU_SHORT_MULTIPLICATION_AB2_ADD - *(a+b)^2* gives *a^2 + 2ab + b^2*,
  - KEMU_SHORT_MULTIPLICATION_AB3_ADD - *(a+b)^3* gives *a^3 + 3a^2b + 3ab^2 + b^3*,
  - KEMU_SHORT_MULTIPLICATION_ABN_ADD - general case for integer n: *(a+b)^n*,

  - KEMU_SHORT_MULTIPLICATION_AB2_SUB - *(a-b)^2* gives *a^2 - 2ab + b^2*,
  - KEMU_SHORT_MULTIPLICATION_AB3_SUB - *(a-b)^3* gives *a^3 − 3a^2b +3ab^2 − b^3*,
  - KEMU_SHORT_MULTIPLICATION_ABN_SUB - general case for integer n: *(a-b)^n*,

  - KEMU_FUNCTION_VALUE - evaluate of known function e.g. *sin(pi/2)* gives *1*,
  - KEMU_PYTHAGOREAN_IDENTITY - *sin(x)^2 + sin(x)^y* gives *1*,
  - KEMU_EVEN_FUNCTION_OF_NEGATIVE - *cos(-x)* gives *cos(x)* etc.,
  - KEMU_ODD_FUNCTION_OF_NEGATIVE - *sin(-x)* gives *-sin(x)* etc.,
  - KEMU_CONVERT_SIN_PER_COS_TO_TAN - *sin(x)/cos(x)* gives *tan(x)*,
  - KEMU_CONVERT_COS_PER_SIN_TO_COT - *cos(x)/sin(x)* gives *cot(x)*,
  - KEMU_CANCEL_INVERSE_FUNCTION - *atan(tan(x))* gives *x* etc..

  ### Internal maintenance
  - Adjusted to work with *mathjs 7.1.0*,
  - Improved code formatting,
  - All constants are stored as *bignumber*,
  - Ability to write rules using *mathjs* notation directly (see [example](https://github.com/kemu-studio/mathsteps/blob/sync-with-calculla/lib/simplifyExpression/kemuCommonSearch/commonFunctions.js)), this is prefered way to add new rules if possible,
  - Better args sorting for expression comparison,
  - Better *flip-flop* detection (*a -> b -> a -> b -> a -> ...*),
  - Results caching,

# Original history of math-steps up to 0.1.7
All history entries below have been copied from *original mathsteps 0.1.7* initiated by **Evy Kassirer**.
Please visit https://github.com/google/mathsteps for more.

## 2017-10-26, version 0.1.7

There's been a lot of great changes since the last release, here are the main updates

Functionality and Teaching Enhancements:

- new pedagogy for multiply powers integers #153
- exposing the factoring module and adding more coverage #148
- simplify roots of any degree #183
- more cases for cancelling terms #182
- greatest common denominator substep #188
- multiply nthRoots #189
- multiply fractions with parenthesis #185
- remove unnecessary parens before solving equations #205
- multiply denominators with terms #88
- Better sum-product factoring steps #210


Bug Fixes

- fix the check for perfect roots of a constant when there's roundoff error #224
- large negtive number rounding #216

Other:

- (code structure) generalizing polynomial terms #190
- latex printing for equations
- added linting rules #222


## 2017-04-03, version 0.1.6

updated mathjs to incorporate vulnerability patch #149

Functionality Enhancements:

- Added factoring support #104
- Fixed #138: Better handling of distribution with fractions. Thanks @lexiross !
- Fixed #126: Add parens in util > print where necessary. Thanks @Flyr1Q !

Bug fixes:

- Fixed #113: handle exponents on coefficients of polynomial terms. Thanks @shirleymiao !
- Fixed #111 (nthRoot() existence check). Thanks @shirleymiao !

Refactoring + Documentation + other dev enhancements:

- Fixed #107: Improve our linter. Thanks  @Raibaz !
- Added Travis continuous integration
- Refactor test to use TestUtil. Thanks @nitin42 !
- Work on #58: Adding missing tests. Thanks @nitin42 !

## 2017-01-29, version 0.1.5

Reverted #82 (Added script to check the installed node version) and mention
node version requiremnts in the README.

## 2017-01-29, version 0.1.4

Functionality Enhancements:

- Fixed #39: Add rule to simplify 1^x to 1. Thanks @michaelmior !
- Fixed #82: Added script to check the installed node version. Thanks @Raibaz !

Bug fixes:

- Fixed #77: bug where oldNode was null on every step. Thanks @hmaurer !
- Handle unary minus nodes that have an argument that is a parentheses. Thanks
  @tkosan !

Refactoring + Documentation + other dev enhancements:

- Fixed #73: replace New Kids on the Block video with one that's not restricted
  in most of the world
- Fixed #80: Use object literal property value shorthand. Thanks @cspanda !
- Fixed #62: Separated basicsSearch simplifications into their own files. Thanks
  @Raibaz !
- Fixed #78: pre-commit hook to run tests and linter before a git commit. Thanks
  @hmaurer !
- Improvements from #44: Added Linting rules. Thanks @biyasbasak !
- Fixed #91: Refactor isOperator to accept operator parameter. Thanks
  @mcarthurgill !
- Fixed #86: Clean up CONTRIBUTING.md. Thanks @faheel !
- Fixed #34: Make a helper function getRadicandNode. Thanks @lexiross !
- Fixed #95: Create RESOURCES.md for people to share relevant software,
  projects, and papers
- Fixed #102: Add a complete code example for solving an equation. Thanks
  @karuppiah7890 !

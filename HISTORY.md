# History

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

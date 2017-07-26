// Create NodeScope = {}
// Create scopeSteps = {}
// For each symbol in scope:
// - steps = simplifyExpression(scope[symbol]) (returning steps)
// - if steps = [] then there was an error or no simplification possible
// - scopeSteps[symbol] = steps
// - NodeScope[symbol] = steps[steps.length].newNode
const assert = require('assert');
const solveEquation = require('../../../lib/solveEquation');
const NO_STEPS = 'no-steps';

function testSolve(equationString, options={}, outputStr, debug=false) {
  const steps = solveEquation(equationString, options, debug);
  let lastStep;
  if (steps.length === 0) {
    lastStep = NO_STEPS;
  }
  else {
    lastStep = steps[steps.length -1].newEquation.ascii();
  }
  it(equationString + ' -> ' + outputStr, (done) => {
    assert.equal(lastStep, outputStr);
    done();
  });
}

describe('solveEquation when scope is present', function () {
  const tests = [
    // Use of nested scope (i.e., baz depends on bar)
    ['2y = baz - x^2', { scope:
    { baz: '(bar^2)',
      x: 10,
      bar: '(foo + x)',
      foo: 20
    }},
      'y = 400'
    ],
    // Symbol nested inside UnaryMinus node type
    ['y = GrossVal * (1 - (FeePct + CCPct)) - TransferFee',
      { scope:
      {
        CCPct: 0.015,
        FeePct: 0.05,
        GrossVal: 'TotalSales * Margin * Multiple',
        Margin: 0.15,
        Multiple: 10,
        PreTaxNetVal: 'GrossVal * (1 - (FeePct + CCPct)) - TransferFee',
        TotalSales: 8239341,
        TransferFee: 84000, // when TreeSearch checks Symbol before
        // unaryMinus, this test failed with TransferFee being added
        // instead of subtracted.
      }
      },
      'y = 11471675.7525'
    ]
  ];
  tests.forEach(t => testSolve(t[0], t[1], t[2], t[3]));
});

const collector = require('./lib/simplifyExpression/collectAndCombineSearch/LikeTermCollector');
const math = require('mathjs');

console.log(collector.collectLikeTerms(math.parse('x^2 + x + 3 + x^2 + 2')));
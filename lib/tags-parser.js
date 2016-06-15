
'use strict';

const Parsimmon = require('parsimmon');
const regex = Parsimmon.regex;
const string = Parsimmon.string;
const lazy = Parsimmon.lazy;
const ignore = regex(/\s*/m);

function lexeme(p) {
  return p.skip(ignore);
}

const colon = lexeme(string(':'));
const noSpaceText = lexeme(regex(/[^:^\n]+/));
const atom = lexeme(regex(/[a-z0-9%@#_]+/i));
const tag = lexeme(regex(/[\s]*:/)).then(atom);
const ttl = lexeme(regex(/[^:]*/));
const tagForm = ttl.then(tag.many()).skip(colon.times(0,1));
const tagList = lazy(() => { return tagForm; });

module.exports = tagList;

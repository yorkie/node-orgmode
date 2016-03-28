'use strict';

const Parsimmon = require('parsimmon');
const string = Parsimmon.string;
const regex = Parsimmon.regex;
const succeed = Parsimmon.succeed;
const alt = Parsimmon.alt;
const seq = Parsimmon.seq;
const seqMap = Parsimmon.seqMap;
const lazy = Parsimmon.lazy;
const eof = Parsimmon.eof;
const ignore = regex(/\s*/m);
function lexeme(p) { 
  return p.skip(ignore);
}

// Base context-free grammar
const colon = lexeme(string(':'));
const flag = lexeme(string('#+'));
const startOfLine = lexeme(regex(/\n*/));
const identifier = lexeme(regex(/[a-z]+/i));
const singleLineText = lexeme(regex(/[^\n]+/));
const multiline = lexeme(regex(/[^\*]*/));

// Complex context-free grammar
const blockOption = seq(
  startOfLine, flag, identifier, colon, singleLineText
).map(
  (val) => {
    return {
      name: val[2], 
      value: val[4],
    };
  }
);
const blockOptions = blockOption.many();
const startOfHeading = startOfLine.then(lexeme(regex(/[\*]+/)));
const heading = seq(
  startOfHeading, singleLineText
).map(
  (val) => {
    return {
      level: val[0].length,
      title: val[1],
    };
  }
);
const outline = seq(
  heading, multiline
);

function pointErrorOn(stream, position, expected) {
  let outputs = '\n';
  let start = 0;
  for (let i = 0; i <= position; i++) {
    let ch = stream[i];
    if (ch === '\n') {
      start = 0;
    } else {
      start += 1;
    }
    outputs += ch;
  }
  outputs += '\n' + (new Array(start - 1)).fill(' ').join('');
  outputs += '^\n';
  outputs += 'expected: (' + expected.join('|') 
    + '), but got the char ' + stream[position - 1] + ' at ' + position;
  return new SyntaxError(outputs);
}

/**
 * @interface IParser
 */
class IParser {
  /**
   * @method parse
   * @static
   * @param {String} stream - the stream or buffer to parse
   * @return {Object} return the parsed result
   */
  static parse(stream) {
    const p = new IParser(stream);
    return p.parse();
  }

  /**
   * Because the class is an interface, so the constructor should only
   * be called by extended classes.
   *
   * @constructor
   */
  constructor(stream) {
    this._stream = stream;
    this._parser = null;
  }

  /**
   * @getter parser
   */
  get parser() {
    return this._parser;
  }

  /**
   * @method parse
   * @return {Object} return the parsed result
   */
  parse() {
    if (!this._parser) {
      throw new Error('parser doesnt get defined');
    }
    const r = this._parser.parse(this._stream);
    if (r.status === false) {
      throw this.pointError(r.index, r.expected);
    } else {
      if (typeof this.build === 'function') {
        return this.build(r.value);
      } else {
        return r.value;
      }
    }
  }

  /**
   * @method pointError
   * @param {Number} position
   * @param {Array} expected
   * @return {SyntaxError} the error to print
   */
  pointError(position, expected) {
    pointErrorOn(this._stream, position, expected);
  }
}

/**
 * @class SectionSplitter
 */
class SectionSplitter {

  /**
   * @method split
   * @static
   * @param {String} stream - the stream or buffer to be split
   * @return {Object} return the split result
   */
  static split(stream) {
    return (new SectionSplitter(stream)).build();
  }

  /**
   * @constructor
   * @param {String} stream - the stream or buffer to be split
   */
  constructor(stream) {
    this._stream = stream;
    this._children = this._split();
  }

  /**
   * @method build
   */
  build() {
    let self = this;
    return {
      children: self._children,
      get raw() {
        return self._stream;
      }
    };
  }

  /**
   * @method _split
   * @private
   */
  _split() {
    const REG_START_BLOCK = /^[^(#|\|)]+/;
    const REG_COMMON_BLOCK = /\n[^(#|\|)]+/;
    return this._stream
      .replace(REG_START_BLOCK, '')
      .replace(REG_COMMON_BLOCK, '&nbsp;')
      .split('&nbsp;')
      .map(this._parseBlock)
      .filter((result) => result);
  }

  /**
   * @method _parseBlock
   * @private
   */
  _parseBlock(stream) {
    const table = ignore.then(lazy(() => {
      let columns = [];
      const line = lexeme(string('|'));
      const cell = lexeme(regex(/[a-z_\-\<\>\'\{\}\? ]+/i));
      const head = line.then(
        seq(cell, line).map((val) => {
          columns.push(val[0].trim());
          return val;
        }).many()
      );
      const sep = lazy(() => {
        const sepCell = lexeme(regex(/[\-]+/));
        const plus = lexeme(string('+'));
        return line.then(
          seq(sepCell, plus).times(columns.length - 1)
        ).then(
          seq(sepCell, line)
        );
      });
      const row = lazy(() => {
        return line.then(
          seq(cell, line).times(columns.length)
        );
      });
      return seq.apply(Parsimmon, [
        blockOptions,
        head.then(sep).then(row.many()),
      ]).map((val) => {
        return {
          type: 'table',
          options: val[0],
          rows: val[1].map((cells) => {
            let ret = {};
            for (let index in cells) {
              let v = cells[index][0].trim();
              switch (v.toLowerCase()) {
                case 'true':
                case 'yes': v = true; break;
                case 'false':
                case 'no': v = false; break;
                case '':
                case '_':
                // FIXME(Yorkie): nil or undefined?
                case '-': v = null; break;
                default: break;
              }
              ret[columns[index]] = v;
            }
            return ret;
          }),
        };
      });
    }));
    const source = ignore.then(lazy(() => {
      const begin = lexeme(string('BEGIN_SRC'));
      const end = lexeme(string('#+END_SRC'));
      const type = lexeme(regex(/[a-z]*/i));
      // TODO(Yorkie): currently we can't support the # in code block
      const code = lexeme(regex(/[^#]*/i));
      return flag.then(begin).then(
        seq(type, code, end)
      ).map((val) => {
        return {
          type: 'source',
          language: val[0],
          code: val[1],
        };
      });
    }));
    return alt.apply(Parsimmon, [
      table,
      source,
    ]).parse(stream).value;
  }

}

/**
 * @class OrgmodeParser
 * @extends IParser
 */
class OrgmodeParser extends IParser {

  /**
   * @constructor
   * @param {String} stream
   * @param {Object} options
   * @param {Boolean} options.autoParsing - parse the stream in constructor
   */
  constructor(stream, options) {
    super(stream);
    this.ast = null;
    this._options = options || {};
    this._parser = ignore.then(lazy(
      () => seq(blockOptions, outline.many())
    ));
    if (this._options.autoParsing) {
      this.parse();
    }
  }
  
  /**
   * @method build
   * @param {Object} tree
   */
  build(tree) {
    let newTree = {
      options: [],
      outlines: [],
    };
    newTree.options = tree[0];

    // build outlines
    for (let part of tree[1]) {
      const heading = part[0];
      newTree.outlines.push({
        heading,
        section: SectionSplitter.split(part[1]),
      });
    }
    this.ast = newTree;
    return newTree;
  }

}

module.exports = OrgmodeParser;
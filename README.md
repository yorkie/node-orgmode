# node-orgmode

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Dependency Status][david-image]][david-url]
[![Downloads][downloads-image]][downloads-url]

The orgmode implementation for Node.js which contains:

- A parser for orgmode based on the monadic LL(infinity) parser combinator library [jneen/parsimmon](https://github.com/jneen/parsimmon)
- A simple search engine for outlines

## Installation

```sh
npm install orgmode --save
```

## Usage

```js
const Orgmode = require('orgmode');
const document = new Orgmode('./path/to/your/document.org');

document.overview   // this is a getter for your document's OVERVIEW option
document.findByLevel(1) // you will get both level 1 outlines in array
```

## API

To see the complete API documentation, see [API Documentation](http://code.weflex.org/node-orgmode).

## NPM Commands

### Run Tests

```sh
$ npm test
```

### Release Documentation

```sh
$ npm docs
```

## License

MIT

[npm-image]: https://img.shields.io/npm/v/orgmode.svg?style=flat-square
[npm-url]: https://npmjs.org/package/orgmode
[travis-image]: https://img.shields.io/travis/weflex/node-orgmode.svg?style=flat-square
[travis-url]: https://travis-ci.org/weflex/node-orgmode
[david-image]: http://img.shields.io/david/weflex/node-orgmode.svg?style=flat-square
[david-url]: https://david-dm.org/weflex/node-orgmode
[downloads-image]: http://img.shields.io/npm/dm/orgmode.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/orgmode

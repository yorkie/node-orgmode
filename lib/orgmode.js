'use strict';

const OrgmodeParser = require('./parser');
const fs = require('fs');

/**
 * @class Orgmode
 */
class Orgmode {
  
  /**
   * @constructor
   */
  constructor(pathname) {
    this._pathname = pathname;
    this._ast = new OrgmodeParser(
      fs.readFileSync(pathname, 'utf8')
    ).parse();
  }
  
  /**
   * @getter overview
   */
  get overview() {
    return this._ast.options.reduce((map, item) => {
      map[item.name.toLowerCase()] = item.value;
      return map;
    }, {});
  }

  /**
   * @method findByLevel
   * @param {Number} level
   * @return {Array} return the outlines
   */
  findByLevel(level) {
    return this._ast.outlines.filter(
      (outline) => outline.heading.level === level
    );
  }
  
  /**
   * @method findByTitle
   * @param {String} title
   * @return {Array} return the outlines
   */
  findByTitle(title) {
    return this._ast.outlines.filter(
      (outline) => outline.heading.title === title
    );
  }

}

module.exports = Orgmode;

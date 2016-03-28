'use strict';

const OrgmodeParser = require('./parser');
const fs = require('fs');

/**
 * @class OutlineNode
 */
class OutlineNode {

  /**
   * @constructor
   */
  constructor(data, options) {
    Object.defineProperties(this, {
      _data: {
        get: () => data
      },
      _list: {
        get: () => options.list || []
      },
      _index: {
        get: () => options.index
      }
    });
    this.title = this._data.heading.title;
    this.level = this._data.heading.level;
  }

  /**
   * @method table
   */
  table(n) {
    return this._data.section.children.filter(
      (child) => child.type === 'table'
    )[n || 0];
  }

  /**
   * @getter children
   */
  get children() {
    let children = [];
    let curr = this.next();
     while (curr && curr.level > this.level) {
      children.push(curr);
      curr = curr.next();
    }
    return children;
  }

  /**
   * @method next
   */
  next() {
    if (this._index >= this._list.length - 1) {
      return null;
    } else {
      return this._list[this._index + 1]._node;
    }
  }

  /**
   * @method prev
   */
  prev() {
    if (this._index < 0) {
      return null;
    } else {
      return this._list[this._index - 1]._node;
    }
  }

  /**
   * @method toJSON
   */
  toJSON() {
    return this._data;
  }
}


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
    this._outlines = this._buildOutlines();
  }
  
  /**
   * @method _buildOutlines
   * @private
   */
  _buildOutlines() {
    return this._ast.outlines.map((data, index) => {
      const node = new OutlineNode(data, {
        index,
        list: this._ast.outlines,
      });
      Object.defineProperty(this._ast.outlines[index], '_node', {
        get: () => node
      });
      return node;
    });
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
    return this._outlines.filter(
      (outline) => outline.level === level
    );
  }
  
  /**
   * @method findByTitle
   * @param {String} title
   * @return {Array} return the outlines
   */
  findByTitle(title) {
    return this._outlines.filter(
      (outline) => outline.title === title
    );
  }

}

module.exports = Orgmode;

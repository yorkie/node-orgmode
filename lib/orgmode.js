'use strict';

const OrgmodeParser = require('./parser');
const fs = require('fs');

/**
 * @class OutlinesArrayList
 */
class OutlinesArrayList {

  /**
   * @constructor
   */
  constructor(collection) {
    this._outlines = collection || [];
  }

  /**
   * @property {Number} length - the length of this Array
   */
  get length() {
    return this._outlines.length;
  }

  /**
   * @property {Array} tables - list the all tables
   */
  get tables() {
    return this._outlines.reduce((collection, outline) => {
      const tables = outline.tables;
      if (tables.length > 0) {
        return collection.concat(tables);
      } else {
        return collection;
      }
    }, []);
  }

  /**
   * @method item
   * @param {Number} n - the item index
   */
  getItem(n) {
    return this._outlines[n];
  }

  /**
   * @method first
   */
  first() {
    return this.getItem(0);
  }

  /**
   * @method last
   */
  last() {
    return this.getItem(this.length - 1);
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

  /**
   * @method setOutlines
   */
  setOutlines(collection) {
    this._outlines = collection;
  }
}

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
   * @property {Array} tables - the tables
   */
  get tables() {
    return this._data.section.children.filter(
      (child) => child.type === 'table'
    );
  }

  /**
   * @property {Array} children
   */
  get children() {
    let children = [];
    let curr = this.next();
     while (curr && curr.level > this.level) {
      children.push(curr);
      curr = curr.next();
    }
    return new OutlinesArrayList(children);
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
 * @extends OutlinesArrayList
 */
class Orgmode extends OutlinesArrayList {
  
  /**
   * @constructor
   */
  constructor(pathname) {
    let ast = new OrgmodeParser(
      fs.readFileSync(pathname, 'utf8')
    ).parse();
    // Here calling the super constructor of `OutlinesArrayList` will
    // add a _outlines there from the inner `_buildOutlines` method
    super([]);

    // define the invisible properties
    Object.defineProperties(this, {
      _pathname: {
        get: () => pathname,
      },
      _ast: {
        get: () => ast,
      },
    });

    // call setOutlines of super to build this._outlines
    this.setOutlines(this._buildOutlines());
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
   * @property {Object} overview - the overview of this document
   */
  get overview() {
    return this._ast.options.reduce((map, item) => {
      map[item.name.toLowerCase()] = item.value;
      return map;
    }, {});
  }

}

module.exports = Orgmode;

'use strict';

const test = require('tape');
const path = require('path');
const Orgmode = require('../');

test('read a document', function(t) {
  const doc = new Orgmode(
    path.join(__dirname, './documents/empty.org'));
  t.end();
});

test('read a document with overview', function(t) {
  t.plan(2);
  const doc = new Orgmode(
    path.join(__dirname, './documents/overview.org'));
  t.equal(doc.overview.foo, 'BAR');
  t.equal(doc.overview.zoo, 'LOOP');
  t.end();
});

test('read a document with outlines', function(t) {
  const doc = new Orgmode(
    path.join(__dirname, './documents/outlines.org'));
  t.equal(doc.findByLevel(1).length, 2);
  t.equal(doc.findByLevel(2).length, 1);
  t.end();
});

test('read a document with table', function(t) {
  const doc = new Orgmode(
    path.join(__dirname, './documents/table.org'));
  const outline = doc.findByTitle('table')[0];
  t.equal(outline.title, 'table');
  t.equal(outline.children.length, 0);
  const table = outline.tables[0];
  t.deepEqual(table.options, [
    {name: 'NAME', value: 'tab1'},
  ]);
  t.deepEqual(table.rows, [
    {foo: 'y', bar: 'yo'},
  ]);
  t.equal(doc.tables.length, 1);
  t.end();
});

test('read a document with children', function(t) {
  const doc = new Orgmode(
    path.join(__dirname, './documents/children.org'));
  const h1 = doc.findByTitle('h1')[0];
  t.equal(h1.children.length, 3);
  t.equal(h1.children.first().children.length, 1);
  t.end();
});
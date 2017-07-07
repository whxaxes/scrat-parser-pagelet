'use strict';

const transform = require('../transform');
const assert = require('assert');
const path = require('path');
const fs = require('fs');

describe('transform', () => {
  it('should transform tpl without error', done => {
    transform({
      src: path.resolve(__dirname, './ref/**/*.tpl'),
      dist: path.resolve(__dirname, './dist'),
      baseDir: path.join(__dirname, './ref/'),
      attrAlias: {
        _id: '$id',
      },
      alias: {
        '~': 'widget',
      },
    }, () => {
      let str = fs.readFileSync(path.resolve(__dirname, './dist/page/test/test.tpl')).toString();
      assert(str.indexOf('{% require _id="./w-m" blab="123123" %}') >= 0);
      assert(str.indexOf('{% require "./w-s" %}') >= 0);
      assert(str.indexOf('{% require _id="~/common" abc="123123" %}') >= 0);
      assert(str.indexOf('{% pagelet "test" %}') >= 0);
      str = fs.readFileSync(path.resolve(__dirname, './dist/page/test/w-m/w-m.tpl')).toString();
      assert(str.indexOf('{% require "../w-s" %}') >= 0);
      str = fs.readFileSync(path.resolve(__dirname, './dist/widget/common/common.tpl')).toString();
      assert(str.indexOf('{% require "~/test" %}') >= 0);
      done();
    });
  });
});

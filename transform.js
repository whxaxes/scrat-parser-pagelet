'use strict';

const vfs = require('vinyl-fs');
const parser = require('node-mus/lib/compile/parser');
const path = require('path');
const through = require('through2');
const utils = require('./utils');
const quotReg = /^('|")|('|")$/g;

function normalize(el, options) {
  const list = [];
  options.split = options.split || '';
  if (options.split.length > 1) {
    throw new Error('split key must be only one character');
  }

  parser.parseNormalAttr(options.split || ' ', el._expr, (key, _, value) => {
    list.push({ key, value });
  });

  el._expr = list.map(item => {
    if (list.length === 1 || !item.key) {
      return el.require
        ? normalizeUrl(item.value, options) || item.value
        : item.value;
    } else {
      item.key = options.attrAlias[item.key] || item.key;
      if (item.key === (options.attrAlias.$id || '$id') && el.require) {
        item.value = normalizeUrl(item.value, options) || item.value;
      }
      return `${item.key}=${item.value}`;
    }
  }).join(options.split + ' ');
}

function normalizeUrl(url, options) {
  let quot = '';
  const alias = options.alias || {};
  const file = options.file;
  const _url = url;

  url = url.replace(quotReg, q => {
    quot = q;
    return '';
  }).trim();

  if (!quot || path.extname(url) || url.indexOf(quot) >= 0) {
    return _url;
  }

  options._alias = options._alias
    || new RegExp(`^(${Object.keys(alias).map(item => utils.reStringFormat(item)).join('|')})`);
  options._keys = options._keys
    || new RegExp(`^(${Object.keys(alias).map(item => utils.reStringFormat(alias[item])).join('|')})`);

  // replace alias
  url = url.replace(options._alias, (_, key) => alias[key]);

  const c = url.charAt(0);
  if (c !== '.' && !url.match(options._keys)) {
    const filePath = path.dirname(file.path);
    const requirePath = path.resolve(options.baseDir, url);
    url = path.relative(filePath, requirePath);
    if (url.charAt(0) !== '.') {
      url = './' + url;
    }
  }

  return quot + url + quot;
}

module.exports = (options, callback) => {
  const attrAlias = {};
  const urlAlias = {};
  Object.keys(options.attrAlias || {}).forEach(attr => (attrAlias[options.attrAlias[attr]] = attr));
  Object.keys(options.alias || {}).forEach(attr => (urlAlias[options.alias[attr]] = attr));
  options.attrAlias = attrAlias;
  options.alias = urlAlias;

  vfs.src(options.src)
    .pipe(through.obj((file, encoding, done) => {
      options.file = file;
      const str = file.contents.toString();
      const tree = utils.parseTemplate(str, {
        processor: {
          pagelet(el) {
            normalize(el, options);
          },
          require(el) {
            el.isUnary = true;
            normalize(el, options);
          },
        },
      });
      file.contents = new Buffer(utils.astTreeToString(tree));
      done(null, file);
    }))
    .pipe(vfs.dest(options.dist))
    .pipe(through.obj(
      (f, _, d) => d(null, f),
      () => { callback(); }
    ));
};

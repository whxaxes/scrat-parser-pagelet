'use strict';

const utils = require('./utils');
const path = require('path');
const parser = require('node-mus/lib/compile/parser');
const quotReg = /^('|")|('|")$/g;
const spaceReg = /(>|)(?:\s)+(<|)/g;

function normalize(el, options) {
  const list = [];
  options.split = options.split || '';
  if (options.split.length > 1) {
    throw new Error('split key should has only one character');
  }

  parser.parseNormalAttr(
    options.split || ' ',
    el._expr,
    (key, _, value) => {
      if (key) {
        key = options.attrAlias[key] || key;
        if (key === '$id' && el.require) {
          value = normalizeUrl(value, options);
        }
        list.push(`${key}=${value}`);
      } else {
        list.push(
          el.require ? normalizeUrl(value, options) : value
        );
      }
    });

  el._expr = list.join(options.split + ' ');
}

function normalizeUrl(url, options) {
  const alias = options.alias;
  const file = options.file;
  const _url = url;
  let quot = '';

  // trim space and quot
  url = url.replace(quotReg, q => {
    quot = q;
    return '';
  }).trim();

  // ignore url if url was variable, having operator or ext name
  if (!quot || path.extname(url) || url.indexOf(quot) >= 0) {
    return _url;
  }

  options._alias = options._alias
    || new RegExp(`^(${Object.keys(alias).map(item => utils.reStringFormat(item)).join('|')})`);

  // replace alias
  url = url.replace(options._alias, (_, key) => alias[key]);

  // handle relative path only
  if (url.charAt(0) === '.' && !path.extname(url)) {
    url = path.resolve(path.dirname(file.realpath), url)
      .replace(options.baseDir, '');

    if (path.sep !== '/') {
      url = url.replace(/\\/g, '/');
    }

    if (url.charAt(0) === '/') {
      url = url.substring(1);
    }
  }

  return quot + url + quot;
}

module.exports = function(content, file, options) {
  options.file = file;
  options.alias = options.alias || {};
  options.attrAlias = options.attrAlias || {};

  const tree = utils.parseTemplate(content, {
    blockStart: options.blockStart,
    blockEnd: options.blockEnd,
    variableStart: options.variableStart,
    variableEnd: options.variableEnd,
    processor: Object.assign({
      pagelet(el) { normalize(el, options); },
      require(el) {
        el.isUnary = true;
        normalize(el, options);
      },
      comment(el) { el.text = ''; },
      text(el) {
        if (!options.compress) {
          return;
        }

        // compress template
        el.text = el.text
          .replace(spaceReg, (_, l = '', r = '') => (
            l + ((l || r) ? '' : ' ') + r
          ));
      },
    }, options.processor),
  });

  return utils.astTreeToString(tree);
};

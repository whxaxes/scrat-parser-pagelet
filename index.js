'use strict';

const utils = require('./utils');
const path = require('path');
const parser = require('node-mus/lib/compile/parser');
const quotReg = /^('|")|('|")$/g;
const spaceReg = /(>|)(?:\t| )*(?:\r?\n)+(?:\t| )*(<|)/;

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

  if (!options._alias) {
    options._fullAlias = {};
    const aliasList = Object.keys(alias)
      .filter(item => {
        // collect full alias
        const isFullAlias = item.charAt(item.length - 1) === '$';
        if (isFullAlias) {
          const name = item.substring(0, item.length - 1);
          options._fullAlias[name] = alias[item];
        }
        return !isFullAlias;
      })
      .sort((a, b) => b.length - a.length)
      .map(item => utils.reStringFormat(item));
    options._alias = new RegExp(`^(${aliasList.join('|')})`);
  }

  // replace alias
  url = options._fullAlias[url] || url.replace(options._alias, (_, key) => alias[key]);

  // handle relative path only
  if (url.charAt(0) === '.' && !path.extname(url)) {
    url = path.resolve(path.dirname(file.realpath), url)
      .replace(options.baseDir, '');
  } else if (path.isAbsolute(url)) {
    url = path.relative(options.baseDir, url);
  }

  if (path.sep !== '/') {
    url = url.replace(/\\/g, '/');
  }

  if (url.charAt(0) === '/') {
    url = url.substring(1);
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

        let matches;
        let newText = '';
        let text = el.text;
        // compress template
        while ((matches = text.match(spaceReg))) {
          const l = matches[1] || '';
          const r = matches[2] || '';
          const t = text.substring(0, matches.index);
          newText += t + l;

          // prevent comment in javascript
          if (t.indexOf('//') >= 0) {
            newText += '\n';
          } else if (!l && !r) {
            newText += ' ';
          }
          newText += r;
          text = text.substring(matches.index + matches[0].length);
        }

        el.text = newText + text;
      },
    }, options.processor),
  });

  return utils.astTreeToString(tree);
};

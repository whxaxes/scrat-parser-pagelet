'use strict';

const utils = require('./utils');
const path = require('path');
const parser = require('node-mus/lib/compile/parser');
const quotReg = /^('|")|('|")$/g;
const spaceReg = /(>|)(?:\t| )*(?:\r?\n)+(?:\t| )*(<|)/;
const maybeQuotReg = /,\s*[^, ]+\s*=/;
const handleUrlList = ['require', 'include', 'extend'];

function normalize(el, options) {
  const list = [];
  let splitKey = options.split;

  // guess witch split was using
  if (!splitKey) {
    if (el._expr.match(maybeQuotReg)) {
      splitKey = ',';
    } else {
      splitKey = '';
    }
  } else if (splitKey.length > 1) {
    throw new Error('split key should has only one character');
  }

  parser.parseNormalAttr(splitKey || ' ', el._expr, (key, _, value) => {
    if (key) {
      key = options.attrAlias[key] || key;
      if (key === '$id' && handleUrlList.includes(el.tag)) {
        value = normalizeUrl(value, options);
      }
      list.push(`${key}=${value}`);
    } else {
      list.push(
        handleUrlList.includes(el.tag) ? normalizeUrl(value, options) : value
      );
    }
  });

  el._expr = list.join(splitKey + ' ');
}

function normalizeUrl(url, options) {
  const alias = options.alias;
  const file = options.file;
  const _url = url;
  let quot = '';

  // trim space and quot
  url = url
    .replace(quotReg, q => {
      quot = q;
      return '';
    })
    .trim();

  // ignore url if url was variable, having operator or ext name
  if (!quot || url.indexOf(quot) >= 0) {
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
  url =
    options._fullAlias[url] ||
    url.replace(options._alias, (_, key) => alias[key]);

  if (url.charAt(0) === '.') {
    url = path.resolve(path.dirname(file.realpath), url);
  }

  const ext = path.extname(url);
  if (path.isAbsolute(url)) {
    url = path.relative(
      ext ? options.appDir : path.resolve(options.appDir, './component'),
      url
    );
  } else if (ext) {
    return _url;
  }

  if (path.sep !== '/') {
    url = url.replace(/\\/g, '/');
  }

  return quot + url + quot;
}

function compressTemplate(text) {
  let matches;
  let newText = '';
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
  return newText + text;
}

module.exports = function(content, file, options) {
  options.file = file;
  options.alias = options.alias || {};
  options.attrAlias = options.attrAlias || {};
  options.appDir = path.resolve(options.root || process.cwd(), './app');

  const processor = {
    pagelet: el => normalize(el, options),
    comment: el => (el.text = ''),
    text: el => options.compress && (el.text = compressTemplate(el.text)),
  };

  handleUrlList.forEach(key => {
    processor[key] = function(el) {
      el.isUnary = true;
      normalize(el, options);
    };
  });

  const tree = utils.parseTemplate(content, {
    blockStart: options.blockStart,
    blockEnd: options.blockEnd,
    variableStart: options.variableStart,
    variableEnd: options.variableEnd,
    processor: Object.assign(processor, options.processor),
  });

  return utils.astTreeToString(tree);
};

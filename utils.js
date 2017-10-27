'use strict';

const ast = require('node-mus/lib/compile/ast');
const constant = require('node-mus/lib/compile/constant');
const regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g;

module.exports = {
  astTreeToString(astTree, process) {
    let html = '';
    if (!astTree) {
      return html;
    }

    const astNodeToString = ast => {
      let html = `${ast._ast.blockStart} ${ast.tag}`;
      const expr = ast.text.trim();
      html += expr ? ` ${expr}` : '';
      html += ' ' + ast._ast.blockEnd;
      ast.innerText = this.astTreeToString(ast.children, process);
      return html + ast.innerText;
    };

    astTree.forEach(ast => {
      let fragment = '';
      switch (ast.type) {
        case constant.TYPE_TAG:
          fragment += astNodeToString(ast);
          break;
        case constant.TYPE_TEXT:
          fragment += ast.text;
          break;
        case constant.TYPE_VAR:
          fragment += `${ast._ast.variableStart} ${ast.text.trim()} ${ast._ast.variableEnd}`;
          break;
        default:
          break;
      }

      if (ast.elseifBlock) {
        ast.elseifBlock.forEach(_a => {
          fragment += astNodeToString(_a);
        });
      }

      if (ast.elseBlock) {
        fragment += astNodeToString(ast.elseBlock);
      }

      if (!ast.isUnary && ast.type === constant.TYPE_TAG) {
        fragment += `${ast._ast.blockStart} end${ast.tag} ${ast._ast.blockEnd}`;
      }

      html += process
        ? process(fragment, ast)
        : fragment;
    });

    return html;
  },

  parseTemplate(str, options = {}) {
    // parse template by node-mus
    /* istanbul ignore next */
    return ast(str, Object.assign(options, {
      processor: Object.assign({
        comment() {},
        pagelet() {},
        require(el) { el.isUnary = true; },
        datalet(el) { el.isUnary = true; },
        html() {},
        head() {},
        body() {},
        title() {},
        for() {},
        uri(el) { el.isUnary = true; },
        script() {},
        variable() {},
        ATF(el) { el.isUnary = true; },
        macro() {},
        extends(el) { el.isUnary = true; },
        block() {},
        include(el) { el.isUnary = true; },
        import(el) { el.isUnary = true; },
        autoescape() {},
        verbatim() {},
        call() {},
        parent(el) { el.isUnary = true; },
        spaceless() {},
      }, options.processor),
    })).root;
  },

  reStringFormat(str) {
    return str.replace(regexEscapeRE, '\\$&');
  },
};


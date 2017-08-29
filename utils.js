'use strict';

const ast = require('node-mus/lib/compile/ast');
const regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g;

module.exports = {
  astTreeToString(astTree) {
    let html = '';
    if (!astTree) {
      return html;
    }

    astTree.forEach(ast => {
      switch (ast.type) {
        case 1:
          html += this.astNodeToString(ast);
          break;
        case 2:
          html += ast.text;
          break;
        case 3:
          html += `${ast._ast.variableStart} ${ast._expr.trim()} ${ast._ast.variableEnd}`;
          break;
        default:
          break;
      }

      if (ast.elseifBlock) {
        ast.elseifBlock.forEach(_a => {
          html += this.astNodeToString(_a);
        });
      }

      if (ast.elseBlock) {
        html += this.astNodeToString(ast.elseBlock);
      }

      if (!ast.isUnary && ast.type === 1) {
        html += `${ast._ast.blockStart} end${ast.tag} ${ast._ast.blockEnd}`;
      }
    });

    return html;
  },

  astNodeToString(ast) {
    let html = `${ast._ast.blockStart} ${ast.tag}`;
    const expr = ast._expr.trim();
    html += expr ? ` ${expr}` : '';
    html += ' ' + ast._ast.blockEnd;
    return html + this.astTreeToString(ast.children);
  },

  parseTemplate(str, options) {
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


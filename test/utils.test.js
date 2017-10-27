'use strict';

const utils = require('../utils');
const assert = require('assert');
const path = require('path');
const template = `
{% html %}
{% head %}{% endhead %}
{% body %}
  <div id="app">
    {% require "~p/navigation" %}
    {% extends "~p/navigation" %}
    {% include "~p/navigation" %}
  
    {% block body %}
    <script>
      // test
      var a = 123;
      {% block content %}
      <script>
        // test
        var a = 123;
      </script>
      {% endblock %}
    </script>
    {% endblock %}
  </div>
{% endbody %}
{% endhtml %}
`;

describe('utils', () => {
  it('#astTreeToString', () => {
    const astTree = utils.parseTemplate(template);
    assert(utils.astTreeToString(astTree, (frag, ast) => {
      if (ast.tag === 'block' && ast.text === 'body') {
        return frag.replace(ast.innerText, ast.innerText + '<123123>');
      } else {
        return frag;
      }
    }).includes('<123123>{% endblock %}'))
  });
});

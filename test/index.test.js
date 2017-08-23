'use strict';

const pageletParser = require('../');
const assert = require('assert');
const path = require('path');
const template = `
{% html %}
{% head %}{% endhead %}
{% body %}
  <div id="app">
    {% require "~p/navigation" %}
  
    {% pagelet _id="gameList" id="gameList" ref="gameList" %}
      <div class="content">
        <div class="left-side">
          {% require "./w-game-list" %}
        </div>
    
        <div class="right-side">
          {% require $id="./w-rank-list" %}
          {{ abc }}
        </div>

        {% require __pageUrl__ %}
        {% require _id="./lib.js" %}
        {% require "app/lib.js" %}
        {% require "./" + "lib.js" %}
        {% if aaa %}
          abc
        {% elif ccc %}
          nnc
        {% endif %}
      </div>
    {% endpagelet %}

    <script>
      // test
      var a = 123;
    </script>
  
    {% require "~/test" %}
    {% require "~m/foot" %}
    {% datalet a = bb %}
  </div>
{% endbody %}
{% endhtml %}
`;

describe('parse', () => {
  it('should parse without error', () => {
    const options = {
      compress: true,
      attrAlias: {
        _id: '$id',
      },
      alias: {
        '~m': 'm/widget',
        '~p': 'p/widget',
        '~': 'widget',
      },
    };

    const nstring = pageletParser(template, {
      realpath: path.join(__dirname, '../app/component/page/test/test.tpl')
    }, options);

    const nstring2 = pageletParser(template, {
      realpath: path.join(__dirname, '../app/component/page/test/test.tpl')
    }, options);

    assert(nstring.match(/\n/g).length === 1);
    assert(nstring.indexOf('\nvar a = 123;') >= 0);
    assert(nstring.indexOf('require "./" + "lib.js"') >= 0);
    assert(nstring.indexOf('"component/page/test/lib.js"') >= 0);
    assert(nstring.indexOf('{% require "app/lib.js" %}') >= 0);
    assert(nstring.indexOf('require __pageUrl__') >= 0);
    assert(nstring.indexOf('"page/test/w-game-list"') >= 0);
    assert(nstring.indexOf('"p/widget/navigation"') >= 0);
    assert(nstring.indexOf('$id="gameList"') >= 0);
    assert(nstring.indexOf('"page/test/w-rank-list"') >= 0);
    assert(nstring.indexOf('"widget/test"') >= 0);
    assert(nstring.indexOf('"m/widget/foot"') >= 0);
    assert(nstring2.indexOf('"page/test/w-game-list"') >= 0);
  });

  it('should parse with appoint split key', () => {
    const nstring = pageletParser(`
    {% pagelet _id="gameList", id="gameList", ref="gameList" %}
       {% require "./w-rank-list" %}
    {% endpagelet %}
    `, {
      realpath: path.join(__dirname, './ref/app/component/page/test/test.tpl')
    }, {
      root: path.join(__dirname, './ref/'),
      split: ',',
      attrAlias: {
        _id: '$id',
      },
    });

    assert(nstring.indexOf('$id="gameList"') >= 0);
  });

  it('should support resolve and full resolve', () => {
    const nstring = pageletParser(`
    {% pagelet _id="gameList", id="gameList", ref="gameList" %}
       {% require "./w-rank-list", id="123" %}
       {% require "~/w-rank-list" %}
       {% require "index" %}
       {% require "index$", id="123" %}
    {% endpagelet %}
    `, {
      realpath: path.join(__dirname, '../app/component/page/test/test.tpl')
    }, {
      split: ',',
      attrAlias: {
        _id: '$id',
      },
      alias: {
        '~': path.join(__dirname, '../app/component/widget'),
        'index$': path.join(__dirname, '../app/component/widget/index'),
      },
    });

    assert(nstring.indexOf('{% require "page/test/w-rank-list", id="123" %}') >= 0);
    assert(nstring.indexOf('{% require "widget/w-rank-list" %}') >= 0);
    assert(nstring.indexOf('{% require "widget/index" %}') >= 0);
    assert(nstring.indexOf('{% require "index$", id="123" %}') >= 0);
  })

  it('should support self defined tag', done => {
    pageletParser('{% css %}{% endcss %}', {
      realpath: path.join(__dirname, '../app/component/page/test/test.tpl')
    }, {
      processor: {
        css() {
          done();
        },
      }
    });
  });
});

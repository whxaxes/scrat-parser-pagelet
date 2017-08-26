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
    assert(nstring.includes('\nvar a = 123;'));
    assert(nstring.includes('require "./" + "lib.js"'));
    assert(nstring.includes('"component/page/test/lib.js"'));
    assert(nstring.includes('{% require "app/lib.js" %}'));
    assert(nstring.includes('require __pageUrl__'));
    assert(nstring.includes('"page/test/w-game-list"'));
    assert(nstring.includes('"p/widget/navigation"'));
    assert(nstring.includes('$id="gameList"'));
    assert(nstring.includes('"page/test/w-rank-list"'));
    assert(nstring.includes('"widget/test"'));
    assert(nstring.includes('"m/widget/foot"'));
    assert(nstring2.includes('"page/test/w-game-list"'));
  });

  it('should parse with appoint split key', () => {
    const nstring = pageletParser(`
    {% pagelet _id="gameList"; id="gameList"; ref="gameList" %}
       {% require "./w-rank-list" %}
    {% endpagelet %}
    `, {
      realpath: path.join(__dirname, './ref/app/component/page/test/test.tpl')
    }, {
      root: path.join(__dirname, './ref/'),
      split: ';',
      attrAlias: {
        _id: '$id',
      },
    });

    assert(nstring.includes('$id="gameList"; id="gameList"; ref="gameList"'));
  });

  it('should parse without error without split key', () => {
    const nstring = pageletParser(`
    {% pagelet _id="gameList" id="gameList" ref="gameList" %}{% endpagelet %}
    {% pagelet _id="gameList2", id="gameList2", ref="gameList2" %}{% endpagelet %}
    {% pagelet _id="gameList3" id={a: '1', b: '2'} ref="gameList3" %}{% endpagelet %}
    `, {
      realpath: path.join(__dirname, './ref/app/component/page/test/test.tpl')
    }, {
      root: path.join(__dirname, './ref/'),
      attrAlias: {
        _id: '$id',
      },
    });

    assert(nstring.includes('$id="gameList" id="gameList" ref="gameList"'));
    assert(nstring.includes('$id="gameList2", id="gameList2", ref="gameList2"'));
    assert(nstring.includes(`$id="gameList3" id={a: '1', b: '2'} ref="gameList3"`));
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

    assert(nstring.includes('{% require "page/test/w-rank-list", id="123" %}'));
    assert(nstring.includes('{% require "widget/w-rank-list" %}'));
    assert(nstring.includes('{% require "widget/index" %}'));
    assert(nstring.includes('{% require "index$", id="123" %}'));
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

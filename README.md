# scrat-parser-pagelet

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Appveyor status][appveyor-image]][appveyor-url]
[![Coverage Status][coveralls-image]][coveralls-url]

在 scrat pagelet 模式中，对 pagelet 的模板能力进行一些拓展

## 安装

```bash
npm install scrat-parser-pagelet --save-dev
```

```bash
yarn add scrat-parser-pagelet --dev
```

## 快速使用

```js
scrat.match('{widget, page, app/view}/**.tpl', {
  parser: [
    scrat.plugin('pagelet', {
      compress: true,
      attrAlias: {
        _id: '$id',
      },
      alias: {
        '~': 'widget',
      },
    }, 'append'),
  ]
})
```

## 参数列表

|Name|Type|Describe|Default|
|----|----|--------|-------|
| root | String | 项目根目录 | process.cwd() |
| compress | Boolean | 是否压缩模板 | false |
| attrAlias | PlainObject | 属性映射 | - |
| alias | PlainObject | 别名 | - |
| split | String | 属性的分隔符，默认为空格，如果是使用 egg-view-nunjucks-pagelet 并且把 useCustomParser 置为了 false，请把该值改为逗号 | 空格 |
| blockStart | String | - | {% |
| blockEnd | String | - | %} |
| variableStart | String | - | {{ |
| variableEnd | String | - | }} |
| processor | PlainObject | 自定义处理器 | {} |

## 支持功能：

### 相对路径

此前在使用 require 标签引入模块的时候，都只能用绝对路径，比如页面 A 要引入其下的模块 B

```html
{% require 'page/xxx/A/B' %}
```

就可以改成这种写法

```html
{% require './B' %}
```

### 别名

定义别名，跟 webpack 中的 alias 类似

```js
alias: {
  '~': 'widget',
  '~m': path.resolve(__dirname, './app/component/widget/mobile'),
  'index$': path.resolve(__dirname, './app/component/page/index'),
}
```

在引入 widget 下的模块的时候，就可以：

```html
{% require '~/B' %}
{% require '~m/B' %}
{% require 'index' %}
```

上面的代码则会转为

```html
{% require 'widget/B' %}
{% require 'widget/mobile/B' %}
{% require 'page/index' %}
```

### 属性名映射

使用 webstorm + twig 写模板的都会遇到这种情况，require 标签还有 pagelet 标签中的 id ，是用 $ 符号，会导致 twig 模板解析报错。从而导致 webstorm 的一键格式化会出错。

所以提供属性名映射：

```js
attrAlias: {
  '_id': '$id'
}
```

写模板的时候就可以：

```html
{% pagelet _id="gameList" test="123" %}
{% require _id="~/B" %}
```

### 模板压缩

压缩前

```html
<div id="app">
  {% require "~p/navigation" %}

  <div class="content">
    <div class="left-side">
      {% require "./w-game-list" %}
    </div>

    <div class="right-side">
      {% require "./w-rank-list" %}
    </div>
  </div>

  {% require "~p/foot" %}
</div>
```

会自动去掉换行，多余的空格，变换并压缩后

```html
<div id="app">{% require "p/widget/navigation" %}<div class="content"><div class="left-side">{% require "p/page/index/w-game-list" %}</div><div class="right-side">{% require "p/page/index/w-rank-list" %}</div></div>{% require "p/widget/foot" %}</div>
```

### 自定义 processor

允许覆盖组件的 processor，做一些自己想干的活。比如组件的压缩功能，就是在 text 这个 processor 中做的

```js
processor: {
  text(el) {
    // compress template
    el.text = el.text
      .replace(spaceReg, (_, l = '', r = '') => (
        l + ((l || r) ? '' : ' ') + r
      ));
  },
}
```

完全可以自定义个你自己觉得更好的压缩方法，再或者觉得组件对 require 或者 pagelet 的处理不够好，那么就覆盖组件的 require processor

```js
processor: {
  pagelet(el) {
    // do something
  },
  require(el) {
    // do something
  }
}
```

[npm-url]: https://npmjs.org/package/scrat-parser-pagelet
[npm-image]: http://img.shields.io/npm/v/scrat-parser-pagelet.svg
[travis-url]: https://travis-ci.org/whxaxes/scrat-parser-pagelet
[travis-image]: http://img.shields.io/travis/whxaxes/scrat-parser-pagelet.svg
[appveyor-url]: https://ci.appveyor.com/project/whxaxes/scrat-parser-pagelet/branch/master
[appveyor-image]: https://ci.appveyor.com/api/projects/status/github/whxaxes/scrat-parser-pagelet?branch=master&svg=true
[coveralls-url]: https://coveralls.io/r/whxaxes/scrat-parser-pagelet
[coveralls-image]: https://img.shields.io/coveralls/whxaxes/scrat-parser-pagelet.svg

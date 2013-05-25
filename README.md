# grunt-atc

> The best Grunt plugin ever.

#	atc-前端模板预编译器

<http://cdc-im.github.io/atc>

## 修改点

node compiler.js --namespace taobao  demo/templates/

    ;
    (function () {
        var helpers = namespace('taobao.artTempHelper');
        var Render = function ($data) {
                'use strict';
                var $helpers = this,
                    $out = '';
                $out += '<div id="header"> <h1 id="logo"><a href="http://www.qq.com"><img width="134" height="44" src="http://mat1.gtimg.com/www/images/qq2012/qqlogo_1x.png" alt="腾讯网" /></a></h1> <ul id="nav"> <li><a href="http://www.qq.com">首页</a></li> <li><a href="http://news.qq.com/">新闻</a></li> <li><a href="http://pp.qq.com/">图片</a></li> <li><a href="http://mil.qq.com/">军事</a></li> </ul> </div>';
                return new String($out)
            };
        Render.prototype = helpers;
        var result = function (data) {
                return new Render(data) + '';
            }
        namespace('taobao.header', result);
    })();

## Getting Started
This plugin requires Grunt `~0.4.1`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-atc --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-atc');
```

## The "atc" task

### Overview
In your project's Gruntfile, add a section named `atc` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  atc: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
})
```

### Options

#### options.separator
Type: `String`
Default value: `',  '`

A string value that is used to do something with whatever.

#### options.punctuation
Type: `String`
Default value: `'.'`

A string value that is used to do something else with whatever else.

### Usage Examples

#### Default Options
In this example, the default options are used to do something with whatever. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result would be `Testing, 1 2 3.`

```js
grunt.initConfig({
  atc: {
    options: {},
    files: {
      'dest/default_options': ['src/testing', 'src/123'],
    },
  },
})
```

#### Custom Options
In this example, custom options are used to do something else with whatever else. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result in this case would be `Testing: 1 2 3 !!!`

```js
grunt.initConfig({
  atc: {
    options: {
      separator: ': ',
      punctuation: ' !!!',
    },
    files: {
      'dest/default_options': ['src/testing', 'src/123'],
    },
  },
})
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_

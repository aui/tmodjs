/*!
 * TmodJS - AOT Template Compiler
 * https://github.com/aui/tmodjs
 * Released under the MIT, BSD, and GPL Licenses
 */

'use strict';

var template = require('art-template');

var SLASH_RE = /\\\\/g;
var DOT_RE = /\/\.\//g;
var DOUBLE_DOT_RE = /(\/)[^/]+\1\.\.\1/;
var DIRNAME_RE = /[^/]+$/;
var ANONYMOUS_RE = /^function\s+anonymous/;
var EXTNAME_RE = /\.(html|htm|tpl)$/i;
var INCLUDE_RE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*include|(?:^|[^$])\binclude\s*\(\s*(["'])(.+?)\1/g; //"



// 编译模板
var compile = function (id, source, debug) {

    template.isCompress = true;
    template.onerror = function (e) {
        throw e;
    };

    var render = template.compile(id, source, debug);
    delete template.cache[id];

    return render
    .toString()
    .replace(ANONYMOUS_RE, 'function');
};


// 检查模板是否有逻辑语法
var testTemplateSyntax = function (source) {
    return source.indexOf(template.openTag) !== -1;
};


// 模板 ID 规范检查
// 保证 include 语法引用的是相对路径
var testUri = function (uri, fromUri, source) {
    if (!/^\./.test(uri) || EXTNAME_RE.test(uri)) {

        var line;

        // 如果只出现一次这个字符串，很容易确认模板错误行
        if (source.split(uri).length === 2) {
            source.split(/\n/).forEach(function (code, index) {
                if (code.indexOf(uri) !== -1) {
                    line = index + 1;
                    source = code.trim();
                }
            });
        }

        var error = {
            name: 'Syntax Error',
            type: 1,
            line: line,
            source: source,
            message: 'Template must be a relative path, and can not have a suffix.'
        };

        if (fromUri) {
            error.id = fromUri;
        }

        throw error;
    }
};


// 依赖分析
var parseDependencies = function (code) {
    var list = [];
    var uniq = {};

    code
    .replace(SLASH_RE, '')
    .replace(INCLUDE_RE, function(m, m1, m2) {
        if (m2 && !uniq.hasOwnProperty(m2)) {
            list.push(m2);
            uniq[m2] = true;
        }
    });

  return list;
};


// 获取上一层 uri
var dirname = function (uri) {
    return uri.replace(DIRNAME_RE, '');
};


// 分解为标准化 uri
var resolve = function (uri) {
    uri = uri.replace(DOT_RE, '/');
    while (uri.match(DOUBLE_DOT_RE)) {
        uri = uri.replace(DOUBLE_DOT_RE, '/');
    }
    return uri;
};


// 构造字符串表达式
var stringify = function (code) {
    return "'" + code
    .replace(/('|\\)/g, '\\$1')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    + "'";  
};


// 压缩 HTML 字符串
var compressHTML = function (code) {
    code = code
    .replace(/[\n\r\t\s]+/g, ' ')
    .replace(/<!--.*?-->/g, '');

    return code;
};


/**
 * 模板预编译器，根据设置生成不同格式的 javascript 模块
 * @param   {String}    注册的模板 ID，例如 home/list
 *                      要求：不能是 . 活者 / 开头的名称，且末尾不能有后缀名
 * @param   {String}    模板源代码
 * @param   {Object}    选项
 */
template.AOTcompile = function (id, source, options) {

    var uri = './' + id;

    // 是否嵌入完整模板引擎，嵌入后将把模板保存为字符串
    var isEngine = options.engine;

    // 是否为编译为调试版本
    var isDebug = options.debug;

    // 编译的模块类型
    var type = options.type;

    // 运行时模块别名
    var alias = options.alias;
    

    var RUNTIME = 'template';
    var code = '';
    var render = compile(uri, source, isDebug);
    var requires = parseDependencies(render);
    var isLogic = testTemplateSyntax(source);
    var dir = dirname(uri);

    var isHTML = isEngine || !isLogic;
    

    if (isHTML) {
        // 备注：compressHTML 可能会处理逻辑语句，不过实际场景中不会出问题
        code = isDebug ? source : compressHTML(source);
        code = stringify(code);
    } else {
        code = render.replace(ANONYMOUS_RE, 'function');
    }


    // 计算主入口相对于当前模板路径
    var getRuntime = function () {
        if (alias) {
            return alias;
        }
        var prefix = './';
        var length = dir.split('/').length - 2;
        if (length) {
            prefix = (new Array(length + 1)).join('../');
        }
        return prefix + RUNTIME;
    };


    // 生成 require 函数依赖声明代码
    var getRequireCode = function () {
        var requiresCode = [];
        
        requires.forEach(function (uri) {
            requiresCode.push("require('" + uri + "');");
        });

        return requiresCode.join('\n');
    };


    switch (type) {

        // RequireJS / SeaJS 兼容模块格式
        case 'cmd':

            code
            = "define(function(require){"
            +      getRequireCode()
            +      "return require('" + getRuntime() + "')"
            +       "('" + id + "', " + code + ");"  
            + "});";
            break;


        // RequireJS 模块格式
        case 'amd':

            code
            = "define("
            + "['" + getRuntime() + "','" + requires.join("','") + "'],"
            + "function(template){"
            +      "return template('" + id + "', " + code + ");"  
            + "});";
            break;


        // NodeJS 模块格式
        case 'commonjs':

            code
            = "var template=require('" + getRuntime() + "');"
            + getRequireCode()
            + "module.exports=template('" + id + "'," + code + ");";
            break;


        default:

            code = "template('" + id + "'," + code + ");";

    }


    return {

        // 编译结果
        code: code,

        // 依赖的子模板
        requires: requires.map(function (subUir) {
            testUri(subUir, uri, source);
            return resolve(dir + subUir);
        })

    };

};

module.exports = template;
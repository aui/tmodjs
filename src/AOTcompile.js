/*!
 * TmodJS - AOT Template Compiler
 * https://github.com/aui/tmodjs
 * Released under the MIT, BSD, and GPL Licenses
 */

'use strict';

module.exports = function (template) {
    /**
     * 模板预编译器，根据设置生成不同格式的 javascript 模块
     * @param   {String}    模板源代码
     * @param   {Object}    选项
     */
    template.AOTcompile = function (source, options) {

        var uri = './' + options.filename;

        // 是否为编译为调试版本
        var debug = options.debug;

        // 模板名（不能以 . 或者 / 开头）
        var filename = options.filename;

        // 编译的模块类型
        var type = options.type;

        // 运行时模块别名。设置此后 runtime 的路径将被写死
        var alias = options.alias;

        // 运行时名
        var runtime = options.runtime;

        // 是否压缩 HTML 多余空白字符
        var compress = debug ? true : options.compress;

        options.cache = false;

        var render = compile(source, options);
        var requires = parseDependencies(render);
        var isLogic = testTemplateSyntax(source, options);
        var dir = dirname(uri);
        var code = '';
        

        if (!isLogic) {
            code = compress ? compressHTML(source) : source;
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
            return prefix + runtime.replace(/\.js$/, '');
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
                +       "('" + filename + "', " + code + ");"  
                + "});";
                break;


            // RequireJS 模块格式
            case 'amd':

                code
                = "define("
                + "['" + getRuntime() + "','" + requires.join("','") + "'],"
                + "function(template){"
                +      "return template('" + filename + "', " + code + ");"  
                + "});";
                break;


            // NodeJS 模块格式
            case 'commonjs':

                code
                = "var template=require('" + getRuntime() + "');"
                + getRequireCode()
                + "module.exports=template('" + filename + "'," + code + ");";
                break;


            default:

                code = "template('" + filename + "'," + code + ");";

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



    template.config('cache', false);
    template.onerror = function (e) {
        throw e;
    };


    var SLASH_RE = /\\\\/g;
    var DOT_RE = /\/\.\//g;
    var DOUBLE_DOT_RE = /(\/)[^/]+\1\.\.\1/;
    var DIRNAME_RE = /[^/]+$/;
    var ANONYMOUS_RE = /^function\s+anonymous/;
    var EXTNAME_RE = /\.(html|htm|tpl)$/i;
    var INCLUDE_RE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*include|(?:^|[^$])\binclude\s*\(\s*(["'])(.+?)\1/g; //"


    // 编译模板
    var compile = function (source, options) {

        var render = template.compile(source, options);

        return render
        .toString()
        .replace(ANONYMOUS_RE, 'function');
    };


    // 检查模板是否有逻辑语法
    var testTemplateSyntax = function (source, options) {
        return source.indexOf(options.openTag) !== -1;
    };


    // 模板 filename 规范检查
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
                line: line,
                source: source,
                message: 'Template must be a relative path, and can not have a suffix.'
            };

            if (fromUri) {
                error.filename = fromUri;
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
        .replace(/\s+/g, ' ')
        .replace(/<!--[\w\W]*?-->/g, '');

        return code;
    };


    return template;
};







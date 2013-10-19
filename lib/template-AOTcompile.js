/*!
 * TmodJS - AOT Template Compiler
 * https://github.com/aui/tmodjs
 * Released under the MIT, BSD, and GPL Licenses
 */

var template = require('./template.js');


var SLASH_RE = /\\\\/g;
var DOT_RE = /\/\.\//g;
var DOUBLE_DOT_RE = /(\/)[^/]+\1\.\.\1/;
var DIRNAME_RE = /[^/]+$/;
var ANONYMOUS_RE = /^function\s+anonymous/;
var EXTNAME_RE = /\.(html|htm|tpl)$/i;
var INCLUDE_RE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*include|(?:^|[^$])\binclude\s*\(\s*(["'])(.+?)\1\s*(,\s*(.+?)\s*)?\)/g; //"



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
var testId = function (id, fromID) {
    if (!/^\./.test(id) || EXTNAME_RE.test(id)) {
        var error = {
            name: 'Syntax Error',
            message: id + '\n'
            + 'Template must be a relative path, and can not have a suffix.'
        };

        if (fromID) {
            error.id = fromID;
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


// 获取上一层 ID
var dirname = function (id) {
    return id.replace(DIRNAME_RE, '');
};


// 分解为标准化 ID
var resolve = function (id) {
    id = id.replace(DOT_RE, '/');
    while (id.match(DOUBLE_DOT_RE)) {
        id = id.replace(DOUBLE_DOT_RE, '/');
    }
    return id;
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
 * @param   {String}    模板ID，例如 ./home/list
 *                      要求：必须是 . 的相对路径开头，且末尾不能有后缀名
 * @param   {String}    模板源代码
 * @param   {Object}    可选项
 */
template.AOTcompile = function (id, source, options) {

    testId(id);

    // 是否嵌入完整模板引擎，嵌入后将把模板保存为字符串
    var isEngine = options.engine;

    // 是否为编译为调试版本
    var isDebug = options.debug;

    // 编译的模块类型
    var type = options.type;

    // 运行时模块别名
    var runtime = options.runtime;

    var RUNTIME = 'template';
    var code = '';
    var render = compile(id, source, isDebug);
    var requires = parseDependencies(render);
    var isLogic = testTemplateSyntax(source);
    var dir = dirname(id);

    var isHTML = isEngine || !isLogic;
    

    if (isHTML) {
        code = isDebug ? source : compressHTML(source);
        code = stringify(code);
    } else {
        code = render.replace(ANONYMOUS_RE, 'function');
    }


    // 计算主入口相对于当前模板路径
    var getRuntime = function () {
        if (runtime) {
            return runtime;
        }
        var prefix = './';
        var length = dir.split('/').length - 2;
        if (length) {
            prefix = (new Array(length + 1)).join('../');
        }
        return prefix + RUNTIME;
    };


    // 生成 requires 函数依赖声明代码
    var getRequireCode = function () {
        var requiresCode = [];
        
        requires.forEach(function (id) {
            requiresCode.push("require('" + id + "');");
        });

        return requiresCode.join('\n');
    };


    switch (type || '') {

        // TemplateJS 模块格式
        case '':
        case 'templatejs':

            code = "template('" + id + "'," + code + ");";
            break;


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

            throw {
                id: id,
                name: 'Type Error',
                message: 'Unsupported type: ' + type
            };

    }


    return {

        // 编译结果
        code: code,

        // 依赖的子模板
        requires: requires.map(function (subId) {
            testId(subId, id);
            return resolve(dir + subId);
        })

    };

};

module.exports = template;
/*!
 * atc - Template Compiler
 * https://github.com/cdc-im/atc
 * Released under the MIT, BSD, and GPL Licenses
 */

'use strict';


var template = require('./lib/template.js');
var js_beautify = require('./lib/beautify.js');
var path = require('path');
var fs = require('fs');



var atc = {

    version: 'v1.0.3',

    options: {

        // 模板目录
        path: null,

        // 编译输出目录（默认等于 path）
        output: null,

        // 编译后的模块类型，可选：AMD | CommonJS
        // CMD 模块支持RequireJS与SeaJS这两种模块加载器
        type: 'CMD',

        // 模板编码
        charset: 'utf-8',

        // 是否监控模板目录即时编编译
        watch: false,

        // 是否克隆辅助方法到编译后的模板中
        cloneHelpers: false,

        // 是否使用简洁的模板语法进行编译
        defineSyntax: true

    },


    // 过滤不符合命名规范的目录与模板
    FILTER_RE: /[^\w\.\-$]/,

    // 模板文件后缀
    EXTNAME_RE: /\.(html|htm|tpl)$/i,

    // 公用的辅助模块名字
    HELPERSNAME: '$helpers.js',


    Module: (function () {

        template.isCompress = true;

        // 提取include模板
        var REQUIRE_RE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*include|(?:^|[^$])\binclude\s*\(\s*(["'])(.+?)\1\s*(,\s*(.+?)\s*)?\)/g; //"
        var SLASH_RE = /\\\\/g

        var parseDependencies = function (code) {
            var ret = [];
            var uniq = {};

            code
            .replace(SLASH_RE, "")
            .replace(REQUIRE_RE, function(m, m1, m2) {
                if (m2 && !uniq.hasOwnProperty(m2)) {
                    ret.push(m2);
                    uniq[m2] = true;
                }
            });

          return ret
        };


        // 1. 相对路径需要以“.”前缀开头
        // 2. 无需后缀名
        var fixPath = function (dir) {
            dir = dir
            .replace(/\\/g, '/')
            .replace(/\.js$/, '');

            if (!/^(\.)*?\//.test(dir)) {
                dir = './' + dir;
            }
            return dir;
        };


        var moduleTemplate = function (data) {
            return [
            '<package_open>',
                '<dependencies>',
                'var helpers=<helpers>;',
                '<$render>',
                'var Render=<main>;',
                'Render.prototype=helpers;',
                '<exports>function(data){',
                    'return new Render(data) + "";',
                '}',
            '<package_close>'
            ].join('\n')
            .replace(/<([^>]+)>/g, function ($1, $2) {
                return data[$2] || '';
            });
        };

        var Module = function (source, helpersPath) {

            template.onerror = function (e) {
                throw e;
            };

            var render = template.compile(source);
            var helpers = render.prototype;
            var renderCode = render.toString()
            .replace(/^function\s+anonymous/, 'function');
      
            
            this.helpers = helpers;
            this.dependencies = parseDependencies(renderCode);
            this.helpersPath = helpersPath;
            this.renderCode = renderCode;
            this.source = source;

        };

        // 输出辅助方法源码
        Module.helpersToSource = (function () {

            var getType = function (obj) {
                var toString = Object.prototype.toString;
                return obj === null
                ? "Null" : obj === undefined
                ? "Undefined" : toString.call(obj).slice(8, -1);
            };

            var toSource = function (obj) {
                var type = getType(obj);
                var string = '';
                var temp;

                switch (type) {
                    case 'Object':

                        temp = [];

                        for (var name in obj) {
                            temp.push(
                                JSON.stringify(name) + ':' + toSource(obj[name])
                            );
                        }

                        string =  '{' + temp.join(',') + '}';

                        break;
                    case 'Array':
                        temp = [];
                        var length = obj.length;

                        while (length) {
                            temp[--length] = toSource(obj[length]);
                        }

                        string = '[' + temp.join(',') + ']';

                        break;
                    case 'String':
                        string = JSON.stringify(obj);
                        break;
                    case 'Undefined':
                        string = 'undefined';
                        break;
                    case 'Boolean':
                    case 'Number':
                    case 'Null':
                        string = obj + '';
                        break;
                    case 'Function':

                        temp = obj
                        .toString()
                        .match(/^function\s*(\w+)\s*\(\)\s*\{\s*\[native\s*code\]\s*\}$/);

                        if (temp) {
                            string = temp[1];
                        } else {
                            string = obj + '';
                        }

                        break;
                    // Namespace
                    default:
                        string = type;
                }

                return string;
            };


            return function (isAsync, helpers) {
                helpers = helpers || template.prototype;

                if (isAsync) {
                    
                    helpers['$create'] = function () {
                        function F() {};
                        F.prototype = this;
                        return new F;
                    };
                }

                delete helpers['$render'];

                return toSource(helpers);
            };
        })();

        Module.prototype = {

            toCMD: function () {
                return this.toCommonJS(true);
            },


            toCommonJS: function (isAsync) {


                if (this.source.indexOf(template.openTag) === -1) {

                    var modMain = 'function(){'
                    +   "return '" + this.source
                        .replace(/[\n\r\t\s]+/g, ' ')
                        .replace(/('|\\)/g, '\\$1') + "';"
                    +'}';

                    if (isAsync) {
                        return 'define(function(){'
                        +   'return ' + modMain
                        + '})';
                    } else {
                        return 'module.exports=' + modMain;
                    }
                }

                var dependencies = this.dependencies;
                var renderCode = this.renderCode;
                var helpers = this.helpers;
                var helpersPath = fixPath(this.helpersPath);
                var data = {};


                if (helpersPath) {
                    data['helpers'] = 'require(' + JSON.stringify(helpersPath) + ')';
                    data['helpers'] += (isAsync ? ".$create()" : "");
                } else {
                    data['helpers'] = Module.helpersToSource(isAsync, helpers);
                }

    
                if (dependencies.length) {

                    var dependenciesCode = [];

                    dependencies.forEach(function (file) {
                        dependenciesCode.push(
                            JSON.stringify(file) + ':' + 'require(' + JSON.stringify(fixPath(file)) + ')'
                        );
                    });

                    dependenciesCode = '{' + dependenciesCode.join(',') + '}';

                    data['dependencies'] = 'var dependencies=' + dependenciesCode + ';';

                    data['$render'] = [
                    'helpers.$render=function(id,data){',
                        'return dependencies[id](data);',
                    '};'
                    ].join('');
                }

                data['main'] = renderCode;
                
                if (isAsync) {
                    data['exports'] = 'return ';
                    data['package_open'] = 'define(function(require){';
                    data['package_close'] = '})';
                } else {
                    data['exports'] = 'module.exports=';
                } 

                return moduleTemplate(data);
            },

            toAMD: function () {

                if (this.source.indexOf(template.openTag) === -1) {
                    return 'define(function(){'
                    +   'return function(){'
                    +       "return '" + this.source
                            .replace(/[\n\r\t\s]+/g, ' ')
                            .replace(/('|\\)/g, '\\$1') + "';"
                    +   '}'
                    + '})';
                }

                var dependencies = this.dependencies;
                var renderCode = this.renderCode;
                var helpers = this.helpers;
                var helpersPath = fixPath(this.helpersPath);
                var isInclude = dependencies.length;
                var data = {};
                var paths = '';
                var names = '';


                if (helpersPath) {
                    dependencies.push(helpersPath);
                    data['helpers'] = '$' + (dependencies.length - 1) + '.$create()';
                } else {
                    data['helpers'] = Module.helpersToSource(true, helpers);
                }

                
                dependencies.forEach(function (file, index, array) {
                    array[index] = fixPath(file);
                });
                

                if (dependencies.length) {

                    paths = JSON.stringify(dependencies) + ',';
                    names = Object
                    .keys(dependencies)
                    .join(',')
                    .replace(/(\d+)/g, '$$$1');

                }

                if (isInclude) {
                    var dependenciesCode = [];

                    dependencies.forEach(function (file, index) {
                        if (file !== helpersPath) {
                            dependenciesCode.push(
                                JSON.stringify(file) + ':$' + index
                            );
                        }
                    });

                    dependenciesCode = '{' + dependenciesCode.join(',') + '}';

                    data['dependencies'] = 'var dependencies=' + dependenciesCode + ';';

                    data['$render'] = [
                    'helpers.$render=function(id,data){',
                        'return dependencies[id](data)',
                    '};'
                    ].join('');
                }

                data['main'] = renderCode;
                data['exports'] = 'return ';
                data['package_open'] = 'define('+ paths + 'function(' + names + '){';
                data['package_close'] = '})';
                
                return moduleTemplate(data);
            }
        };

        return Module;

    })(),


    // 加载模板语法设置
    _loadSyntax: function () {
        var code = fs.readFileSync(__dirname + '/lib/template-syntax.js', 'utf-8');
        eval(code);
    },

    
    // 格式化JS
    _format: function(code) {

        if (typeof js_beautify !== 'undefined') {

            js_beautify =
            typeof js_beautify === 'function'
            ? js_beautify
            : js_beautify.js_beautify;

            var config = {
                indent_size: 4,
                indent_char: ' ',
                preserve_newlines: true,
                braces_on_own_line: false,
                keep_array_indentation: false,
                space_after_anon_function: true
            };

            code = js_beautify(code, config);
        }

        return code;
    },


    /** 输出辅助方法 */
    _writeHelpers: function () {

        var isAsync = !/^CommonJS$/i.test(this.options['type']);
        var helpers = this.Module.helpersToSource(isAsync);

        if (isAsync) {
            helpers = 'define(' + helpers + ')';
        } else {
            helpers = 'module.exports=' + helpers; 
        }

        helpers = this._format(helpers);

        this._fsWrite(this._output  + '/' + this.HELPERSNAME, helpers);
    },


    // 绑定文件监听事件
    _onwatch: function (dir, callback) {

        var that = this;
        var watchList = {};
        var timer = {};

        function walk (dir) {
            fs.readdirSync(dir).forEach(function (item) {
                var fullname = dir + '/' + item;
                if (fs.statSync(fullname).isDirectory()){
                    watch(fullname);
                    walk(fullname);
                }
            });
        };

        // 排除“.”、“_”开头或者非英文命名的目录
        function filter (name) {
            return !that.FILTER_RE.test(name);
        };

        function watch (parent) {

            var target = path.basename(parent);

            if (!filter(target)){
                return;
            }

            if (watchList[parent]) {
                watchList[parent].close();
            }

            watchList[parent] = fs.watch(parent, function (event, filename) {

                var fullname = parent + '/' + filename;
                var type;
                var fstype;

                if (!filter(filename)) {
                    return;
                }

                // 检查文件、目录是否存在
                if (!fs.existsSync(fullname)) {

                    // 如果目录被删除则关闭监视器
                    if (watchList[fullname]) {
                        fstype = 'directory';
                        watchList[fullname].close();
                        delete watchList[fullname];
                    } else {
                        fstype = 'file';
                    }

                    type = 'delete';

                } else {

                    // 文件
                    if (fs.statSync(fullname).isFile()) {

                        fstype = 'file';
                        type = event == 'rename' ? 'create' : 'updated'

                    // 文件夹
                    } else if (event === 'rename') {

                        fstype = 'directory';
                        type = 'create'
                        watch(fullname);
                        walk(fullname);
                    }

                }

                var eventData = {
                    type: type,
                    target: filename,
                    parent: parent,
                    fstype: fstype
                };

                
                if (/windows/i.test(require('os').type())) {
                    // window 下 nodejs fs.watch 方法尚未稳定
                    clearTimeout(timer[fullname]);
                    timer[fullname] = setTimeout(function() {
                        callback(eventData);
                    }, 16);

                } else {
                    callback(eventData);
                }


            });

        };

        watch(dir);
        walk(dir);
    },


    // 筛选模板文件
    _filter: function (name) {
        return !this.FILTER_RE.test(name) && this.EXTNAME_RE.test(name);
    },


    // 模板文件写入
    _fsWrite: function (file, data) {

        this._fsMkdir(path.dirname(file));

        return fs.writeFileSync(file, data, this.options['charset']);
    },


    // 模板文件读取
    _fsRead: function (file) {
        return fs.readFileSync(file, this.options['charset']);
    },


    // 创建目录
    _fsMkdir: function (dir) {

        var currPath = dir;
        var toMakeUpPath = [];

        while (!fs.existsSync(currPath)) {
            toMakeUpPath.unshift(currPath);
            currPath = path.dirname(currPath);
        }

        toMakeUpPath.forEach(function (pathItem) {
            fs.mkdirSync(pathItem);
        });

    },


    // 删除模板文件
    _fsUnlink: function (file) {
        return fs.existsSync(file) && fs.unlink(file);
    },


    // 编译单个模板
    _compile: function (file) {

        var name = null;
        var that = this;

        // 计算辅助方法模块的相对路径
        if (!this.options['cloneHelpers']) {
            name = this.HELPERSNAME;
            var dirname = path.dirname(file);
            var join = path.join(this._path , name);
            name = path.relative(dirname, join);
        }

        var source = this._fsRead(file);
        var target = file
        .replace(this.EXTNAME_RE, '.js')
        .replace(this._path , this._output);

        var info = file.replace(this._path, '');

        this._log('Compile: [green]' + this.options['path'] + info + '[/green]');

        try {
            
            var mod = new this.Module(source, name);

            if (/^CommonJS$/i.test(this.options['type'])) {
                mod = mod.toCommonJS();
            } else {
                mod = mod['to' + this.options['type']]();
            }


            mod = this._format(mod);
            this._fsWrite(target, mod);
            
            info = info.replace(this.EXTNAME_RE, '.js');
            this._log('[grey] > ' + this.options['output'] + info + '[/grey]\n');

        } catch (e) {

            this._log(' [inverse][red]' + e.name + '[/red][/inverse]\n');
            this._debug(e);

        }
    },


    // 调试语法错误
    _debug: function (error) {

        var code = this._format(error.temp);
        var debugFile = this._output + '/.debug.js';
        
        try {
            this._fsWrite(debugFile, code);
            require(debugFile);
        } catch (e) {
            console.log('Temp source:');
            console.log(code);
            this._fsUnlink(debugFile);
            throw error;
        }
    },


    // 在控制台显示日志(支持UBB)
    _log: function (message) {
        var styles = {
            // styles
            'bold'      : ['\x1B[1m',  '\x1B[22m'],
            'italic'    : ['\x1B[3m',  '\x1B[23m'],
            'underline' : ['\x1B[4m',  '\x1B[24m'],
            'inverse'   : ['\x1B[7m',  '\x1B[27m'],
            // colors
            'white'     : ['\x1B[37m', '\x1B[39m'],
            'grey'      : ['\x1B[90m', '\x1B[39m'],
            'black'     : ['\x1B[30m', '\x1B[39m'],
            'blue'      : ['\x1B[34m', '\x1B[39m'],
            'cyan'      : ['\x1B[36m', '\x1B[39m'],
            'green'     : ['\x1B[32m', '\x1B[39m'],
            'magenta'   : ['\x1B[35m', '\x1B[39m'],
            'red'       : ['\x1B[31m', '\x1B[39m'],
            'yellow'    : ['\x1B[33m', '\x1B[39m']
        };

        styles['b'] = styles['bold'];
        styles['i'] = styles['italic'];
        styles['u'] = styles['underline'];

        message = message.replace(/\[([^\]]*?)\]/igm, function ($1, $2) {
            return $2.indexOf('/') === 0
            ? styles[$2.slice(1)][1]
            : styles[$2][0];
        });

        process.stdout.write(message);
    },


    // 监听模板的修改进行即时编译
    _watch: function () {

        var that = this;

        // 监控模板目录
        this._onwatch(this._path , function (event) {
            var type = event.type;
            var fstype = event.fstype;
            var target = event.target;
            var parent = event.parent;
            var fullname = parent + '/' + target;

            if (target && fstype === 'file' && that._filter(target)) {

                if (type === 'delete') {

                    fullname = fullname.replace(that.EXTNAME_RE, '');
                    that._fsUnlink(fullname.replace(that._path , that._output) + '.js');

                } else if (type === 'updated' || type === 'create') {
                    
                    try {
                        that._compile(fullname);
                    } catch (e) {}

                }
            }
        });

        this._log('\n[inverse]Waiting..[/inverse]\n\n');

    },


    /**
     * 编译模板
     * @param   {String}    模板文件路径，无此参数则编译目录所有模板
     */
    compile: function (file) {

        var that = this;

        if (file) {
            this._compile(file);
        }

        var walk = function (dir) {
            var dirList = fs.readdirSync(dir);

            dirList.forEach(function (item) {
                if (fs.statSync(dir + '/' + item).isDirectory()) {
                    walk(dir + '/' + item);
                } else if (that._filter(item)) {
                    that._compile(dir + '/' + item);
                }
            });

        };

        walk(this._path);
    },


    init: function (options) {

        for (var name in options) {
            this.options[name] = options[name];
        }

        options = this.options;

        options['type'] = options['type'].toUpperCase();
        options['charset'] = options['charset'].toLowerCase();

        // 标准化路径：去掉末尾斜杠
        options['path'] = options['path'].replace(/[\/\\]$/, '');
        options['output'] = (options['output'] || options['path']).replace(/[\/\\]$/, '');

        
        // 转换成绝对路径
        this._path = path.resolve(options['path']).replace(/[\/\\]$/, '');
        this._output = path.resolve(options['output']).replace(/[\/\\]$/, '');


        // 加载引擎语法配置
        options['defineSyntax'] && this._loadSyntax();


        // 输出公用模块
        !options['cloneHelpers'] && this._writeHelpers();


        // 监控模板修改进行即时编译
        options['watch'] && this._watch();

        return this;
    }

};


module.exports = atc;

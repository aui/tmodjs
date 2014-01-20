/*!
 * TmodJS - AOT Template Compiler
 * https://github.com/aui/tmodjs
 * Released under the MIT, BSD, and GPL Licenses
 */

'use strict';

var version = require('../package.json').version;
var template = require('./AOTcompile.js');
var uglifyjs = require('./uglify.js');
var stdout = require('./stdout.js');
var watch = require('./watch.js');
var path = require('./path.js');

var fs = require('fs');
var vm = require('vm');
var events = require('events');
var crypto = require('crypto');
var exec = require('child_process').exec;

var engineDirname = path.dirname(require.resolve('art-template'));



var RUNTIME = 'template';
var FILTER_RE = /[^\w\.\-$]/;
var EXTNAME_RE = /\.(html|htm|tpl)$/i;

var log = function (message) {
    console.log(message);
};


module.exports = {

    __proto__: events.EventEmitter.prototype,


    // 默认配置
    // 用户配置将保存到模板根目录 package.json 文件中
    defaults: {

        // 编译输出目录设置
        output: './build',

        // 模板使用的编码。（注意：非 utf-8 编码的模板缺乏测试）
        charset: 'utf-8',

        // 定义模板采用哪种语法，内置可选：
        // simple: 默认语法，易于读写。可参看语法文档
        // native: 功能丰富，灵活多变。语法类似微型模板引擎 tmpl
        // 或者指定语法解析器路径，参考：
        // https://github.com/aui/artTemplate/blob/master/src/template-syntax.js
        syntax: 'simple',

        // 自定义辅助方法路径
        helpers: null,

        // 是否过滤 XSS
        // 如果后台给出的数据已经进行了 XSS 过滤，就可以关闭模板的过滤以提升模板渲染效率
        escape: true,

        // 是否嵌入模板引擎，否则编译为不依赖引擎的纯 js 代码
        // 选择嵌入模板引擎后，模板以字符串存储并浏览器中执行编译
        engine: false,

        // 输出的模块类型，可选：
        // default:  模板目录将会打包后输出，可使用 script 标签直接引入，也支持 NodeJS/RequireJS/SeaJS。
        // cmd:         这是一种兼容 RequireJS/SeaJS 的模块（类似 atc v1版本编译结果）
        // amd:         支持 RequireJS 等流行加载器
        // commonjs:    编译为 NodeJS 模块
        type: 'default',

        // 运行时别名
        // 仅针对于非 default 的类型模块
        alias: null,

        // 是否合并模板
        // 仅针对于 default 类型的模块
        combo: true,

        // 是否输出为压缩的格式
        minify: true

    },


    // 获取用户配置
    getUserConfig: function () {

        var options = arguments[0];

        if (!options) {
            return this.options;
        }

        var base = this.base;
        var file = base + '/package.json';
        var defaults = this.defaults;
        var json = null;
        var name = null;
        var config = {};


        // 读取目录中 package.json
        if (fs.existsSync(file)) {
            var fileContent = fs.readFileSync(file, 'utf-8');

            if (fileContent) {
                json = JSON.parse(fileContent);
            }
        }


        if (!json) {

            json = {
                "name": 'template',
                "version": '1.0.0',
                "dependencies": {
                    "tmodjs": "0"
                },
                "tmodjs-config": {}
            };

        }


        // 模板工程依赖的的 TomdJS 版本号与当前版本对比
        (function (a, b) {
            a = a.replace('~', '').split('.');
            b = b.replace('~', '').split('.');

            for (var i = 0, an, bn; i < a.length; i ++) {
                bn = Number(b[i]);
                an = Number(a[i]);

                if (bn > an) {
                    b = 1;
                    a = 0;
                    break;
                }

                if (an > bn) {
                    b = 0;
                    a = 1;
                    break;
                }
            }

            if (a > b) {
                console.error('You must upgrade to the latest version of TmodJS!');
                process.exit(1);
            }
        })(json.dependencies.tmodjs, version);


        json.dependencies.tmodjs = '~' + version;

        
        // 默认配置 优先级：0
        for (name in defaults) {
            config[name] = defaults[name];
        }


        // 项目配置 优先级：1
        for (name in json['tmodjs-config']) {
            config[name] = json['tmodjs-config'][name];
        }
        

        // 用户配置 优先级：2
        for (name in options) {
            config[name] = options[name];
        }


        json['tmodjs-config'] = config;
        this['package.json'] = json;

        this._fixConfig(config);


        return config;
    },


    /**
     * 保存用户配置
     * @return  {String}    用户配置文件路径
     */
    saveUserConfig: function () {

        var file = this.base + '/package.json';
        var configName = 'tmodjs-config';
        var json = this['package.json'];

        var options = json[configName];
        var userConfigList = Object.keys(this.defaults);


        // 只保存指定的字段
        json[configName] = JSON.parse(
            JSON.stringify(options, userConfigList)
        );


        var text = JSON.stringify(json, null, 4);

        
        fs.writeFileSync(file, text, 'utf-8');

        return file;
    },


    // 修正配置-向前兼容
    _fixConfig: function (config) {

        // 忽略大小写
        config.type = config.type.toLowerCase();


        // 模板合并规则
        // 兼容 0.0.3-rc3 之前的配置
        if (Array.isArray(config.combo) && !config.combo.length) {
            config.combo = false;
        } else {
            config.combo = !!config.combo;
        }


        // 兼容 0.1.0 之前的配置
        if (config.type === 'templatejs') {
            config.type = 'default';
        }


        // 根据生成模块的类型删除不支持的配置字段
        if (config.type === 'default') {
            delete config.alias;
        } else {
            delete config.combo;
        }

        return config;
    },


    // 筛选模板文件
    _filter: function (name) {
        return !FILTER_RE.test(name) && EXTNAME_RE.test(name);
    },


    // 文件写入
    _fsWrite: function (file, data, charset) {
        this._fsMkdir(path.dirname(file));
        fs.writeFileSync(file, data, charset || 'utf-8');
    },


    // 文件读取
    _fsRead: function (file, charset) {
        if (fs.existsSync(file)) {
            return fs.readFileSync(file, charset || 'utf-8');
        }  
    },


    // 创建目录，包括子文件夹
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


    // 删除文件夹，包括子文件夹
    _fsRmdir: function (dir) {

        var walk = function (dir) {

            if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
                return;
            }

            var files = fs.readdirSync(dir);
            
            if (!files.length) {
                fs.rmdirSync(dir);
                return;
            } else {
                files.forEach(function (file) {
                    var fullName = path.join(dir, file);
                    if (fs.statSync(fullName).isDirectory()) {
                        walk(fullName);
                    } else {
                        fs.unlinkSync(fullName);
                    }
                });
            }

            fs.rmdirSync(dir);
        };

        walk(dir);
    },


    // 删除模板文件
    _fsUnlink: function (file) {
        return fs.existsSync(file) && fs.unlinkSync(file);
    },


    // 获取字符串 md5 值
    _getMd5: function (text) {
        return crypto.createHash('md5').update(text).digest('hex');
    },


    // 获取元数据
    _getMetadata: function (js) {
        var data = js.match(/\/\*TMODJS\:(.*?)\*\//);
        if (data) {
            return JSON.parse(data[1]);
        }
    },


    // 删除元数据
    _removeMetadata: function (js) {
        var data = this._getMetadata(js) || {};
        var newText = '';

        // 文件末尾设置一个空注释，然后让 UglifyJS 不压缩它，避免很多文件挤成一行
        if (data.version) {
            newText = '/*v:' + data.version + '*/';
        }
        
        return js.replace(/^\/\*TMODJS\:[\w\W]*?\*\//, newText);
    },


    // 设置元数据
    _setMetadata: function (js, data) {
        data = JSON.stringify(data || {});
        js = '/*TMODJS:' + data + '*/\n' + js
        .replace(/\/\*TMODJS\:(.*?)\*\//, '');
        return js;
    },


    // 调试语法错误
    _debug: function (error, callback) {

        var debugFile = error.debugFile;
        var code = error.temp;

        code = "/*! <DEBUG:" + error.id + '> */\n' + code;

        this._fsWrite(debugFile, code, this.options.charset);
        
        // 启动子进程进行调试，从根本上避免影响当前进程
        
        exec('node ' + debugFile, {timeout: 0}, function (error, stdout, stderr) {
            var message = error ? error.message : '';
            message = message
            .replace(/^Command\sfailed\:|\s*SyntaxError[\w\W]*$/g, '')
            .trim();
            callback(message);
        });

    },


    // 编译运行时
    _buildRuntime: function (templates, metadata) {

        metadata = metadata || {};

        var placeholder = '/*#templates#*/';
        var output = path.join(this.output, RUNTIME + '.js');
        var data = this._runtime;
        var runtime;


        if (!data) {

            runtime = fs.readFileSync(
                __dirname + (
                    this.options.engine
                    ? '/runtime/full.js'
                    : '/runtime/basic.js'
                )
            , 'utf-8');

            data = {
                helpers: this._helpersCode,
                templates: templates || placeholder,
                syntax: '',
                engine: ''
            };


            // 嵌入引擎
            if (this.options.engine) {
                data.engine = fs.readFileSync(
                    engineDirname + '/template.js'
                , 'utf-8');
                data.syntax = this._syntaxCode;
            }


            runtime = runtime
            .replace(/['"]<\:(.*?)\:>['"]/g, function ($1, $2) {
                return data[$2] || '';
            });


            runtime = this._setMetadata(runtime, metadata);


            data.runtime = runtime;
            this._runtime = data;

        } else {

            runtime = data.runtime.replace(placeholder, templates);
            runtime = this._setMetadata(runtime, metadata);

        }

        this._fsWrite(output, runtime, this.options.charset);

        if (this.options.debug || !this.options.minify) {
            uglifyjs.beautify(output);
        } else {
            uglifyjs.minify(output);
        }

        return runtime;
    },


    // 打包模板
    _combo: function () {

        var that = this;
        var files = [];
        var mod = null;
        var combo = '';
        var build = Date.now();

        this._getCacheKeys().forEach(function (id) {
            var code = that._getCache(id, 'output');

            // 如果之前编译失败，可能没有缓存值
            // TODO: 这里写兼容逻辑有点猥琐，待改进
            if (!code) {
                if (that._compile(id)) {}
                code = that._getCache(id, 'output');
            }

            code = that._removeMetadata(code);
            combo += code;

            files.push(id); 
        });

        mod = this._buildRuntime(combo, {
            debug: this.options.debug,
            build: build
        });
        

        // 广播：合并事件
        this.emit('combo', {

            // 编译时间
            build: build,

            // 打包的代码
            output: mod,

            // 输出的文件路径
            outputFile: path.join(this.output, RUNTIME + '.js'),

            // 被合并的文件列表
            sourcefiles: files

        });
    },


    /**
     * 监听模板的修改进行即时编译
     */
    watch: function () {

        this.emit('watchStart', {});

        // 监控模板目录
        this.on('watch', function (data) {

            var type = data.type;
            var fstype = data.fstype;
            var target = data.target;
            var parent = data.parent;
            var fullname = parent + '/' + target;


            if (target && fstype === 'file' && this._filter(target)) {

                if (type === 'delete') {

                    this.emit('delete', {
                        id: this._toId(target),
                        sourceFile: target
                    });
                    fullname = fullname.replace(EXTNAME_RE, '');
                    this._fsUnlink(fullname.replace(this.base, this.output) + '.js');

                    this._removeCache(target);

                    if (this.options.combo) {
                        this._combo();
                    }

                } else if (/updated|create/.test(type)) {
                    
                    this.emit('change', {
                        id: this._toId(target),
                        sourceFile: target
                    });

                    if (this._compile(fullname)) {
                        if (this.options.combo) {
                            this._combo();
                        }
                    }

                }
            }

        });

    },


    // 路径转换为模板 ID
    _toId: function (file) {
        var id = file.replace(this.base + '/', '');
        var extname = id.match(EXTNAME_RE)[1];
        id = id.replace(EXTNAME_RE, '');
        return id;
    },


    // 编译单个模板
    _compile: function (file) {

        // 模板字符串
        var source = this._fsRead(file, this.options.charset);

        // 目标路径
        var target = file
        .replace(EXTNAME_RE, '.js')
        .replace(this.base, this.output);
        
        var mod = this._getCache(file, 'output');
        var modObject = {};
        var metadata = {};
        var count = 0;
        var error = true;
        var errorInfo = null;
        var isDebug = this.options.debug;
        var isCacheDir = this.options.combo;
        var newMd5 = this._getMd5(source + JSON.stringify(this['package.json']));

        // 如果开启了合并，编译后的文件使用缓存目录保存
        if (isCacheDir) {
            target = target.replace(this.output, this.output + '/.cache');
        }


        // 尝试从文件中读取上一次编译的结果
        if (!mod && fs.existsSync(target)) {
            mod = this._fsRead(target, this.options.charset);
        }


        // 获取缓存的元数据
        if (mod) {
            metadata = this._getMetadata(mod) || {};
            count = metadata.version || 0;
        }


        // 检查是否需要编译
        var isChange = !mod             // 从来没有编译过
        || metadata.debug               // 上个版本为调试版
        || isDebug                      // 当前配置为调试版
        || newMd5 !== metadata.md5;     // 模板已经发生了修改（包括配置文件）


        // 获取模板 ID
        var id = this._toId(file);


        // 广播：模板加载事件
        this.emit('load', {

            // 模板 ID
            id: id,

            // 模板是否被修改
            isChange: isChange,

            // 原始文件路径
            sourceFile: file,

            // 模板源代码
            source: source,

            // 输出路径
            outputFile: target

        });


        try {
            
            // 编译模板
            if (isChange) {
                modObject = template.AOTcompile(id, source, {
                    alias: this.options.alias,
                    engine: this.options.engine,
                    type: this.options.type,
                    debug: isDebug
                });
                mod = modObject.code;
            }

            error = false;

        } catch (e) {
            errorInfo = e;
            
        }


        // 不输出的情况：遇到错误 || 文件或配置没有更新
        if (!error && isChange) {

            count ++;

            mod = this._setMetadata(mod, {
                debug: isDebug,
                version: count,
                md5: newMd5
            });

            this._fsWrite(target, mod, this.options.charset);

            if (!isCacheDir) {
                if (isDebug || !this.options.minify) {
                    uglifyjs.beautify(target);
                } else {
                    uglifyjs.minify(target);
                }
            }
            
        }


        var compileInfo = {

            // 模板 ID
            id: id,

            // 版本
            version: count,

            // 源码
            source: source,

            // 模板文件路径
            sourceFile: file,

            // 编译结果代码
            output: mod,

            // 编译输出文件路径
            outputFile: target,

            // 是否被修改
            isChange: isChange,

            // 是否遇到错误
            error: error,

            // 依赖的子模板 ID 列表
            requires: modObject.requires || []
        };

        
        if (error) {

            if (errorInfo.source) {
                
                // 规范错误，模板编译器通常能够给出错误源

                this.emit('compileError', errorInfo);

            } else {

                // 语法错误，目前只能对比生成后的 js 来查找错误的模板语法

                errorInfo.debugFile = this.base + '/.debug.js';

                this.debuging = true;

                this._debug(errorInfo, function (message) {

                    var e = {

                        // 错误名称
                        name: errorInfo.name,

                        // 报错信息
                        message: message,

                        // 调试文件地址
                        debugFile: errorInfo.debugFile,

                        // 编译器输出的临时文件
                        temp: errorInfo.temp

                    };

                    for (var name in compileInfo) {
                        e[name] = compileInfo[name];
                    }

                    // 模板编译错误事件
                    this.emit('compileError', e);

                }.bind(this));
            }

            
        } else {

            // 模板编译成功事件
            this.emit('compile', compileInfo);

            // 删除上次遗留的调试文件
            if (this.debuging) {
                this._fsUnlink(this.base + '/.debug.js');
                delete this.debuging;
            }

            // 缓存编译好的模板
            this._setCache(file, 'output', mod);

            // 缓存源文件
            this._setCache(file, 'source', source);
            
        }



        if (error) {
            return false;
        } else {
            return compileInfo;
        } 
    },


    /**
     * 编译模板
     * @param   {String}    模板文件路径，无此参数则编译目录所有模板
     * @param   {Boolean}   是否递归编译 include 依赖
     */
    compile: function (file, recursion) {

        var that = this;
        var error = false;
        var length = 0;

        this.emit('compileStart', {});


        if (file) {

            var extname = path.extname(file);

            var walk = function (list) {

                list.forEach(function (file) {

                    if (error) {
                        return;
                    }

                    var info = that._compile(file);

                    error = !info;

                    if (!error) {
                        length ++;
                        if (!error && recursion !== false && info.requires.length) {

                            list = info.requires.map(function (id) {
                                var target = path.resolve(that.base, id + extname);
                                return target;
                            });

                            walk(list);

                        }
                    }
                    
                });
            };

            walk(typeof file === 'string' ? [file] : file);

            if (!error && this.options.combo) {
                this._combo();
            }

        } else {

            var list = this._getCacheKeys();

            for (var i = 0; i < list.length; i ++) {
                if (error = !that._compile(list[i])) {
                    break;
                } else {
                    length ++;
                }
            }

            if (!error && this.options.combo) {
                this._combo();
            }

        }


        this.emit('compileEnd', {
            error: error,
            length: length
        });

    },


    // 计算字节长度
    _getByteLength: function (content) {
        return content.replace(/[^\x00-\xff]/gi, '--').length;
    },


    // 获取缓存
    _getCache: function (id, name) {
        var cache = this._cache;

        if (typeof id === 'undefined') {
            return cache;
        } else {
            cache = cache[id];

            if (typeof name === 'undefined') {
                return cache;
            } else if (cache) {
                return cache[name];
            } 
        }
    },


    // 获取所有缓存 id
    _getCacheKeys: function () {
        return Object.keys(this._cache);
    },


    // 设置缓存
    _setCache: function (id, name, data) {
        var cache = this._cache;

        if (typeof data === 'undefined') {
            data = name;
            cache[id] = data;
        } else {

            cache = cache[id];
            if (!cache) {
                cache = this._cache[id] = {};
            }

            cache[name] = data;
        }
    },


    // 删除缓存
    _removeCache: function (id, name) {
        var cache = this._cache;

        if (typeof name === 'undefined') {
            delete cache[id];
        } else if (cache[id]) {
            delete cache[id][name];
        }
    },


    // 清除全部缓存
    _clearCache: function () {
        this._cache = {};
    },


    // 初始化缓存
    _initCache: function () {
        var that = this;
        var cache = this._cache = {};
        var charset = this.options.charset;
        var bo = this.base === this.output;

        var walk = function (dir) {
            
            if (!bo && dir === that.output) {
                return;
            }

            var dirList = fs.readdirSync(dir);
            
            dirList.forEach(function (item) {

                if (fs.statSync(dir + '/' + item).isDirectory()) {
                    walk(dir + '/' + item);
                } else if (that._filter(item)) {
                    var source = fs.readFileSync(dir + '/' + item, charset);
                    that._setCache(dir + '/' + item, 'source', source);
                }
                
            });
        };


        walk(this.base);
    },


    // 初始化模板引擎
    _initEngine: function () {
        var options = this.options;

        // 配置模板引擎：过滤数据中的 HTML
        template.isEscape = options.escape;


        // 配置模板引擎：辅助方法
        if (options.helpers) {

            var helpersFile = path.resolve(this.base, options.helpers);
            
            if (fs.existsSync(helpersFile)) {

                this._helpersCode = fs.readFileSync(helpersFile, 'utf-8');
                vm.runInNewContext(this._helpersCode, {
                    template: template
                });

            } else {

                stdout('[red]Not found: ' + helpersFile + '[/red]');
                process.exit(1);

            }
        }


        // 配置模板引擎：模板语法
        if (options.syntax && options.syntax !== 'native') {

            var syntaxFile = options.syntax  === 'simple'
            ? engineDirname + '/template-syntax.js'
            : path.resolve(this.base, options.syntax);

            if (fs.existsSync(syntaxFile)) {

                this._syntaxCode = fs.readFileSync(syntaxFile, 'utf-8');
                vm.runInNewContext(this._syntaxCode, {
                    template: template
                });

            } else {

                stdout('[red]Not found: ' + syntaxFile + '[/red]');
                process.exit(1);

            }
        }  
    },


    // 清理项目临时文件
    _clear: function () {

        // 删除上次遗留的调试文件
        this._fsUnlink(this.base + '/.debug.js');


        // 删除不必要的缓存目录
        if (!this.options.combo) {
            this._fsRmdir(this.output + '/.cache');
        }

    },


    init: function (input, options) {

        stdout('[inverse]TmodJS[/inverse] - Template Compiler' + '\n');
        stdout('[grey]http://aui.github.io/tmodjs[/grey]\n');


        // 模板项目路径
        this.base = path.resolve(input);


        // 项目配置选项
        this.options = options = this.getUserConfig(options);


        // 输出路径
        this.output = path.resolve(this.base, options.output);


        // 清理模板项目临时文件
        this._clear();


        // 初始化模板引擎
        this._initEngine();


        // 初始化缓存系统
        this._initCache();


        // 输出运行时
        this._buildRuntime();


        // 初始化事件系统
        events.EventEmitter.call(this);


        // 初始化 watch 事件，插入兼容钩子
        this.on('newListener', function (event, listener) {

            if (watch && event === 'watch') {

                watch(this.base, function (data) {
                    this.emit('watch', data);
                }.bind(this), function (name) {

                    // 排除“.”、“_”开头或者非英文命名的子目录
                    return !FILTER_RE.test(name) && name !== this.output;

                }.bind(this), fs);

                watch = null;
            }

        });


        this.on('watchStart', function () {
            setTimeout(function () {
                stdout('\n[green]Watching..[/green] [grey](quit watch: control + c)[/grey]\n\n');
            }, 140);
        });


        // 监听模板修改事件
        this.on('change', function (data) {
            var time = (new Date).toLocaleTimeString();
            stdout('[grey]' + time + '[/grey]\n');
        });


        // 监听模板删除事件（Windows NodeJS 暂时无法做到）
        this.on('delete', function (data) {
            var time = (new Date).toLocaleTimeString();
            stdout('[grey]' + time + '[/grey]\n');
            stdout('[red]-[/red] ' + data.id + '\n');
        });


        // 监听模板加载事件
        this.on('load', function (data) {
            if (data.isChange) {
                stdout('[green]•[/green] ');
            } else {
                stdout('[grey]•[/grey] ');
            }
            
            stdout(data.id);
        });


        // 监听模板编译事件
        this.on('compile', function (data) {
            stdout(this.options.debug ? ' [grey]<DEBUG>[/grey]' : '');
            stdout(' [grey]:v' + data.version + '[/grey]');
            stdout('\n');
        });


        // 监听编译错误事件
        this.on('compileError', function (data) {
            stdout(' [inverse][red]Syntax Error[/red][/inverse]\n\n');

            if (data.line && data.source) {
                stdout('[red]' + data.line + ': ' + data.source + '[/red]\n');
            }

            stdout('[red]' + data.message + '[/red]\n\n');
        });


        // 监听模板合并事件
        // this.on('combo', function (data) {
        //     stdout('[grey]»[/grey] ');
        //     stdout('[grey]' + RUNTIME + '.js[/grey]');
        //     stdout('\n');
        // });

    }

};

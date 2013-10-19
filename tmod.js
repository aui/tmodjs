/*!
 * TmodJS - AOT Template Compiler
 * https://github.com/aui/tmodjs
 * Released under the MIT, BSD, and GPL Licenses
 */

'use strict';

var template = require('./lib/template-AOTcompile.js');
var uglifyjs = require("./lib/uglify.js");

var fs = require('fs');
var path = require('path');
var events = require('events');
var crypto = require('crypto');
var vm = require("vm");


// 跨平台 path 接口，统一 windows 与 linux 的路径分隔符，
// 避免不同平台模板编译后其 id 不一致
(function () {

    if (!/\\/.test(path.resolve())) {
        return path;
    }

    var oldPath = path;
    var newPath = Object.create(oldPath);
    var proxy = function (name) {
        return function () {
            var value = oldPath[name].apply(oldPath, arguments);
            if (typeof value === 'string') {
                value = value.split(oldPath.sep).join('/');
            }
            return value;
        }
    };

    for (var name in newPath) {
        if (typeof oldPath[name] === 'function') {
            newPath[name] = proxy(name);
        }
    };

    path = newPath;
})();


var RUNTIME = 'template';
var EXTNAME_RE = /\.(html|htm|tpl)$/i;
var FILTER_RE = /[^\w\.\-$]/;
var DIRNAME_RE = /[^\/]*/;


module.exports = {

    __proto__: events.EventEmitter.prototype,


    // 默认配置
    // 用户配置将保存到模板根目录 package.json 文件中
    defaults: {

        // 编译输出目录设置
        output: './build',

        // 模板使用的编码。（注意：非 utf-8 编码的模板缺乏测试）
        charset: 'utf-8',

        // 模板合并规则
        // 注意：type 参数的值为 templatejs 才会生效
        combo: ['*'],

        // 定义模板采用哪种语法，可选：
        // simple: 默认语法，易于读写。可参看语法文档
        // native: 功能丰富，灵活多变。语法类似微型模板引擎 tmpl
        syntax: 'simple',

        // 运行时模块别名。仅用于 type 不等于 templatejs 的情况
        //runtime: null,

        // 自定义辅助方法路径
        helpers: null,

        // 是否输出为压缩的格式
        minify: true,

        // 是否内嵌异步加载插件（beta）
        // 可以支持 template.async(path, function (render) {}) 方式异步载入模板
        // 注意：type 参数是 templatejs 的时候才生效
        async: false,

        // 是否嵌入模板引擎，否则编译为不依赖引擎的纯 js 代码
        // 通常来说，模板不多的情况下，编译为原生的 js 打包后体积更小，因为不必嵌入引擎
        // 当模板很多的时候，内置模板引擎，模板使用字符串存储的方案会更能节省空间
        engine: false,

        // 输出的模块类型（不区分大小写），可选：
        // templatejs:  模板目录将会打包后输出，可使用 script 标签直接引入，也支持 NodeJS/RequireJS/SeaJS。
        // cmd:         这是一种兼容 RequireJS/SeaJS 的模块（类似 atc v1版本编译结果）
        // amd:         支持 RequireJS 等流行加载器
        // commonjs:    编译为 NodeJS 模块
        type: 'templatejs'

    },


    // 获取用户配置
    getUserConfig: function (options, dir) {
        dir = this.path || dir;
        var file = dir + '/package.json';
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
                    "tmodjs": "~0.0.1"
                },
                "tmodjs-config": {}
            }

        }
        
        // 默认配置 优先级：0
        for (name in defaults) {
            config[name] = defaults[name];
        }


        // 项目配置 优先级：1
        for (name in json["tmodjs-config"]) {
            config[name] = json["tmodjs-config"][name];
        }
        

        // 用户配置 优先级：2
        for (name in options) {
            config[name] = options[name];
        }


        json["tmodjs-config"] = config;
        this['package.json'] = json;

        // 忽略大小写
        config['type'] = config['type'].toLowerCase();
        config['syntax'] = config['syntax'].toLowerCase();

        return config;
    },


    /** 保存用户配置 */
    saveUserConfig: function () {

        var file = this.path + '/package.json';
        var configName = 'tmodjs-config';
        var json = this['package.json'];

        var options = json[configName];
        var userConfigList = Object.keys(this.defaults);


        //if (options.output.indexOf('.') === 0) {
        //    json.main = options.output + '/' + (options.runtime || RUNTIME) + '.js';
        //}


        // 只保存指定的字段
        json[configName] = JSON.parse(
            JSON.stringify(options, userConfigList)
        );


        var text = JSON.stringify(json, null, 4);

        
        fs.writeFileSync(file, text, 'utf-8');
    },


    // 绑定文件监听事件
    _onwatch: function (dir, callback) {

        var that = this;
        var watchList = {};
        var timer = {};


        var walk = function (dir) {
            fs.readdirSync(dir).forEach(function (item) {
                var fullname = dir + '/' + item;
                if (fs.statSync(fullname).isDirectory()){
                    watch(fullname);
                    walk(fullname);
                }
            });
        };


        // 排除“.”、“_”开头或者非英文命名的目录
        var filter = function (name) {
            return !FILTER_RE.test(name) && name !== that.output;
        };


        var watch = function (parent) {

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
                        callback.call(that, eventData);
                    }, 16);

                } else {
                    callback.call(that, eventData);
                }


            });

        };

        watch(dir);
        walk(dir);
    },


    // 筛选模板文件
    _filter: function (name) {
        return !FILTER_RE.test(name) && EXTNAME_RE.test(name);
    },


    // 模板文件写入
    _fsWrite: function (file, data) {
        this._fsMkdir(path.dirname(file));
        fs.writeFileSync(file, data, this.options['charset']);
    },


    // 模板文件读取
    _fsRead: function (file) {
        return fs.readFileSync(file, this.options['charset']);
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
    _rmdir: function (dir) {

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
    _md5: function (text) {
        return crypto.createHash('md5').update(text).digest('hex');
    },


    // 检查模板是否更改
    _isChange: function (html, js) {
        var newMd5 = this._md5(html + JSON.stringify(this['package.json']));
        var oldMd5 = js.match(/<MD5:(\w*)>/)[1];
        return newMd5 !== oldMd5;
    },


    // 调试语法错误
    _debug: function (error, callback) {

        var debugFile = error.debugFile;
        var code = error.temp;

        code = "/*! <DEBUG:" + error.id + '> */\n' + code;

        this._fsWrite(debugFile, code);
        
        // 启动子进程进行调试，从根本上避免影响当前进程
        var exec = require('child_process').exec; 
        exec('node ' + debugFile, {timeout: 0}, function (error, stdout, stderr) {
            var message = error ? error.message : '';
            message = message
            .replace(/^Command\sfailed\:|\s*SyntaxError[\w\W]*$/g, '')
            .trim();
            callback(message);
        });

        //this._fsUnlink(debugFile);
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


        this.log(message);
    },



    log: function (message) {
        process.stdout.write(message);
    },


    // 打包模板
    _combo: function () {

        var that = this;
        var templates = [];
        var ignores = [];
        var isDebug = this.options.debug;
        var isWrappings = this.options.type !== 'templatejs';
        var runtime = this.options.engine ? '/lib/template-full.js' : '/lib/template-runtime.js';
        
        var template = fs.readFileSync(__dirname + runtime, 'utf-8');

        var combo = '';


        var walk = function (dir) {
            var dirList = fs.readdirSync(dir);
            
            dirList.forEach(function (item) {

                if (fs.statSync(dir + '/' + item).isDirectory()) {
                    walk(dir + '/' + item);
                } else if (that._filter(item)) {

                    var id = (dir + '/' + item)
                    .replace(EXTNAME_RE, '')
                    .replace(that.path + '/', '');

                    templates.push(id);

                    if (!that.combo.test(id)) {
                        ignores.push(id);
                        return;
                    }
                    
                    var target = that.output + '/' + id + '.js';


                    if (fs.existsSync(target)) {
                        var code = that._fsRead(target);

                        // 一个猥琐的实现：
                        // 文件末尾设置一个空注释，然后让 UglifyJS 不压缩它，避免很多文件挤成一行  
                        code = code.replace(/^\/\*[\w\W]*?\*\//, '/**/');


                        combo += code;
                    }
                    

                }
            });
        };

        if (!isWrappings) {
            walk(this.path);
        }

        var build = Date.now();
        var debug = isDebug ? '<DEBUG>' : '';


        var data = {
            version: this.version,
            build: build,
            templates: combo,
            debug: debug,
            plugins: '',
            syntax: '',
            engine: '',
            helpers: this.helpers
        };


        // 嵌入异步加载插件
        if (this.options.async) {
            data.plugins = fs.readFileSync(__dirname + '/lib/template-async.js', 'utf-8');
        }


        // 嵌入引擎
        if (this.options.engine) {
            data.engine = fs.readFileSync(__dirname + '/lib/template.js', 'utf-8');
            data.syntax = fs.readFileSync(__dirname + '/lib/template-syntax.js', 'utf-8');
        }


        template = template.replace(/['"]<\:(.*?)\:>['"]/g, function ($1, $2) {
            return data[$2] || '';
        });


        var target = path.join(this.output, (this.options.runtime || RUNTIME) + '.js');
        

        this._fsWrite(target, template);

        isDebug || !this.options.minify
        ? uglifyjs.beautify(target)
        : uglifyjs.minify(target);


        this.emit('combo', {
            output: target,
            isDebug: isDebug,
            templates: templates,
            ignores: ignores,
            build: build
        });
    },


    /**
     * 监听模板的修改进行即时编译
     */
    watch: function () {

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
                        source: data.target
                    });
                    fullname = fullname.replace(EXTNAME_RE, '');
                    this._fsUnlink(fullname.replace(this.path, this.output) + '.js');
                    this._combo();

                } else if (/updated|create/.test(type)) {
                    
                    this.emit('change', {
                        source: data.target
                    });

                    if (this._compile(fullname)) {
                        this._combo();
                    };  

                }
            }

        });

    },


    // 编译单个模板
    _compile: function (file) {

        var that = this;

        // 模板字符串
        var source = this._fsRead(file);

        // 目标路径
        var target = file
        .replace(EXTNAME_RE, '.js')
        .replace(this.path, this.output);

        
        var mod = '';
        var modObject = {};
        var error = true;
        var errorInfo = null;
        var isDebug = this.options.debug;
        var isWrappings = this.options.wrappings;
        var isEngine = this.options.engine;


        // 读取上一次编译的结果
        if (fs.existsSync(target)) {
            mod = this._fsRead(target);
        }


        // 检查模板是否有改动
        var isChange = !mod
        || /<DEBUG>/.test(mod)
        || isDebug
        || this._isChange(source, mod);


        var id = file
        .replace(this.path + '/', './');


        var extname = id.match(EXTNAME_RE)[1];
        id = id.replace(EXTNAME_RE, '');


        // 模板加载事件
        this.emit('load', {
            id: id,
            file: file,
            extname: extname,
            isChange: isChange,
            source: source,
            target: target
        });


        try {
            
            if (isChange) {
                modObject = template.AOTcompile(id, source, {
                    runtime: RUNTIME,
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


        if (!error && isChange) {

            var md5 = this._md5(source + JSON.stringify(this['package.json']));
            mod = '/*! <TmodJS> <MD5:' + md5 + '>'
            + (isDebug ? ' <DEBUG>' : '')
            + '*/\n' + mod;

            this._fsWrite(target, mod);
            uglifyjs[isDebug || !this.options.minify ? 'beautify' : 'minify'](target);


        }


        var compileInfo = {
            id: id,
            file: file,
            extname: extname,
            isChange: isChange,
            error: error,
            source: source,
            target: target,
            code: mod,
            requires: modObject.requires || []
        };

        
        if (error) {
            errorInfo.debugFile = this.path + '/.debug.js';

            this._debug(errorInfo, function (message) {

                var e = {
                    name: errorInfo.name,
                    type: 'compileError',
                    message: message,
                    debugFile: errorInfo.debugFile,
                    temp: errorInfo.temp
                };
                for (var name in compileInfo) {
                    e[name] = compileInfo[name];
                };

                // 模板编译错误事件
                this.emit('compileError', e);

                this.emit('error', e);

            }.bind(this));
            
        } else {

            // 模板编译成功事件
            this.emit('compile', compileInfo);
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

        if (file) {

            var extname = path.extname(file);

            var walk = function (list) {

                list.forEach(function (file) {

                    if (error) {
                        return;
                    }

                    var info = that._compile(file);

                    error = !info;

                    
                    if (!error && recursion !== false && info.requires.length) {

                        list = info.requires.map(function (id) {
                            var target = path.resolve(that.path, id + extname);
                            return target;
                        });

                        walk(list);

                    };
                    
                });
            };

            walk(typeof file === 'string' ? [file] : file);

            !error && this._combo();

        } else {


            var walk = function (dir) {
                var dirList = fs.readdirSync(dir);
                
                dirList.forEach(function (item) {

                    if (error) {
                        return;
                    }

                    if (fs.statSync(dir + '/' + item).isDirectory()) {
                        walk(dir + '/' + item);
                    } else if (that._filter(item)) {
                        error = !that._compile(dir + '/' + item);
                    }
                    
                });
            };


            walk(this.path);
            !error && this._combo();
        }

    },


    init: function (input, options) {

        events.EventEmitter.call(this);

        options = this.options = this.getUserConfig(options, input);

        // 模板目录
        this.path = path.resolve(input);

        // 输出目录
        this.output = path.resolve(path.join(this.path, options.output));

        // 辅助方法
        this.helpers = '';


        // 加载辅助方法
        if (options['helpers']) {
            var helpersPath = path.join(this.path, options['helpers']);

            if (fs.existsSync(helpersPath)) {
                this.helpers = fs.readFileSync(helpersPath, 'utf-8');
                vm.runInNewContext(this.helpers, {
                    template: template
                });
            }
        }


        // 加载模板语法设置
        if (options['syntax'] && options['syntax'] !== 'native') {
            var syntaxPath = options['syntax']  === 'simple'
            ? __dirname + '/lib/template-syntax.js'
            : path.join(this.path, options['syntax']);

            if (fs.existsSync(syntaxPath)) {
                vm.runInNewContext(fs.readFileSync(syntaxPath, 'utf-8'), {
                    template: template
                });
            }
        }


        // 模板合并规则
        if (options.combo.length) {
            var reg = [];
            options.combo.forEach(function (combo) {
                combo = combo
                .replace(/([\$\.])/g, '\\$1')
                .replace(/\*/g, '(.*?)');

                reg.push('^' + combo + '$');
            });
            this.combo = new RegExp(reg.join('|'));
        }


        // 初始化 watch 事件
        this.on('newListener', function (event, listener) {
            if (event === 'watch') {
                this._log('\n[inverse]Waiting..[/inverse]\n\n');
                this._onwatch(this.path, function (data) {
                    this.emit('watch', data);
                });
                this._onwatch = function () {};
            }
        });


        // 监听模板修改事件
        this.on('change', function (data) {
            var time = (new Date).toLocaleTimeString();
            this._log('[grey]' + time + '[/grey] ');
            this._log('[grey]Template has been updated[/grey]\n');
        });


        // 监听模板加载事件
        this.on('load', function (data) {
            this._log(data.id + '[grey].' + data.extname + '[/grey]');
        });


        // 监听模板编译事件
        this.on('compile', function (data) {
            if (data.isChange) {
                this._log(' [green]√[/green]\n');
            } else {
                this._log(' [grey]√[/grey]\n');
            }
        });


        // 监听编译错误事件
        this.on('compileError', function (data) {
            this._log(' [inverse][red]Syntax Error[/red][/inverse]\n');
            this._log('\n[red]Template ID: ' + data.id + '[/red]\n');
            this._log('[red]' + data.message + '[/red]\n');
        });


        // 监听模板合并事件
        this.on('combo', function (data) {

            this._log('\n');

            var iLength = data.ignores.length;
            var tLengtn = data.templates.length;

            if (data.ignores.length) {
                this._log('[grey]Ignore(' + iLength + '/' + tLengtn + '): '
                    + data.ignores.join(', ')  + '[/grey]\n');
            }

            this._log('[grey]>>> [/grey][green]' + data.output + '[/green]');
            this._log(this.options.debug ? ' [red]<DEBUG>[/red]\n' : '\n');

        });


    }

};


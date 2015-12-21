/*!
 * TmodJS - AOT Template Compiler
 * https://github.com/aui/tmodjs
 * Released under the MIT, BSD, and GPL Licenses
 */

'use strict';

var version = require('../package.json').version;
var AOTcompile = require('./AOTcompile.js');
var defaults = require('./defaults.js');
var runtime = require('./runtime.js');
var uglify2 = require('./uglify2.js');
var stdout = require('./stdout.js');
var watch = require('./watch.js');
var path = require('./path.js');
var semver = require('semver');



var fs = require('fs');
var vm = require('vm');
var events = require('events');
var crypto = require('crypto');
var child_process = require('child_process');
var exec = child_process.exec;
//var execSync = child_process.execSync;


// 调试脚本
var DEBUG_File = '.debug.js';

// 缓存目录
var CACHE_DIR = '.cache';

var log = function (message) {
    console.log(message);
};

 
var Tmod = function (base, options) {


    // 模板项目路径
    this.base = path.resolve(base);


    // 项目配置选项
    this.options = options = this.getConfig(options);


    // 输出路径
    this.output = path.resolve(this.base, options.output);


    // 运行时输出路径
    this.runtime = path.resolve(this.output, options.runtime);


    // 编译结果存储
    this._cache = {};


    // 清理模板项目临时文件
    this._clear();


    // 初始化模板引擎
    this._initEngine();


    // 初始化事件系统
    events.EventEmitter.call(this);


    // 初始化 watch 事件，修复 watch 的跨平台的 BUG
    this.on('newListener', function (event, listener) {

        if (/*watch && */event === 'watch') {

            this.log('\n[green]Waiting...[/green]\n\n');

            watch(this.base, function (data) {
                this.emit('watch', data);
            }.bind(this), function (folderPath) {
                return this.filter(folderPath) && folderPath !== this.output;

            }.bind(this), fs);

            //watch = null;
        }

    });


    // 监听模板修改事件
    this.on('change', function (data) {
        var time = (new Date).toLocaleTimeString();
        this.log('[grey]' + time + '[/grey]\n');
    });


    // 监听模板删除事件（Windows NodeJS 暂时无法做到）
    this.on('delete', function (data) {
        var time = (new Date).toLocaleTimeString();
        this.log('[grey]' + time + '[/grey]\n');
        this.log('[red]-[/red] ' + data.id + '\n');
    });


    // 监听模板加载事件
    this.on('load', function (error, data) {

        if (error) {
            this.log('[red]•[/red] ');
            this.log(data.id);
            return;
        }

        if (data.modified) {
            this.log('[green]•[/green] ');
        } else {
            this.log('[grey]•[/grey] ');
        }

        this.log(data.id);
    });


    // 监听模板编译事件
    this.on('compile', function (error, data) {

        if (error) {
            this.log(' [inverse][red]{{Syntax Error}}[/red][/inverse]\n\n');
        } else {

            this.log(this.options.debug ? ' [grey]<DEBUG>[/grey]' : '');
            this.log(' [grey]:v' + data.version + '[/grey]');
            this.log('\n');

        }


    });


    // 调试事件（异步事件）
    this.on('debug', function (error) {
        
        this.log('[red]Debug info:[/red]\n');

        if (error.line && error.source) {
            this.log('[red]' + error.line + ': ' + error.source + '[/red]\n');
        }

        this.log('[red]' + error.message + '[/red]\n');
    });



    // 监听模板合并事件
    this.on('combo', function (error, data) {

        if (error) {
            this.log('[red]' + error + '[/red]\n');
        } else {
            // this.log('[grey]»[/grey] ');
            // this.log('[grey]' + this.options.runtime + '[/grey]');
            // this.log(' [grey]:build' + data.version + '[/grey]');
            // this.log('\n');
        }

    });

    // 输出运行时 TODO: 这个时机需要优化
    this._buildRuntime();
};


// 默认配置
// 用户配置将保存到模板根目录 package.json 文件中
Tmod.defaults = defaults;


Tmod.prototype = {

    __proto__: events.EventEmitter.prototype,


    // 获取用户配置
    getConfig: function () {

        var options = arguments[0];

        if (!options) {
            return this.options;
        }

        var file = path.join(this.base, 'package.json');

        var defaults = Tmod.defaults;
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
                    "tmodjs": "1.0.0"
                },
                "tmodjs-config": {}
            };

        }

        //有些项目的package.json里只有devDependencies而没有dependencies
        //那么下面的replace那行代码就会出现can't read property 'tmodjs' of undefined的错误
        //这里添加容错逻辑
        
        if (!json.dependencies) {
            json.dependencies = json.devDependencies;
        }

        var targetVersion = json.dependencies.tmodjs.replace(/^~/, '');


        
        try {
            // 比较模板项目版本号
            if (semver.lt(version, targetVersion)) {
                this.log('[red]You must upgrade to the latest version of tmodjs![/red]\n');
                this.log('Local:  ' + version + '\n')
                this.log('Target: ' + targetVersion + '\n');
                process.exit(1);
            }
        } catch (e) {}



        // 更新模板项目的依赖版本信息
        json.dependencies.tmodjs = version;


        // 来自 Tmod.defaults
        for (name in defaults) {
            config[name] = defaults[name];
        }


        // 来自 package.json 文件
        for (name in json['tmodjs-config']) {
            config[name] = json['tmodjs-config'][name];
        }


        // 来自 Tmod(base, options) 的配置
        for (name in options) {
            if (options[name] !== undefined) {
                config[name] = options[name];
            }
        }


        config = this._fixConfig(config, defaults, json['tmodjs-config'], options);

        json['tmodjs-config'] = config;
        this['package.json'] = json;
        this.projectVersion = json.version;

        return config;
    },


    /**
     * 保存用户配置
     * @return  {String}    用户配置文件路径
     */
    saveConfig: function () {

        var file = path.join(this.base, 'package.json');
        var configName = 'tmodjs-config';
        var json = this['package.json'];

        var options = json[configName];
        var userConfigList = Object.keys(Tmod.defaults);


        // 只保存指定的字段
        json[configName] = JSON.parse(
            JSON.stringify(options, userConfigList)
        );


        var text = JSON.stringify(json, null, 4);


        fs.writeFileSync(file, text, 'utf-8');

        return file;
    },


    /**
     * 编译模板
     * @param   {String, ArrayList}    模板文件相对路径。无此参数则编译目录所有模板
     */
    compile: function (file) {

        var that = this;
        var error = false;
        var walk;

        if (file) {

            
            var fileList = typeof file === 'string' ? [file] : file;

            fileList = fileList.map(function (file) {
                return path.resolve(that.base, file);
            });

            walk = function (list) {

                list.forEach(function (file) {

                    if (error) {
                        return;
                    }

                    error = !that._compile(file);

                });
            };


            walk(fileList);

            if (!error && this.options.combo) {
                this._combo();
            }

        } else {


            walk = function (dir) {

                if (dir === that.output) {
                    return;
                }

                var dirList = fs.readdirSync(dir);

                dirList.forEach(function (item) {

                    if (error) {
                        return;
                    }

                    if (fs.statSync(path.join(dir, item)).isDirectory()) {
                        walk(path.join(dir, item));
                    } else if (that.filterBasename(item) && that.filterExtname(item)) {
                        error = !that._compile(path.join(dir, item));
                    }

                });
            };


            walk(this.base);

            if (!error && this.options.combo) {
                this._combo();
            }
        }

    },


    /**
     * 文件与路径筛选器
     * @param   {String}    绝对路径
     * @return  {Boolean}
     */
    filter: function (file) {
        
        if (fs.existsSync(file)) {
            var stat = fs.statSync(file);
            if (stat.isDirectory()) {
                
                var dirs = file.split(path.sep);
                var basedir = dirs[dirs.length - 1];
                
                return this.filterBasename(basedir) ? true : false;

            } else {

                return this.filterBasename(path.basename(file))
                && this.filterExtname(path.extname(file));
            }

        } else {
            return false;
        }
    },


    /**
     * 名称筛选器
     * @param   {String}
     * @return  {Boolean}
     */
    filterBasename: function (name) {
        // 英文、数字、点、中划线、下划线的组合，且不能以点开头
        var FILTER_RE = /^\.|[^\w\.\-$]/;

        return !FILTER_RE.test(name);
    },


    /**
     * 后缀名筛选器
     * @param   {String}
     * @return  {Boolean}
     */
    filterExtname: function (name) {
        // 支持的后缀名
        var EXTNAME_RE = /\.(html|htm|tpl)$/i;
        return EXTNAME_RE.test(name);
    },


    /**
     * 启动即时编译，监听文件修改自动编译
     */
    watch: function () {

        // 监控模板目录
        this.on('watch', function (data) {

            var type = data.type;
            var fstype = data.fstype;
            var target = data.target;
            var parent = data.parent;
            var fullname = path.join(parent, target);


            if (target && fstype === 'file' && this.filter(fullname)) {//

                if (type === 'delete') {

                    this.emit('delete', {
                        id: this._toId(target),
                        sourceFile: target
                    });

                    var jsFile = fullname.replace(path.extname(fullname), '');
                    jsFile = jsFile.replace(this.base, this.output) + '.js'

                    this._fsUnlink(jsFile);

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


    /**
     * 打印日志
     * @param   {String}    消息
     */
    log: function (message) {
        stdout(message);
    },


    // 修正配置-版本兼容
    _fixConfig: function (options, defaultsConfig, projectConfig, inputConfig) {

        var cwd = process.cwd();
        var base = this.base;

        // 忽略大小写
        options.type = options.type.toLowerCase();
  

        // 模板合并规则
        // 兼容 0.0.3-rc3 之前的配置
        if (Array.isArray(options.combo) && !options.combo.length) {
            options.combo = false;
        } else {
            options.combo = !!options.combo;
        }


        // 兼容 0.1.0 之前的配置
        if (options.type === 'templatejs') {
            options.type = 'default';
        }


        // 根据生成模块的类型删除不支持的配置字段
        if (options.type === 'default' || options.type === 'global') {
            delete options.alias;
        } else {
            delete options.combo;
        }


        // 处理外部输入：转换成相对于 base 的路径

        if (inputConfig.output) {
            options.output = path.relative(base, path.resolve(cwd, inputConfig.output));
        }

        if (inputConfig.syntax && /\.js$/.test(inputConfig.syntax)) {// 值可能为内置名称：native || simple
            options.syntax = path.relative(base, path.resolve(cwd, inputConfig.syntax));
        }

        if (inputConfig.helpers) {
            options.helpers = path.relative(base, path.resolve(cwd, inputConfig.helpers));
        }


        return options;
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

        return js.replace(/^\/\*TMODJS\:(?:.*)\*\//, newText);
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

        exec('node ' + debugFile, function (error, stdout, stderr) {
            var message = error ? error.message : '';
            message = message
            .replace(/^Command\sfailed\:|\s*SyntaxError[\w\W]*$/g, '')
            .trim();
            callback(message);
        });

    },


    // 编译运行时
    _buildRuntime: function (templates, metadata, callback) {

        templates = templates || '';
        metadata = metadata || {};
        callback = callback || function () {};

        var error = null;

        var runtimeCode = runtime({
            type: this.options.type,
            helpers: this._helpersCode,
            templates: templates
        });


        runtimeCode = this._setMetadata(runtimeCode, metadata);

        try {
            this._fsMkdir(path.dirname(this.runtime));
            fs.writeFileSync(this.runtime, runtimeCode, this.options.charset);
        } catch (e) {
            error = e;
        }


        if (this.options.debug || !this.options.minify) {
            this._beautify(this.runtime);
        } else {
            this._minify(this.runtime);
        }

        callback.call(this, error, runtimeCode);
    },


    _getUglifyOptions: function () {
        return {
            // require 变量是 AMD 、CMD 模块需要硬解析的字符
            reserved: 'require',
            // 忽略压缩的注释
            comments: '/TMODJS\\:|^v\\:\\d+/',
            compress: {
                warnings: false
            }
        };
    },


    _uglify: function (file, options) {

        var result;

        try {
            result = uglify2(file, file, options);
        } catch (e) {
            var err = new Error('Uglification failed.');
            if (e.message) {
                err.message += '\n' + e.message + '. \n';
                if (e.line) {
                    err.message += 'Line ' + e.line + ' in ' + file + '\n';
                }
            }
            err.origError = e;
            console.log(err);
        }

        try {
            if (result) {
                fs.writeFileSync(file, result.output, this.options.charset);
            }
        } catch (e) {}
    },


    // 格式化 js
    _beautify: function (file) {
        var options = this._getUglifyOptions();
        options.mangle = false;
        options.beautify = true;
        this._uglify(file, options);
    },


    // 压缩 js
    _minify: function (file) {
        var options = this._getUglifyOptions();
        options.mangle = {};
        options.beautify = false;
        options.ascii_only = true;
        this._uglify(file, options);
    },


    // 打包模板
    _combo: function () {

        var files = [];
        var combo = '';
        var cache = this._getCache();
        var code = '';
        var build = Date.now();

        for (var i in cache) {

            code = cache[i];
            code = this._removeMetadata(code);
            combo += code;

            files.push(i);
        }


        var metadata = {};
        if (this.options.debug) {
            metadata.debug = true;
        }

        if (this.options.combo) {
            metadata.version = this.projectVersion;
        }


        this._buildRuntime(combo, metadata, function (error, data) {

            // 广播：合并事件
            this.emit('combo', error, {

                // 编译时间
                build: build,

                // 打包的代码
                output: data,

                // 输出的文件路径
                outputFile: this.runtime,

                // 被合并的文件列表
                sourcefiles: files

            });

        });

    },


    // 路径转换为模板 ID
    // base: /Users/tangbin/Documents/web/tpl
    // file: /Users/tangbin/Documents/web/tpl/index/main.html
    // >>>>> index/main
    _toId: function (file) {
        var extname = path.extname(file);
        var id = file.replace(this.base + '/', '').replace(extname, '');
        return id;
    },


    // 编译单个模板
    // file: /Users/tangbin/Documents/web/tpl/index/main.html
    _compile: function (file) {


        // 模板字符串
        var source = '';

        var readError = null;
        var compileError = null;
        var writeError = null;

        // 目标路径
        var target = file
        .replace(path.extname(file), '.js')
        .replace(this.base, this.output);

        var mod = this._getCache(file);
        var modObject = {};
        var metadata = {};
        var count = 0;
        
        var isDebug = this.options.debug;
        var isCacheDir = this.options.combo;


        try {
            source = fs.readFileSync(file, this.options.charset);
        } catch (e) {
            readError = e;
        }


        var newMd5 = this._getMd5(source + JSON.stringify(this['package.json']));

        // 如果开启了合并，编译后的文件使用缓存目录保存
        if (isCacheDir) {
            target = target.replace(this.output, path.join(this.output, CACHE_DIR));
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
        var modified = !this.options.cache
        || !mod                         // 从来没有编译过
        || metadata.debug               // 上个版本为调试版
        || isDebug                      // 当前配置为调试版
        || newMd5 !== metadata.md5;     // 模板已经发生了修改（包括配置文件）


        // 获取模板 ID
        var id = this._toId(file);


        // 广播：模板加载事件
        this.emit('load', readError, {

            // 模板 ID
            id: id,

            // 模板是否需要重新编译
            modified: modified,

            // 原始文件路径
            sourceFile: file,

            // 模板源代码
            source: source,

            // 输出路径
            outputFile: target

        });


        if (readError) {
            return;
        }


        try {

            // 编译模板
            if (modified) {
                modObject = this.template.AOTcompile(source, {
                    filename: id,
                    alias: this.options.alias,
                    type: this.options.type,
                    compress: this.options.compress,
                    escape: this.options.escape,
                    runtime: this.options.runtime,
                    debug: isDebug
                });
                mod = modObject.code;
            }

        } catch (e) {
           compileError = e;
        }


        // 不输出的情况：遇到错误 || 文件或配置没有更新
        if (!compileError && modified) {

            count ++;

            mod = this._setMetadata(mod, {
                debug: isDebug,
                version: count,
                md5: newMd5
            });


            try {
                this._fsMkdir(path.dirname(target));//////
                fs.writeFileSync(target, mod, this.options.charset);
            } catch (e) {
                writeError = e;
            }


            if (!isCacheDir && !writeError) {
                if (isDebug || !this.options.minify) {
                    this._beautify(target);
                } else {
                    this._minify(target);
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
            modified: modified,

            // 依赖的子模板 ID 列表
            requires: modObject.requires || []
        };


        if (compileError && !compileError.source) {

            // 语法错误，目前只能对比生成后的 js 来查找错误的模板语法

            compileError.debugFile = path.join(this.base, DEBUG_File);

            this.debuging = true;

            this._debug(compileError, function (message) {

                var e = {

                    // 错误名称
                    name: compileError.name,

                    // 报错信息
                    message: message,

                    // 调试文件地址
                    debugFile: compileError.debugFile,

                    // 编译器输出的临时文件
                    temp: compileError.temp

                };

                for (var name in e) {
                    compileError[name] = e[name];
                }

                this.emit('debug', compileError);

            }.bind(this));


        } else {

            // 删除上次遗留的调试文件
            if (this.debuging) {
                this._fsUnlink(path.join(this.base, DEBUG_File));
                delete this.debuging;
            }

            // 缓存编译好的模板
            this._setCache(file, mod);
        }

        
        this.emit('compile', compileError || writeError, compileInfo);
        

        if (compileError || writeError) {
            this.emit('debug', compileError || writeError);
            return null;
        } else {
            return compileInfo;
        }
    },


    // 计算字节长度
    _getByteLength: function (content) {
        return content.replace(/[^\x00-\xff]/gi, '--').length;
    },


    // 获取缓存
    _getCache: function (id) {
        if (typeof id === 'undefined') {
            return this._cache;
        } else {
            return this._cache[id];
        }
    },


    // 设置缓存
    _setCache: function (id, data) {
        this._cache[id] = data;
    },


    // 删除缓存
    _removeCache: function (id) {
        delete this._cache[id];
    },


    // 初始化模板引擎
    _initEngine: function () {
        var options = this.options;
        var template;

        switch (String(options.syntax)) {
            case 'native':
                template = require('./syntax/native.js');
                break;

            case 'simple':
                template = require('./syntax/simple.js');
                break;

            // 不再推荐使用动态加载自定义语法
            // 为了兼容 < v1.0 的功能
            default:
                
                var syntaxFile = path.resolve(this.base, options.syntax);

                if (fs.existsSync(syntaxFile)) {

                    template = require('./syntax/native.js');

                    var syntaxCode = fs.readFileSync(syntaxFile, 'utf-8');

                    vm.runInNewContext(syntaxCode, {
                        console: console,
                        template: template
                    });

                } else {

                    this.log('[red]Not found: ' + syntaxFile + '[/red]');
                    process.exit(1);

                }   
        }


        // 配置模板引擎：辅助方法
        if (options.helpers) {

            var helpersFile = path.resolve(this.base, options.helpers);

            if (fs.existsSync(helpersFile)) {

                this._helpersCode = fs.readFileSync(helpersFile, 'utf-8');
                vm.runInNewContext(this._helpersCode, {
                    console: console,
                    template: template
                });

            } else {

                this.log('[red]Not found: ' + helpersFile + '[/red]');
                process.exit(1);

            }
        }


        this.template = AOTcompile(template);
        
    },


    // 清理项目临时文件
    _clear: function () {

        // 删除上次遗留的调试文件
        this._fsUnlink(path.join(this.base, DEBUG_File));


        // 删除不必要的缓存目录
        if (!this.options.combo) {
            this._fsRmdir(path.join(this.output, CACHE_DIR));
        }

    }

};

module.exports = Tmod;


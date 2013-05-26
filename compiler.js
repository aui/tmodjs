#!/usr/bin/env node

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

var compiler = {

    version: 'v1.0.2',

    options: {
        path: null,
        output: null,
        charset: 'utf-8',
        watch: false,
        cloneHelpers: false,
        defineSyntax: false
    },


    /** 显示帮助 */
    help: function () {
        this.log('Usage:\n');
        console.log(
            '    atc [options] path'
        );
        this.log('Options:\n');
        this.log([
            '    -w, --watch',
            '    [grey]use atc in watch mode (auto compile when file changed)[/grey]',

            '    -d, --define-syntax',
            '    [grey]use this if the template files are using simplified template syntax[/grey]',

            '    -c charset, --charset charset',
            '    [grey]charset, utf-8 by default[/grey]',

            '    -o path, --output path',
            '    [grey]defining an output directory[/grey]',

            '    --clone-helpers',
            '    [grey]clone the helper functions to the compiled files, by default, they are seprated[/grey]',

            '    --version',
            '    [grey]display the version of atc[/grey]',

            '    --help',
            '    [grey]show this help infomation[/grey]'
        ].join('\n') + '\n\n');

        this.log('[grey]Documentation can be found at http://cdc-im.github.io/atc/[/grey]\n');
    },


    // 过滤不符合命名规范的目录与模板
    FILTER_RE: /[^\w\.\-$]/,

    // 模板文件后缀
    EXTNAME_RE: /\.(html|htm|tpl)$/i,

    // 公用的辅助模块名字
    HELPERSNAME: '$helpers.js',

    /*
     * 模板编译引擎
     * @param   {String}    模板
     * @param   {String}    外部辅助方法路径（若不定义则会把辅助方法复制后编译到函数内）
     * @return  {String}    编译好的模板
     */
    engine: (function () {

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


        // 包装成RequireJS、SeaJS模块
        var toModule = function (code, helpersPath) {

            template.onerror = function (e) {
                throw e;
            };


            // 使用artTemplate编译模板
            var render = template.compile(code);
            var prototype = render.prototype;
            

            render = render.toString()
            .replace(/^function\s+(anonymous)/, 'function');


            // SeaJS与RequireJS规范，相对路径前面需要带“.”
            var fixPath = function (dir) {
                dir = dir
                .replace(/\\/g, '/')
                .replace(/\.js$/, '');

                if (!/^(\.)*?\//.test(dir)) {
                    dir = './' + dir;
                }
                return dir;
            };


            var dependencies = [];
            parseDependencies(render).forEach(function (file) {
                dependencies.push(
                    '\'' + file + '\': ' + 'require(\'' + fixPath(file) + '\')'
                );
            });
            var isDependencies = dependencies.length;
            dependencies = '{' + dependencies.join(',') + '}';


            // 输出辅助方法
            var helpers;

            if (helpersPath) {

                helpersPath = fixPath(helpersPath);

                helpers = 'require(\'' + helpersPath + '\')';

            } else {

                helpers = [];
                
                for (var name in prototype) {

                    if (name !== '$render') {
                        helpers.push(
                            '\'' + name + '\': ' + prototype[name].toString()
                        );
                    }
                }
                helpers = '{' + helpers.join(',') + '}';
            }


            code =
            'define(function(require){'
            +   (isDependencies ? 'var dependencies=' + dependencies + ';' : '')
            +   'var helpers = ' + helpers + ';'
            +   (isDependencies ? 'var $render=function(id,data){'
            +       'return dependencies[id](data);'
            +   '};' : '')
            +   'var Render=' + render  + ';'
            +   'Render.prototype=helpers;'
            +   'return function(data){'
            +       (isDependencies ? 'helpers.$render=$render;' : '')
            +       'return new Render(data) + \'\';'
            +   '}'
            + '})';
            
            
            return code;
        };

        return function (source, helpersPath) {
            return toModule(source, helpersPath);
        }

    })(),

    
    /** 格式化JS */
    format: function(code) {

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


    /** 外置辅助方法 */
    writeHelpers: function () {

        var helpers = [];
        var fullname = this._output  + '/' + this.HELPERSNAME;
        var prototype = template.prototype;

        for (var name in prototype) {
            if (name !== '$render') {
                helpers.push('\'' + name + '\': ' + prototype[name].toString());
            }
        }

        helpers = '{\n' + helpers.join(',\n') + '}';

        var module = 'define(function () {'
        +    'return ' + helpers
        + '});'

        module = this.format(module);

        this._fsWrite(fullname, module);
    },


    /**
     * 在控制台显示日志(支持UBB)
     * @param   {String}    消息
     */
    log: function (message) {
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
                    // window 下 nodejs fs.watch 不稳定(nodejs v0.10.5)
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


    // 定义模板语法
    _defineSyntax: function () {
        var file = __dirname + '/lib/template-syntax.js';
        var code = fs.readFileSync(file, 'utf-8');
        eval(code);
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
        file = file.replace(this._path , this._output);
        return fs.existsSync(file) && fs.unlink(file);
    },


    /** 监听模板的修改进行即时编译 */
    watch: function () {

        var that = this;

        // 监控模板目录
        this._onwatch(this._path , function (event) {
            var type = event.type;
            var fstype = event.fstype;
            var target = event.target;
            var parent = event.parent;
            var fullname = parent + '/' + target;

            if (target && fstype === 'file' && that._filter(target)) {
                //console.log(type + ': ' + fullname);

                if (type === 'delete') {
                    var js = fullname.replace(that.EXTNAME_RE, '.js')
                    .replace(that._path , that._output);
                    that._fsUnlink(js);
                } else
                if (type === 'updated' || type === 'create') {
                    that.compile(fullname);
                }
            }
        });

        this.log('\n[inverse]Watch..[/inverse]\n\n');
    },


    /**
     * 编译单个模板
     * @param   {String}    文件
     * @return  {Boolean}   成功true, 失败false
     */
    compile: function (file) {

        var name = null;
        var that = this;
        var success = true;

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
        var info_source = this.options['path'] + info;
        var info_output = this.options['output'] + info.replace(this.EXTNAME_RE, '.js');

        this.log('Compile: [green]' + info_source + '[/green]');

        try {
            
            var code = this.engine(source, name);
            code = this.format(code);
            this._fsWrite(target, code);
            this.log('[grey] > ' + info_output + '[/grey]\n');

        } catch (e) {

            this.log(' [inverse][red]' + e.name + '[/red][/inverse]\n');
            success = false;
            this._debug(e.temp);
            process.exit(1);
        }

        return success;
    },


    // 调试语法错误
    _debug: function (code) {
        
        var code = this.format(code);
        var debugFile = this._output + '/.debug.js';
        
        try {
            this._fsWrite(debugFile, code);
            require(debugFile);
        } catch (e) {
            console.log(code);
            this._fsUnlink(debugFile);
        }
    },


    /** 编译模板目录所有的模板 */
    compileAll: function () {

        var that = this;
        var success = true;

        var walk = function (dir) {
            var dirList = fs.readdirSync(dir);

            success && dirList.forEach(function (item) {
                if (fs.statSync(dir + '/' + item).isDirectory()) {
                    walk(dir + '/' + item);
                } else if (that._filter(item)) {
                    success = that.compile(dir + '/' + item);
                }
            });

        };

        walk(this._path );
    },


    init: function () {

        var that = this;
        var options = this.options;

        // 分析命令行参数
        var v;
        var args = process.argv.slice(2);
        while (args.length > 0) {
            v = args.shift();
            switch (v) {

                // 监控修改
                case '-w':
                case '--watch':
                    options.watch = true;
                    break;

                // 让每个输出的模块内嵌辅助方法
                case '--clone-helpers':
                    options.cloneHelpers = true;
                    break;

                // 加载模板语法设置
                case '-d':
                case '--define-syntax':
                    options.defineSyntax = true;
                    break;

                // 输出目录
                case '-o':
                case '--output':
                    options.output = args.shift();
                    break;

                // 模板编码
                case '-c':
                case '--charset':
                    options.charset = args.shift().toLowerCase();
                    break;

                // 版本号
                case '--version':
                    return this.log(this.version + '\n');
                    break;

                // 显示帮助
                case '--help':
                    return this.help();
                    break;

                // 模板目录
                default:

                    if (v) {
                        options.path = v;
                    }

                    break;
            }
        }


        if (!options['path']) {
            this.help();
            return process.exit(1);
        }


        if (!fs.existsSync(options['path'])) {
            console.log('Error: directory does not exist');
            this.help();
            return process.exit(1);
        };


        options['path'] = options['path'].replace(/[\/\\]$/, '');
        options['output'] = (options['output'] || options['path']).replace(/[\/\\]$/, '');


        // 转换成绝对路径
        this._path = path.resolve(options['path']).replace(/[\/\\]$/, '');
        this._output = path.resolve(options['output']).replace(/[\/\\]$/, '');


        // 加载引擎语法扩展
        options['defineSyntax'] && this._defineSyntax();


        // 输出公用模块
        !options['cloneHelpers'] && this.writeHelpers();


        if (options['watch']) {

            // 监控模板修改进行即时编译
            this.watch();

        } else {

            // 编译目录中所有模板
            this.compileAll();

        }


    }

};


compiler.init();


//module.exports = compiler;



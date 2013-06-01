#	atc-前端模板预编译器

<http://cdc-im.github.io/atc>


##	关于 atc

atc 即 artTemplate compiler，基于 [artTemplate](https://github.com/aui/artTemplate) 实现的前端模板预编译器，使用它可以让前端模版不再受浏览器的限制，支持如后端模版一样按文件放置、include 语句等特性：模板使用者无需关心模板内部的依赖顺序，依赖会自动处理。

编译后的模板不再依赖前端模板引擎与后端，模板可以通过 [SeaJS](http://seajs.org) 或 [RequireJS](http://requirejs.org) 等加载器进行异步加载，亦能利用它们成熟的打包合并工具进行上线前的优化，如合并与压缩。

##	安装

先安装 NodeJS 与 npm (新版NodeJS已经附带 npm)，安装 atc：

	npm install template-compiler -g

##	调用

	atc [options] <path>

其中``path``是前端模板目录，例如：``atc -w demo/templates``

###	[options] 配置参数
            
*	``-w``或``--watch``设置实时监控模板修改
*	``-c value``或``--charset value``定义模板编码，默认``utf-8``
*	``-o value``或``--output value``定义输出目录，默认输出到模板目录
*	``-t value``或``--type value``定义输出模块类型，默认``cmd``，可选：``cmd``、``amd``、``commonjs``
*	``--clone-helpers``设置辅助方法克隆到编译后的函数，默认外置($helpers.js)
*	``--no-define-syntax``设置原生模板语法编译模板（v1.0.3默认使用简洁语法）
*	``--version``显示 atc 版本号
*	``--help``显示帮助信息

## 运行示例

源码中 ./demo 是一个演示项目，./demo/templates 是项目的模板目录。你可以拷贝 demo 目录到本机，使用``cd``命令切换到 demo/templates 目录后，运行：

	atc ./

atc 会编译模板目录所有模板，你可以打开演示项目首页：[./demo/index.html](http://cdc-im.github.io/atc/demo/) 查看调用模板的演示。

## 接口

若想作为一个库调用（例如在基于 NodeJS 的自动化工具中），atc 提供如下接口：

	var atc = require('./atc.js');
	atc.init({
        // 模板目录
        path: null,

        // 编译输出目录（默认等于 path）
        output: null,

        // 编译后的模块类型，可选：CMD | AMD | CommonJS
        // CMD 与 AMD 可以运行在浏览器中，其中 CMD 模块兼容 RequireJS 与 SeaJS 这两种脚本加载器
        // CommonJS 模块可以被服务器支持（基于 NodeJS）
        type: 'CMD',

        // 模板编码
        charset: 'utf-8',

        // 是否监控模板目录即时编编译
        watch: false,

        // 是否克隆辅助方法到编译后的模板中
        cloneHelpers: false,

        // 是否使用简洁的模板语法进行编译
        defineSyntax: true
	});
	
	// 编译模板
	// file 参数可选，无则编译整个模板目录，否则编译指定的模板文件
	atc.compile(file);

##	模板语法

<https://github.com/cdc-im/atc/wiki/模板语法>

##	更新日志

###	v1.0.3

*	默认使用简洁语法，取消``--define-syntax``，增加``--no-define-syntax``参数用来启用原生语法
*	增加``-t, --type``设置输出的模块类型，默认 CMD ，可选：CMD | AMD | CommonJS。让模板可以前后端共用
*	因 Windows 批处理无法模拟 NodeJS 的高级特性，atc 不再包含 Windows 批处理脚本，若需要可用批处理调用 NodeJS
*	模板语法的界定符有变更，请参考：[模板语法](https://github.com/cdc-im/atc/wiki/模板语法)

###	v1.0.2

NodeJS版本：

*	增加``-o path``或``--output path``定义输出目录
*	修复``-d``或``--define-syntax``可能失效的问题
*	修改``-w``或``--watch``参数启动后的规则：只监控模板修改，而不再编译所有模板
*	增强调试特性：模板语法错误将在控制台输出调试源码，并停止进程

###	v1.0.1

NodeJS版本：

*	支持监控目录，即时编译
*	使用命令行传递参数
*	使用 npm 管理包
*	支持设置简洁语法

###	v1.0.0

*	支持前端模板按文件与目录组织，自动处理 include 依赖
*	NodeJS 与 Windows 批处理版本同时发布


© cdc.tencent.com

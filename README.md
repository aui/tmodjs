#	TmodJS

TmodJS（原名 atc）是前端模板开发工具，它采用预编译技术让前端模板实现工程化。

##	为什么要使用它？

从前，浏览器甚至都没有提供一个好用的调试工具，我们依然能够通过 alert 完成手头上的工作，似乎就这样满足了。突然有一天你使用了 Firebug 等工具后，你才会知道以前缺乏工具的日子过得多么艰苦。

现在我们手上已经有了很多基础工具用来解决前端工程中不同的问题，而在前端模板领域却一直缺乏有效的自动优化工具，而 TmodJS 便是这样一个专注于前端模板的辅助开发工具。

对于前端开发者而言，TmodJS 可以像你现在手上使用的开发利器一样：一旦上手，便爱不释手。

使用 TmodJS，下面美好即将发生：

1.	在开发阶段将编译模板为高性能的 js 文件
2.	实现前端模板按文件与目录组织，脱离页面
3.	支持模板之间支持引入外部模板
4.	使用同步模板加载接口
5.	可选输出多种 js 模块格式
6.	支持接入第三方构建工具
7.	编译后的模板支持前端与后端运行
8.	支持检测修改即时编译
9.	支持本地调试模板

有点意思？请继续阅读：《[进击！前端模板工程化](http://aui.github.io/tmodjs/)》

##	安装

先安装 [NodeJS](http://nodejs.org) 与 Npm (最新版 NodeJS 已经附带 Npm)，执行：

```
npm install -g tmodjs
```	

> Mac OSX 可能需要管理员权限运行： ``sudo npm install -g tmodjs``


##	快速入门

学习 TmodJS 只需要理解这四个关键点就好，3 分钟可入门：

###	一、前端模板目录

TmodJS 的前端模板不再耦合在业务页面中，而是和后端模板一样有专门的目录管理。目录名称支持英文、数字、下划线。

###	二、模板与语法

一个模板对应一个文件，模板后缀可以是``.html``、``.htm``、``.tpl``。

模板支持输出变量、条件判断、循环、包含子模板，请查看：[模板语法参考](https://github.com/aui/tmodjs/wiki/模板语法)

###	三、编译模板

```
tmod [模板根目录] [配置参数]
```

####	模板目录

可以不填，默认使用当前工作目录。

####	配置参数
            
*	``-d``或``--debug``输出调试版本
*	``--charset value``定义模板编码，默认``utf-8``
*	``--output value``定义输出目录，默认``./build``
*	``--type value``定义输出模块格式，默认``default``，可选``cmd``、``amd``、``commonjs``
*	``--watch-off``不监控模板修改
*	``--version``显示版本号
*	``--help``显示帮助信息

配置参数将会保存在模板目录[配置文件](#配置)中，下次运行无需输入配置参数（``-d`` 与 ``--watch-off`` 除外）。

####	示例

```
tmod ./tpl --debug
```

>	如果需要设置模板更多的编译选项，请使用``--config``参数，它会打开模板目录的项目配置文件，可设置语法、公用辅助方法、压缩选项等，参考[配置](#配置)。

###	四、调用模板

模板编译后，模板目录会生成 build 子目录，里面包含了所有的模板编译版本。编译后的模板可以使用同步接口加载模板。

需要注意的是，TmodJS 的 ``type``参数设置会改变模板的加载方式。

####	1. 默认类型格式的使用方式

模板的``type``为默认值（``type:default``）的时候，TmodJS 默认将整个目录的模板压缩合并到一个名为 template.js 的脚本中，通常情况下你只需要在页面中引入它就好。例如：

	<script src="tpl/build/template.js"></script>

除此之外 template.js 还支持 RequireJS、SeaJS、NodeJS 加载。[示例](http://aui.github.io/tmodjs/test/index.html)

加载并渲染模板示例：

```	
// 注意：模板路径不能包含后缀名
var html = template('news/list', {hot: [...]});
document.getElementById('list').innerHTML = html;
```

以上是 TmodJS 默认的模板加载方式，其他``type``请参考：

####	2. 其他类型格式使用方式（amd / cmd / commonjs)

这个时候每个模板编译后都是一个 js 模块，每个模板可在模块中单独引入，无需引入 template.js 文件，加载并渲染模板示例：

```
var html = require('./tpl/build/news/list');
document.getElementById('list').innerHTML = html;
```

##	编译演示项目

[TmodJS 源码包](https://github.com/aui/tmodjs/archive/master.zip)中``./test/tpl``是一个演示项目的前端模板目录。你可以通过这个演示项目快速了解 TmodJS 用法以及模板语法、模板加载方式。

首先，使用``cd``命令切换到 TmodJS 源码的``./test/tpl``目录后，然后运行命令：

```
tmod
```

编译完毕后你可以在浏览器中打开 [test/index.html](http://aui.github.io/tmodjs/test/index.html) 查看如何加载模板。

## 对外接口

若想集成 TmodJS 到其它自动化工具中（如 GruntJS），可以使用 TmodJS 提供的 API 来接入：

```
var TmodJS = require('tmodjs');

// 模板目录
var path = './demo/templates';

// 配置（更多请参考文档）
var options = {
	output: './build',
	charset: 'utf-8',
	debug: false // 此字段不会保存在配置中
};

// 初始化 TmodJS
// path {String}	模板根目录
// options {Object} 选项
TmodJS.init(path, options);

// 监听编译过程的事件
// 支持的事件有：compile、change、load、compileError、combo
TmodJS.on('compile', function (data) {});

// 编译模板
// file {String} 参数可选，无则编译整个模板目录，否则编译指定的模板文件
// recursion {Boolean} 若为 false 则不编译依赖的模板
TmodJS.compile(file, recursion);

// 监控模板修改
TmodJS.watch();

// 获取用户配置
//TmodJS.getUserConfig();

// 保存用户设置到模板目录 package.json 文件中
TmodJS.saveUserConfig();

```	

##	配置

配置最终会保存在模板目录 package.json 文件中，你可以修改``"tmodjs-config"``字段，配置说明：

```
// 编译输出目录设置
output: './build',

// 模板使用的编码。（注意：非 utf-8 编码的模板缺乏测试）
charset: 'utf-8',

// 定义模板采用哪种语法，内置可选：
// simple: 默认语法，易于读写。可参看语法文档
// native: 功能丰富，灵活多变。语法类似微型模板引擎 tmpl
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
// default:     模板目录将会打包后输出，可使用 script 标签直接引入，也支持 NodeJS/RequireJS/SeaJS。
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
```
	
##	常见问题

**问**：TmodJS 需要部署到服务器中吗？

> 不需要，这是本地工具，基于 NodeJS 编写是为了实现跨平台。

**问**：如何将每个模板都编译成单独的 amd/cmd 模块输出？

> 指定 type 参数即可，如``--type cmd``则可以让每个模板都支持 RequireJS/SeaJS 调用。

**问**：如何将模板编译成 NodeJS 的模块？

> 指定 type 参数即可，如``--type commonjs``。

**问**：线上运行的模板报错了如何调试？

> 开启 debug 模式编译，如``-d``，这样会输出调试版本，可以让你快速找到模板运行错误的语句以及数据。

**问**：如何不压缩输出 js？

> 编辑配置文件，设置``"minify": false``。

**问**：如何修改默认的输出目录？

> 指定 output 参数即可，如``--output ../../build``。

**问**：如何让模板访问全局变量？

> 请参考：[辅助方法](https://github.com/aui/tmodjs/wiki/辅助方法)。

**问**：可以使用使用类似 tmpl 那种的 js 原生语法作为模板语法吗？

> 可以。编辑配置文件，设置``"syntax": "native"``即可，这也是模板引擎 artTemplate 的默认语法，目前 TmodJS 默认使用的是 simple 语法。

**问**：如何兼容旧版本 atc 的项目？

> 编辑配置文件，分别设置``"type": "cmd"``、``"syntax": "native"``、``"output": "./"``

**问**：如何迁移原来写在页面中的 artTemplate 模板，改为 TmodJS 这种按按文件存放的方式？

> 请参考：[页面中的模板迁移指南](https://github.com/aui/tmodjs/wiki/页面中的模板迁移指南)。

**问**：我需要手动合并模板，如何让 tmodjs 不合并输出？

> 编辑配置文件，设置``combo: false``。

##	更新日志

###	v0.1.1

*	修复无逻辑的模板在 Safari 浏览器上兼容问题
*	默认开启模板实时监控。取消请使用``--watch-off``
*	给压缩打包合并后的每条模板增加版本标记，例如``/*v:13*/``，以便对比线上版本
*	增加``compileStart``与``compileEnd``事件

###	v0.1.0

*	增加自动递增的模板版本号，控制台可显示模板被修改的次数
*	优化默认设置下的文件输出，仅保留``template.js``，临时文件使用隐藏的``.cache``目录存放
*	自动清理``.debug.js``文件
*	对非规范的``include``语句模板在编译过程给予提示
*	修复``compileError``事件触发异常的 bug
*	减少对磁盘的读写，优化性能

###	v0.0.4

*	增加``escape``配置，如果后台给出的数据已经进行了 XSS 过滤，就可以关闭模板的默认过滤以提升模板渲染效率
*	简化``combo``功能，default只提供全部合并与不合并两个选项，值为布尔类型（兼容旧的版本的配置，会自动转换成布尔类型）
*	取消鸡肋的异步载入插件，同时``async``配置失效
*	为了便于理解，命令行输入的``--output``参数不再相对于模板目录，而是工作目录（配置文件的``output``参数仍保持不变）
*	优化控制台日志显示

###	v0.0.3

*	修复``combo``配置不能为空数组的 BUG
*	支持页面内嵌动态编译与预编译两种方案共存（请设置``engine:true``，并在页面中中引入 TmodJS 输出的 template.js。如果想让 template.js 不内置合并的模板，可以设置``combo:[]``）
*	运行时性能优化
*	增加``alias``配置字段，在 AMD 与 CMD 模式下可以指定运行时依赖 ID

###	v0.0.2

修复极其特殊情况下 TmodJS 无法为 AMD/CMD 模块正确声明依赖的问题[#14](https://github.com/aui/tmodjs/issues/14)

###	v0.0.1

这是一个革命性的版本！同时项目更名为 **TmodJS**，内部版本号收归到 0.0.1，这是一个新的开始，未来将稳步更新。

使用 TemplageJS 格式的模块作为默认输出的类型：它包含模板目录中所有模板，除了支持页面 Script 直接引入之外还支持 RequireJS、SeaJS、NodeJS 加载，并且接口统一，跨架构与前后端运行！

详细更新列表：

*	吸收了来自业务的一些建议，编译方案的大调整，内部进行无数次优化，编译后的代码更小。
*	编译后的脚本使用统一的接口：``template(path, data)`` 其中 path 相对于 template.js 所在目录
*	自动打包目录与子目录的模板
*	可选支持异步载入模板功能
*	可选嵌入完整模板引擎（使用字符串存储模板）
*	可选支持 RequireJS/SeaJS/NodeJS 模块
*	保存模板配置文件（方便多人协作中使用版本管理工具共享配置）
*	可选编译调试版本
*	编译后的函数体优化
*	错误处理优化
*	``compile(file)``接口可递归编译依赖
*	增加``saveUserConfig``接口保存用户设置
*	默认语法变更：默认使用简洁语法，取消``--define-syntax``，并使用新的界定符 ``{{``与``}}``。[模板语法参考](https://github.com/aui/tmodjs/wiki/模板语法)
*	取消``--clone-helpers``参数

###	atc v1.0.3

*	默认使用简洁语法，取消--define-syntax，增加--no-define-syntax参数恢复原生语法
*	增加-t, --type设置输出的模块类型，默认 CMD ，可选：CMD | AMD | CommonJS。让模板可以前后端共用
*	优化无逻辑语句的模板编译后的函数体积
*	因 Windows 批处理无法模拟 NodeJS 的高级特性，atc 不再包含 Windows 批处理脚本，若需要可用批处理调用 NodeJS
*	模板语法的界定符有变更，请参考：模板语法

###	atc v1.0.2

NodeJS 版本：

*	增加``-o path``或``--output path``定义输出目录
*	修复``-d``或``--define-syntax``可能失效的问题
*	修改``-w``或``--watch``参数启动后的规则：只监控模板修改，而不再编译所有模板
*	增强调试特性：模板语法错误将在控制台输出调试源码，并停止进程

###	atc v1.0.1

NodeJS 版本：

*	支持监控目录，即时编译
*	使用命令行传递参数
*	使用 npm 管理包
*	支持设置简洁语法

###	atc v1.0.0

*	支持前端模板按文件与目录组织，自动处理 include 依赖
*	NodeJS 与 Windows 批处理版本同时发布

##	加入我们

如果你也认同 TmodJS 的理念、它能让你在开发中体会到书写模板的快乐，那么我希望你也能参与到 TmodJS 这个开源项目中来，无论是贡献代码或者撰写博文推广它等。

###	使用 TmodJS 的项目

*	QQ空间
*	腾讯视频
*	爱拍原创
*	Spa（迅雷）
*	MicroTrend（腾讯）
*	Tracker（腾讯）
*	……

[提交项目展示到 TmodJS 主页](https://github.com/aui/tmodjs/issues/1)

###	贡献名单

*	[@aui](https://github.com/aui)（糖饼，来自 QQ 空间前端团队）
*	[@TooBug](https://github.com/TooBug)（来自 CDC 前端团队）
*	[@Jsonzhang](https://github.com/Jsonzhang)（来自 CDC 前端团队，GruntJS 插件开发者）

###	特别感谢

*	[@warmhug](https://github.com/warmhug)（在工具雏形阶段的热心的测试与反馈）


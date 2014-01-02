#	TmodJS-前端模板编译工具

##	关于 TmodJS

TmodJS（原名 atc）是一款前端模板编译工具，它可以让前端模板外置、实现类似后端模板一样按文件与目录组织前端模板，并且模板之间可以使用``include``语句相互包含。

###	像后端一样书写前端模板

相对与前端模板，后端模板有两个优秀的特征：

1.	模板按文件与目录组织
2.	模板之间可以相互引用

通过 TmodJS 预编译技术让前端模板突破浏览器的文本文件加载限制，支持模板按文件存放，并且支持多层目录组织模板，并且模板之间可通过``include``语句进行复用。

在 TmodJS 的规范中，前端模板不再内嵌到页面中，而是使用专门的目录进行组织维护；使用路径作为模板的 ID，这样与源文件保持对应关系 —— 这样好处就是极大的增加了可维护性。例如：页面头部底部的公用模板可以放在 tpl/public 目录下，新闻栏目的模板可以放在 tpl/news 下面。

总之，使用文件系统来管理模板已经在服务器端模板中得到广泛的验证，而在前端也同样适用，无论项目规模是多么轻量或者庞大。

###	模板编译输出为 js 文件

它会将模板编译成 js 文件，编译后的代码体积非常小，不包含模板引擎也无需依赖脚本加载器。因为是预编译，省去前端模板客户端动态编译过程，也能够在移动设备中节省一定的系统资源。

###	支持接入 AMD 或者 CMD 部署工具

默认情况下，模板目录将会被打包成 js, 可以直接在页面中使用传统 Script 标签加载，简单且有效。除此之外还可以设置将单个模板文件输出为单个的 AMD 、CMD 异步模块，以便接入它们自动化部署工具进行深度定制化的优化，这样可以实现按需加载、合并等高级的优化手段。

###	横跨前后端运行

支持输出基于 NodeJS 的同步规范模块，前后端可轻松的共用同一套模板。

###	动态调试支持

支持输出调试版本，模板运行中错误可精确到模板源文件所在行。

###	即时编译

支持设置检测模板的修改进行即时编译，这样几乎可以忽略编译过程的存在，模板编写只需要这两个步骤：1、修改模板并保存 2、刷新浏览器预览效果

##	安装

先安装 [NodeJS](http://nodejs.org) 与 Npm (最新版 NodeJS 已经附带 Npm)，执行：

```
$ npm install -g tmodjs
```	

> Mac OSX 可能需要管理员权限运行： ``$ sudo npm install -g tmodjs``


##	快速入门

学习 TmodJS 只需要理解这四个关键点就好，5分钟可入门：

###	一、建立模板目录

TmodJS 的前端模板不再耦合在业务页面中，而是和后端模板一样有专门的目录管理。目录名称支持英文、数字、下划线。

###	二、编写模板

一个模板对应一个文件，模板后缀可以是``.html``、``.htm``、``.tpl``。

模板支持输出变量、条件判断、循环、包含子模板，请查看：[模板语法参考](https://github.com/aui/tmodjs/wiki/模板语法)

###	三、编译模板

```
$ tmod [模板目录] [配置参数]
```

示例：

```
$ tmod ./tpl -w -output ./build
```

####	模板目录

必须是模板的根目录，若无参数则为默认使用当前工作目录。

####	配置参数
            
*	``-w``或``--watch``设置监控模板修改触发编译
*	``-d``或``--debug``输出调试版本
*	``--charset value``定义模板编码，默认``utf-8``
*	``--output value``定义输出目录，默认``./build``
*	``--type value``定义输出模块格式，默认``templatejs``，可选``cmd``、``amd``、``commonjs``
*	``--version``显示版本号
*	``--help``显示帮助信息

配置参数将会保存在模板目录[配置文件](#配置)中，下次运行无需输入配置参数（-w 与 -d 除外）。

>	1.	如果你经常需要修改模板，可以开启``-w``参数，让它检测修改自动编译。
>	2.	如果需要设置模板更多的编译选项，请使用``--config``参数，它会打开模板目录的项目配置文件，可设置语法、公用辅助方法、压缩选项等，参考[配置](#配置)。

###	四、调用模板

模板编译后，模板目录会生成 build 子目录，里面包含了所有的模板编译版本。编译后的模板可以使用同步接口加载模板。

####	1. 默认类型格式的使用方式

模板的``type``为默认值（``type:templatejs``）的时候，TmodJS 默认将整个目录的模板压缩合并到一个名为 template.js 的脚本中，通常情况下你只需要在页面中引入它就好（其余的文件可暂时忽略）。例如：

	<script src="tpl/build/template.js"></script>

除此之外 template.js 还支持 RequireJS、SeaJS、NodeJS 加载。[示例](http://aui.github.io/tmodjs/test/index.html)

加载并渲染模板示例：

```	
var html = template('news/list', {hot: [...]});
document.getElementById('list').innerHTML = html;
```

####	2. 其他类型格式使用方式（amd / cmd / commonjs)

这个时候每个模板编译后都是一个 js 模块，每个模板可在模块中单独引入，无需引入 template.js 文件，加载并渲染模板示例：

```
var html = require('./tpl/build/news/list');
document.getElementById('list').innerHTML = html;
```

>	注意：模板路径 ID 不能包含模板后缀名

##	编译演示项目

[TmodJS 源码包](https://github.com/aui/tmodjs/archive/master.zip)中``./test``是一个演示项目，``./test/tpl``是项目的模板目录，``./test/index.html``是首页。你可以通过这个演示项目快速了解 TmodJS 用法以及模板语法、模板加载方式。

首先，使用 cd 命令切换到 TmodJS 源码的``./test/tpl``目录后，直接运行即可：

```
$ tmod
```

编译完毕后你可以在浏览器中打开 [test/index.html](http://aui.github.io/tmodjs/test/index.html) 查看如何加载模板。

## 对外接口

若想集成 TmodJS 到其它自动化工具中（如 GruntJS），可以使用 TmodJS 提供的 API：

```
var TmodJS = require('tmodjs');

// 模板目录
var path = './demo/templates';

// 配置
var options = {
	output: './build',
	charset: 'utf-8',
	debug: false // 此字段不会保存在配置中
};

// 初始化 TmodJS
// path {String}	模板目录
// options {Object} 选项
TmodJS.init(path, options);

// 编译模板
// file {String} 参数可选，无则编译整个模板目录，否则编译指定的模板文件
// recursion {Boolean} 若为 false 则不编译依赖的模板
TmodJS.compile(file, recursion);

// 监控模板修改
TmodJS.watch();

// 保存用户设置到模板目录 package.json 文件中
TmodJS.saveUserConfig();

// 监听编译过程的事件
// 支持：change、load、compileError、combo
TmodJS.on('compile', function (data) {});
```	

##	配置

配置最终会保存在模板目录 package.json 文件中，你可以修改``"tmodjs-config"``，配置说明：

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
// templatejs:  模板目录将会打包后输出，可使用 script 标签直接引入，也支持 NodeJS/RequireJS/SeaJS。
// cmd:         这是一种兼容 RequireJS/SeaJS 的模块（类似 atc v1版本编译结果）
// amd:         支持 RequireJS 等流行加载器
// commonjs:    编译为 NodeJS 模块
type: 'templatejs',

// 运行时别名
// 仅针对于非 templatejs 的类型模块
alias: null,

// 是否合并模板
// 仅针对于 templatejs 类型的模块
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

> 编辑配置文件，设置``combo:false``。

##	更新日志

###	TmodJS v0.0.4

*	简化``combo``功能，只提供全部合并与不合并两个选项，值为布尔类型（兼容旧的版本的配置，会自动转换成布尔类型）。
*	取消鸡肋的异步载入插件，同时``async``配置失效
*	为了便于理解，命令行输入的``--output``参数不再相对于模板目录，而是工作目录（配置文件的``output``参数仍保持不变）
*	优化控制台日志显示

###	TmodJS v0.0.3

*	修复``combo``配置不能为空数组的 BUG
*	支持页面内嵌动态编译与预编译两种方案共存（请设置``engine:true``，并在页面中中引入 TmodJS 输出的 template.js。如果想让 template.js 不内置合并的模板，可以设置``combo:[]``）
*	运行时性能优化
*	增加``alias``配置字段，在 AMD 与 CMD 模式下可以指定运行时依赖 ID

###	TmodJS v0.0.2

修复极其特殊情况下 TmodJS 无法为 AMD/CMD 模块正确声明依赖的问题[#14](https://github.com/aui/tmodjs/issues/14)

###	TmodJS v0.0.1

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

*	[@aui](https://github.com/aui)
*	[@TooBug](https://github.com/TooBug)
*	[@Jsonzhang](https://github.com/Jsonzhang)（GruntJS 插件开发者）

###	特别感谢

*	[@warmhug](https://github.com/warmhug)（在工具雏形阶段的热心的测试与反馈）

--------------------

附：为何要创造 TmodJS？请阅读[《进击！前端模板之工程化》](http://aui.github.io/tmodjs/)
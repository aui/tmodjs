#	TmodJS

TmodJS（原名 atc）是一个简单易用的前端模板预编译工具。它通过预编译技术让前端模板突破浏览器限制，实现后端模板一样的同步“文件”加载能力。它采用目录来组织维护前端模板，从而让前端模板实现工程化管理，最终保证前端模板在复杂单页 web 应用下的可维护性。同时预编译输出的代码经过多层优化，能够在最大程度节省客户端资源消耗。

一、**按文件与目录组织模板**

```
template('tpl/home/main', data)
```

二、**模板支持引入子模板**

```
{{include '../public/header'}}
```

TmodJS 一经启动，就无需人工干预，每次模板创建与更新都会自动编译，引入一个 js 即可使用``template(path)``接口调用本地模板文件，直到正式上线都无需对代码进行任何修改，整个过程简单自然。

##	所有特性

0.	编译模板为不依赖引擎的 js 文件
1.	前端模板按文件与目录组织
3.	模板之间支持引入外部模板
4.	使用同步模板加载接口
5.	可选多种规范的模块输出：AMD、CMD、CommonJS
6.	支持作为 GruntJS 的插件构建项目
7.	模板目录可被前后端共享
8.	支持检测修改即时编译
9.	支持模板运行时调试
10.	配置文件支持多人共享

若想深入了解，请阅读：《[进击！前端模板工程化](https://github.com/aui/tmodjs/blob/master/doc/why-tmodjs.md)》

##	文档目录

*	[安装](#安装)
*	[编写模板](#编写模板)
*	[编译模板](#编译模板)
*	[使用模板](#使用模板)
*	[演示](#演示)
*	[配置](#配置)
*	[grunt](#grunt)
*	[gulp](#gulp)
*	[常见问题](#常见问题)
*	[更新日志](#更新日志)
*	[加入我们](#加入我们)
*	[授权协议](#授权协议)

##	安装

使用 [NodeJS](http://nodejs.org) 附带的``npm``命令，执行：

```
npm install -g tmodjs
```	

> Mac OSX 可能需要管理员权限运行： ``sudo npm install -g tmodjs``

##	编写模板

TmodJS 的前端模板不再耦合在业务页面中，而是和后端模板一样有专门的目录管理。目录名称只支持英文、数字、下划线的组合，一个模板对应一个``.html``文件。

支持基本的模板语法，如输出变量、条件判断、循环、包含子模板。[模板语法参考](https://github.com/aui/tmodjs/wiki/模板语法)

> 完全支持 [artTemplate](https://github.com/aui/artTemplate) 的语法

##	编译模板

只需要运行``tmod``这个命令即可，默认配置参数可以满足绝大多数项目。

```
tmod [模板目录] [配置参数]
```

模板目录必须是模板的根目录，若无参数则为默认使用当前工作目录，tmodjs 会监控模板目录修改，每次模板修改都会增量编译。

###	配置参数
            
*	``--debug``			输出调试版本
*	``--charset value`` 定义模板编码，默认``utf-8``
*	``--output value``  定义输出目录，默认``./build``
*	``--type value``	定义输出模块格式，默认``default``，可选``cmd``、``amd``、``commonjs``
*	``--no-watch``		关闭模板目录监控
*	``--version``		显示版本号
*	``--help``			显示帮助信息

配置参数将会保存在模板目录[配置文件](#配置)中，下次运行无需输入配置参数（``--no-watch`` 与 ``--debug`` 除外）。

####	示例

```
tmod ./tpl --output ./build
```

##	使用模板

根据编译的``type``的配置不同，会有两种不同使用方式：

###	使用默认的格式

TmodJS 默认将整个目录的模板压缩打包到一个名为 template.js 的脚本中，可直接在页面中使用它：

	<script src="tpl/build/template.js"></script>
	<script>
		var html = template('news/list', _list);
		document.getElementById('list').innerHTML = html;
	</script>

> template.js 还支持 RequireJS、SeaJS、NodeJS 加载。[示例](http://aui.github.io/tmodjs/test/index.html)

###	指定格式（amd / cmd / commonjs)

此时每个模板就是一个单独的模块，无需引用 template.js：

```
var render = require('./tpl/build/news/list');
var html = render(_list);
```

>	注意：模板路径不能包含模板后缀名

##	演示

[TmodJS 源码包](https://github.com/aui/tmodjs/archive/master.zip)中``test/tpl``是一个演示项目的前端模板目录，基于默认配置。切换到源码目录后，编译：

```
tmod test/tpl
```

编译完毕后你可以在浏览器中打开 [test/index.html](http://aui.github.io/tmodjs/test/index.html) 查看如何使用编译后的模板。

##	配置

TmodJS 的项目配置文件保存在模板目录的 package.json 文件中：

```
{
    "name": "template",
    "version": "1.0.0",
    "dependencies": {
        "tmodjs": "1.0.0"
    },
    "tmodjs-config": {
        "output": "./build",
        "charset": "utf-8",
        "syntax": "simple",
        "helpers": null,
        "escape": true,
        "compress": true,
        "type": "default",
        "runtime": "template.js",
        "combo": true,
        "minify": true,
        "cache": false
    }
}
```

字段 | 类型 | 默认值| 说明
------------ | ------------- | ------------ | ------------
output | String | ``"./build"`` | 编译输出目录设置
charset | String | ``"utf-8"`` | 模板使用的编码（暂时只支持 utf-8）
syntax | String | ``"simple"`` | 定义模板采用哪种语法。可选：``simple``、``native``
helpers | String | ``null`` | 自定义辅助方法路径
escape | Boolean | ``true`` | 是否过滤 XSS。如果后台给出的数据已经进行了 XSS 过滤，就可以关闭模板的过滤以提升模板渲染效率
compress | Boolean | ``true`` | 是否压缩 HTML 多余空白字符
type | String | ``"default"`` |  输出的模块类型，可选：``default``、``cmd``、``amd``、``commonjs``
runtime | String | ``"template.js"`` | 设置输出的运行时名称
alias | String | ``null`` | 设置模块依赖的运行时路径（仅针对于非``default``的类型模块配置字段。如果不指定模块内部会自动使用相对 runtime 的路径）
combo | Boolean | ``true`` | 是否合并模板（仅针对于 default 类型的模块）
minify | Boolean | ``true`` | 是否输出为压缩的格式
cache | Boolean | ``true`` | 是否开启编译缓存
	
##	grunt

让 TmodJS 作为 Grunt 的一个插件使用：

```
npm install grunt-tmod --save-dev
```

由[@Jsonzhang](https://github.com/Jsonzhang)开发，项目主页：

<https://github.com/Jsonzhang/grunt-tmod>

## gulp

让 TmodJS 作为 Gulp 的一个插件使用：

```
npm install gulp-tmod --save-dev
```

由[@lichunqiang](https://github.com/lichunqiang)开发，项目主页：

<https://github.com/lichunqiang/gulp-tmod>

##	常见问题

**问**：TmodJS 需要部署到服务器中吗？

> 不需要，这是本地工具，基于 NodeJS 编写是为了实现跨平台。

**问**：如何将每个模板都编译成单独的 amd/cmd 模块输出？

> 指定 type 参数即可，如``--type cmd``则可以让每个模板都支持 RequireJS/SeaJS 调用。

**问**：如何将模板编译成 NodeJS 的模块？

> 指定 type 参数即可，如``--type commonjs``。

**问**：线上运行的模板报错了如何调试？

> 开启 debug 模式编译，如``--debug``，这样会输出调试版本，可以让你快速找到模板运行错误的语句以及数据。

**问**：如何不压缩输出 js？

> 编辑配置文件，设置``"minify": false``。

**问**：如何修改默认的输出目录？

> 指定 output 参数即可，如``--output ../../build``。

**问**：如何让模板访问全局变量？

> 请参考：[辅助方法](https://github.com/aui/tmodjs/wiki/辅助方法)。

**问**：可以使用使用类似 tmpl 那种的 js 原生语法作为模板语法吗？

> 可以。编辑配置文件，设置``"syntax": "native"``即可，目前 TmodJS 默认使用的是 simple 语法。

**问**：如何兼容旧版本 atc 的项目？

> 编辑配置文件，分别设置``"type": "cmd"``、``"syntax": "native"``、``"output": "./"``

**问**：如何迁移原来写在页面中的 artTemplate 模板，改为 TmodJS 这种按按文件存放的方式？

> 请参考：[页面中的模板迁移指南](https://github.com/aui/tmodjs/wiki/页面中的模板迁移指南)。

**问**：我需要手动合并模板，如何让 tmodjs 不合并输出？

> 编辑配置文件，设置``combo:false``。

##	更新日志

### v1.0.1

*   解决新版本设置``"minify":true``输出后，输出的脚本中文没有被编码的问题
*   给引入后缀名的模板给予报错提示

###	v1.0.0

*	使用 artTemplate3.0 作为模板引擎，NodJS 可直接共享前端的模板目录的模板，无需预编译
*	提供 GruntJS 插件
*	取消``engine``配置
*	增加``runtime``配置
*	接口重构，支持多实例

###	v0.1.1

*	给压缩打包合并后的每条模板增加版本标记，例如``/*v:13*/``，以便对比线上版本

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

这是一个革命性的版本，内部大量优化！同时项目更名为 **TmodJS**，内部版本号收归到 0.0.1

使用 TemplageJS 格式的模块作为默认输出的类型：它包含模板目录中所有模板，除了支持页面 Script 直接引入之外还支持 RequireJS、SeaJS、NodeJS 加载，并且接口统一，跨架构与前后端运行！

详细更新列表：

*	吸收了来自业务的一些建议，编译方案的大调整，内部进行无数次优化，编译后的代码更小
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

TmodJS 是一个开源项目，如果你喜欢，非常期待你通过微博或者博客等来宣传 TmodJS。

###	使用 TmodJS 的项目

*	QQ空间
*	腾讯视频
*	爱奇艺
*	爱拍原创
*	Spa（迅雷）
*	MicroTrend（腾讯）
*	Tracker（腾讯）
*	UR（腾讯）
*	……

如果你使用了 TmodJS 敬请留下项目名，我们将在 TmodJS 主页展示你的项目。[提交](https://github.com/aui/tmodjs/issues/1)

###	代码贡献名单

*	[@aui](https://github.com/aui)
*	[@Jsonzhang](https://github.com/Jsonzhang)（grunt 插件作者）
*	[@lichunqiang](https://github.com/lichunqiang)（gulp 插件作者）
*	[@TooBug](https://github.com/TooBug)
*	[@bammoo](https://github.com/bammoo)

###	特别感谢

*	[@warmhug](https://github.com/warmhug)（在工具雏形阶段的热心的测试与反馈）

##	授权协议

BSD.

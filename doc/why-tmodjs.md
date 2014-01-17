<script>!function(a){function d(){for(c=0;c<b.length;c++)"viewport"==b[c].name&&(b[c].content="width=device-width, minimum-scale=0.25, maximum-scale=1.6")}var c,b=a.getElementsByTagName("meta");if(navigator.userAgent.match(/iPhone/i)){for(c=0;c<b.length;c++)"viewport"==b[c].name&&(b[c].content="width=device-width, minimum-scale=1.0, maximum-scale=1.0");a.addEventListener("gesturestart",d,!1)}}(document);</script>
#	进击！前端模板工程化

######	基于 TmodJS 前端模板工程化解决方案

##	前言

现在，越来越多的前端项目采用了单页或者混合式的架构，在这种架构中后端只负责吐出 JSON 数据，前端异步来渲染 HTML，前端模板被大量使用，与此同时也将引发开发维护与发布优化的问题。为了解决这些问题，我们开发了工具 TmodJS（原名 atc），试图通过本地自动化工具让端模板走上工程化之路。很高兴这个工具经过长达 8 个月的磨砺后，它从一个简陋的工具变成如今健壮的前端开发“利器”，并且已经有多个大型项目在使用它。现在我将对前端模板工程化的一些思考与总结分享出来，希望能够让大家更好的了解 TmodJS 的意义所在。在主题开始之前，先简单总结下这些年前端模板技术的发展。

##	手工拼接字符串时代

早期，开发人员都是直接在 js 文件中采用最原始的方式直接拼接 HTML 字符串：

	var html = '';
	for (var i = 0, users = data.users; i < users.length; i ++) {
		html += '<li><a href="'
		+ users[i].url
		+ '">'
		+ users[i].name
		+ '</a></li>';
	}
	//...

这种方式刚开始在一两个简单的页面中还是比较灵活的，但弊端也十分明显：UI 与逻辑代码混杂在一起，阅读起来会非常吃力。一旦随着业务复杂起来，或者多人维护的情况下，几乎会失控。

##	前端模板引擎时代

受 jquery 作者的 tmpl 模板引擎影响，从 09 年开始到现在，前端模板引擎出现了百花齐放的局面，涌现出一大批行色各异的引擎，几乎每个前端工程中都使用了模板引擎。一条前端模板类似这样：

	<script id="user_tmpl" type="text/html">
	{{each users as value}}
		<li>
			<a href="{{value.url}}">{{value.name}}</a>
		</li>
	{{/each}}
	</script>

它使用一个特殊的``<script type="text/html"></script>``标签来存放模板（由于浏览器不支持这种类型的声明，它存放的代码不会当作 js 运行，代码也不会被显示出来）。使用模板引擎渲染模板的示例：

	var html = tmpl('user_tmpl', data);
	document.getElementById('content').innerHTML = html;
	
[在线示例](http://aui.github.io/artTemplate/demo/simple-syntax/basic.html)
	
通过前端模板引擎将 UI 分离后，模板的书写与修改就变得简单多了，也提升了可维护性。但是，随着这种方式规模化后其弊端也随之而来。

###	页面内嵌模板之弊端

####	1. 开发调试

每次修改前端模板需要改动页面的代码，有时候存放模板的页面又依赖服务器，这使得我们无法使用使用类似 Fiddler 的工具将页面映射到本地进行开发，从而不得不传到服务器或者自己搭建本地服务器环境，以至于开发维护过程异常繁琐。

####	2. 体积优化

动态页面与前端模板结合的架构中，不利于浏览器缓存，通常在单页应用中，页面页面会堆砌着大量的``<script type="text/html"></script>``标签，每次进入应用都需要重新加载模板代码，造成不必要的网络开销。

####	3.	模板复用

比如类似“好友选择器”这样的公用模块，页面内嵌模板满足不了模板复用的需求。

以上三个问题本质都是因为模板堆砌在一个文件中造成的，于是越来越的项目开始将前端模板从页面中迁移出来，目前主要有两种方式：

###	优化：外置模板

####	1. Ajax 拉取方案

通过 Ajax 加载远程模板，然后再使用模板引擎解析。这种方式的好处就是模板可以按文件存放，书写起来也是十分便利，但弊端相当明显：

1.	无法跨域部署。这是由浏览器同源策略限制的，导致模板无法部署到 CDN 网络。
2.	复杂度比较高，难以接入主流的自动化部署、优化工具。

####	2. 在 JS 文件中存放模板

为避免上述加载模板方案无法跨域的致命缺陷，模板存放在 js 文件中又成了最佳实践方式。但是 js 需要对回车符进行转义，对书写不友好，例如：

	var user_tmpl =
	'{{each users as value}}\
		<li>\
			<a href="{{value.url}}">{{value.name}}</a>\
		</li>\
	{{/each}}';
	
或者：

	var user_tmpl =
	 '{{each users as value}}'
	+	'<li>'
	+		'<a href="{{value.url}}">{{value.name}}</a>'
	+	'</li>'
	+'{{/each}}';
	
###	模板存放方案优劣总结

存放方式 | 书写友好 | CDN 部署 | 本地调试 | 代码复用 | 按需加载
------ | ------ | ------ | ------ | ------ | ------ | ------
内嵌业务页中 | ✓ | ✗ | ✗ | ✗ | ✗
Ajax 远程加载 | ✓  | ✗| ✓ | ✓ | ✓
嵌入 js 文件 | ✗ | ✓ | ✓ | ✓ | ✓

在实践中我们发现：方便优化的模式不利于开发；利于开发的模式不利于优化。
	
业界后来出现了一些工具试图解决上述问题，如 Handlebars.js 与 Hogan.js（来自 Twitter） 采用了预编译技术来完成模板到 js 的转换，以 Handlebars.js 使用为例，先使用 NodeJS 安装它：

	$ npm install -g handlebars

然后提取模板内容（``script``标签之间）并保存到一个文件中。在这里我们把它保存为 ``user.tmpl``。运行 ``handlebars`` 命令预编译这个模板文件。

	$ handlebars user.tmpl -f user.tmpl.js

编译完成后就可以在前端应用中加载这个脚本，比如这样引入：

	<script src="user.tmpl.js"></script>
	
在逻辑中可以如下访问到模板函数：

	var template = Handlebars.templates["user.tmpl"];
	var html = template(data);

预编译工具在一定程度上解决了我们的问题，但由于操作实在是太繁琐，因此它们也并没有流行起来。前端模板因为大量的局部模板存在，相对于后端模板的一个显著特征是碎片化程度高，例如一个 web app 单页应用，几百条前端模板是常有的事儿，开发阶段我们会不断的添加、修改模板，如果每次都需要重新编译这简直会令人抓狂，与此同时大量零散的模板脚本也会引发新的问题，编译后的模板没有提供显式的依赖声明，对于大型项目来说，自动化工具依然难以介入。

于是，在这种情况下针对前端模板开发的全新工具 —— TmodJS 顺势而生，只为工程化而来。

##	工程化前端模板

TmodJS 采用一系列集成方案来最大化提升前端模板开发的效率与质量，本地预编译技术的运用使得我们不必局限于浏览器的技术限制，从而让我们更多的想法通过工具来执行，让前端模板可以大规模使用，从而创造更好的用户体验。

###	1. 基于文件系统

在 TmodJS 的规范中，前端模板不再内嵌到页面中，而是使用专门的目录进行组织维护；使用路径作为模板的 ID，这样与源文件保持对应关系 —— 这样好处就是极大的增加了可维护性。例如：页面头部底部的公用模板可以放在``tpl/public``目录下，首屏的模板可以放在``tpl/home``下面。

同时，模板内部也支持``include``语句来引入子模板，实现模块复用。例如：

	{{include './public/header'}}

每个模板就是一个 HTML 片段文件，前端开发工程师可直接将设计师的静态页面的 HTML 拷贝过来，无需对换行符转义，这样开发过程更加便利。

总之，使用文件系统来管理模板已经在服务器端模板中得到广泛的验证，而在前端也同样适用，无论项目规模是多么轻量或者庞大。

###	2. 使用同步加载接口

TmodJS 的同步接口是通过通过预先合并或者使用 AMD、CMD、CommonJS 规范实现，从而避免浏览器的异步加载带来的各种问题，如网络速度、回调套嵌等。

例如加载模板``home/index.html``，如果编译为默认类型的模块，使用如下加载方式：
	
	var tpl = template('home/index');
	var html = tpl(data);
	document.getElementById('content').innerHTML = html;
	
如果编译为 AMD、CMD、CommonJS 类型的模块，每个模板都是一个标准模块：
	
	var tpl = requier('./tpl/home/index');
	var html = tpl(data);
	document.getElementById('content').innerHTML = html;
	
###	3.	构建自动化

####	内置打包合并

在默认设置下，TmodJS 会将模板目录所有模板编译后再进行压缩与合并，输出后的 template.js 称之为模板包（内部名称叫 TemplateJS 格式）这种打包的方式非常适合移动端单页 WebApp，输出后的模板包可直接可作为开发阶段与线上运行的文件，适合中小型项目。

####	配合外部工具

当然，将所有前端模板都打包在一个文件中不一定适合每一个项目，因为很多大型项目需要更细致的优化，所以 TmodJS 还可以选择输出单个的 js 文件，这样这些模板脚本可以交给外部工具进行按需打包合并（例如 GruntJS）。

除此之外，如果编译为 AMD、CMD、CommonJS 类型的的模块，模板内部的``include``语句会编译成``requier('xxx/xxx')``形式声明依赖，接入 RequireJS 优化工具 r.js 或者 SeaJS 的 spm 可以完成精准依赖合并。

总之，模板转换为 js 后不但解决了跨域部署的烦恼，其优化手段也更加灵活多样。案例：

1.	**配合本地构建工具**：腾讯视频前端团队了关闭 TmodJS 的打包合并，让 TmodJS 接入 GruntJS，让 GruntJS 对 TmodJS 输出的脚本进行构建：按照网站栏目建立模板子目录，然后按栏目进行合压缩，然后让栏目页面单独引入合并后的栏目模板。
2.	**后端动态压缩合并**：QQ 空间 CDN 有线上 SeaJS 模块动态合并服务，这时候 TmodJS 编译后的模板会被当作一个普通的 SeaJS 模块引入到项目中，当 UI 模块被调用的时候逻辑与依赖的模板都会进行动态合并加载，完全无需本地构建工具操作。
3.	**自带的优化手段**：MicroTrend 是腾讯内部的一个移动端单页 WebApp 小项目，采用 TmodJS 进行模板管理后，模板被打包压缩到一个 js 文件中，开发阶段输出的模板包直接作为发布后的文件，十分便捷。[查看编译后的模板](http://microtrend.cdc.tencent.com/tpl/dist/template.js)

###	4. 本地调试支持

通常开发阶段模板会经常被修改，所以 TmodJS 支持监听模板目录的修改，当模板发生修改则会进行增量编译，时间久了甚至可以让人忘记编译过程的存在，完全忘记这是在写前端模板。

无论如何模板最终都会转换成 js，亦可使用 Fiddler 将线上模板映射到本地进行开发调试；如果开启实时编译，开发阶段模板修改后只需要刷新浏览器即可预览到效果。

通常在模板开发阶段会经常遇到数据与预期不符合的情况，前端模板调试成了一个棘手的问题，于是 TmodJS 支持编译调试版本，这样可以在运行时进行调试，控制台可以定位到出错模板所在的行：

	Template Error

	<id>
	public/header

	<name>
	Render Error

	<message>
	Cannot read property '0' of undefined

	<line>
	5

	<source>
	{{users[0].name}}

###	5. 前后端模板共用

前面提到，TmodJS 默认设置下会输出一个包含所有模板的模板包 template.js，这个文件可以兼容多种模块格式，除了通过``<script>``标签直接引入还可以使用 RequierJS、SeaJS、NodeJS 引入。RequierJS 的模块规范是 AMD，SeaJS 的模块是 CMD，而 NodeJS 的模块规范是 CommonJS —— 这几种规范有很多共同点，很容易进行兼容。这是模板包内部的实现方式：

    // RequireJS && SeaJS
    if (typeof define === 'function') {
        define(function() {
            return template;
        });

    // NodeJS
    } else if (typeof exports !== 'undefined') {
        module.exports = template;
        
    // <script src="...
    } else {
        global.template = template;
    }
   
模板包通过运行时判断后，会对不同的环境暴露对应 API，并且模板加载接口保持不变。

除此之外，还可以通过设置编译类型在浏览器端模块与 NodeJS 模块之间切换。无论如何，后端直出 HTML 与前端异步加载的混合架构将变得简单自然！

##	关于 TmodJS

起源于腾讯内部公用组件平台的开源项目（atc），开发成员来自来自腾讯 QQ 空间与 CDC 前端团队。

**TmodJS 主页**：<https://github.com/aui/tmodjs>

###	愿景

希望 TmodJS 能成为每个前端开发者必备的利器！

###	问题

问：TmodJS 需要部署到服务器中吗？

> 答：不需要，这是本地开发工具。

问：TmodJS 的编译后模板性能如何？

> 答：TmodJS 预编译器基于 artTemplate，artTemplate 的执行速度是业界领先的模板引擎之一（仍在不断优化中）。[速度对比](http://aui.github.io/artTemplate/test/test-speed.html)

问：将模板编译成 js 语句会导致体积增加吗？

> 答：不会，一般情况下还能起到压缩的效果。例如在腾讯 Microtrend 项目为例：中采用 TmodJS 编译后，原来 Gzip 下 14kb 模板变成 7kb，压缩率高达到 50%，原因：1、模板编译器会压缩 HTML 多余字符 2、编译后代码简练且不再依赖模板引擎。[查看编译后的模板](http://microtrend.cdc.tencent.com/tpl/dist/template.js)

问：原来页面上使用 artTemplate 的模板可以无缝迁移到 TmodJS 这种基于文件系统的模板中来吗？

> 答：完全可以。甚至可以浏览器动态编译与本地预编译混合使用。

问：前端模板能防范 XSS 漏洞么？

> 答：编译后的 JS 默认会对每一处输出语句进行扫描过滤，模板书写无需考虑安全问题。

###	使用 TmodJS 的项目

*	QQ 空间
*	腾讯视频
*	Spa（迅雷）
*	MicroTrend（腾讯）
*	Tracker（腾讯）
*	……

###	反馈

在项目遇到问题可以抛出来，我们共同解决。[问题与建议](https://github.com/aui/tmodjs/issues)

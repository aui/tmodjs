#	atc-前端模板预编译器

<http://cdc-im.github.io/atc>

======================================

##	前言

随着 HTML5 时代到来，前端技术在不断的发展壮大，我们为此欣喜若狂。但作为一名前端开发者，我们也不无时无刻的感受到很多看似平常的技术因为浏览器制约难以在前端中实现，其中之一便是模板技术。
	
虽然我们已经有了很多优秀的前端模板引擎可以选择，但前端模板技术与服务器模板技术却完全不是一个层面的东西，受浏览器限制，前端模板按文件与目录组织、include 这些基本的特性几乎无法实现，如：

	<%include('./public/header')%>
	<h3><%=title%></h3>
	<ul>
	    <% for (i = 0; i < list.length; i ++) { %>
	       <li>
	        	<a href="<%= list[i].url %>">
	        		<%= list[i].title %>
	        	</a>
	       </li>
	    <% } %>
	</ul>
	<%include('./public/footer')%>
	
而前端模板最佳实践是把所有模板使用``<script type="text/html" ..``标签写在页面里面。[示例](http://aui.github.io/artTemplate/demo/basic.html) 

随着应用越来越复杂、模板越来越多、模板各种依赖出现的时候，我们的页面也变得臃肿不堪、难以维护，以至于我们不得不拿出各种技巧进行所谓优化，如抽离到js中、按需加载等。回过头再来看这些最佳实践，我们不经意之间为了解决一个问题引发了更多的问题，如跨域部署、依赖管理、压缩、按需加载、请求合并等。

辛苦的忙碌后，这时候是不是会怀念服务端那种按目录、文件简单的模板组织方式呢？其实，前端模板完全可以做到！

##	关于 atc

atc 即 artTemplate compiler，基于 [artTemplate](https://github.com/aui/artTemplate) 实现的前端模板预编译器，使用它可以让前端模版不再受浏览器的限制，支持如后端模版一样按文件放置、include 语句等特性。

编译后的模板不再依赖模板引擎，模板可以通过 [SeaJS](http://seajs.org) 或 [RequireJS](http://requirejs.org) 等加载器进行异步加载，亦能利用它们成熟的打包合并工具进行上线前的优化。

##	三分钟上手

首先 [下载 atc](https://github.com/cdc-im/atc/archive/master.zip) 并解压。

*	compiler.cmd --- Windows 绿色批处理版本
*	compiler.js	--- NodeJS 跨平台版

跑一个测试例子就能明白如何使用了：

###	运行示例

批处理版本双击即可运行，打开后它会自动编译``./demo/templates/``中所有模板文件，并生成同名 js 文件。([NodeJS](http://nodejs.org) 版本使用``node compiler.js``运行)

编译结束后你可以打开``./demo/index.html``，看其模板被浏览器加载的过程。

模板预编译一切就这么简单！

[在线查看编译好的示例](http://cdc-im.github.io/atc/demo/)

##	模板语法

atc 是 [artTemplate](https://github.com/aui/artTemplate) 的子项目，语法也与其保持一致，亦可通过它的插件简化模板语法。

###	原生语法

默认支持原生语法，正如本文开头的模板示例便就是 atc 标准语法。

模板使用``<%``与``%>``作为逻辑语句开始与闭合的标签，输出变量使用``=``或者``==``号开头，不同的是前者会对内容进行编码，以避免 XSS 漏洞。

###	简版语法

如果想使用简单的模板语法，可以把``./lab/template-syntax.js``合并至``./lab/template.js``即可。

本文开头的模板示例使用简单语法可以简化为：

	{include './public/header'}
	<h3>{title}</h3>
	<ul>
	    {each list}
	       <li>
	        	<a href="{$value.url}">
	        		{$value.title}
	        	</a>
	       </li>
	    {/each}
	</ul>
	{include './public/footer'}
	
[简单语法详情](http://aui.github.com/artTemplate/extensions/index.html)

##	设置配置

右键可直接编辑编译工具的源码修改配置：

	// 设置前端模板目录路径
	var $path = './demo/templates/';

	// 设置待处理的模版编码
	var $charset = 'UTF-8';

	// 设置辅助方法编译方式：为true则克隆到每个编译后的文件中，为false则单独输出到文件
	var $cloneHelpers = false;
	
	
##	模板 include 语句规范

为了让编译工具能够进行静态分析，需要如下约定：

1.	路径参数不能带后缀名
2.	路径参数不能够进行动态拼装

**错误的写法：**

	<%include('./index.html')%>	
	<%include('./tmpl-' + type)%>
	<%include(path)%>

======================================


© cdc.tencent.com

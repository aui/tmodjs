#	atc-前端模板预编译器

<http://cdc-im.github.io/atc>

======================================

##	前言

随着 HTML5 时代到来，前端技术在不断的发展壮大，我们为此欣喜若狂。但作为一名前端开发者，我们也不无时无刻的感受到很多看似平常的技术因为浏览器制约难以在前端中实现，其中之一便是模板技术。
	
虽然我们已经有了很多优秀的前端模板引擎可以选择，但前端模板技术与服务端模板技术却完全不是一个层面的东西，受浏览器限制，前端模板按文件与目录组织、include 这些基本的特性几乎无法实现，如：

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

如何才是最佳的前端模板组织方案呢？

##	关于 atc

atc 即 artTemplate compiler，基于 [artTemplate](https://github.com/aui/artTemplate) 实现的前端模板预编译器，使用它可以让前端模版不再受浏览器的限制，支持如后端模版一样按文件放置、include 语句等特性，前端模板规模化后带来的弊端迎刃而解！

编译后的模板不再依赖模板引擎，模板可以通过 [SeaJS](http://seajs.org) 或 [RequireJS](http://requirejs.org) 等加载器进行异步加载，亦能利用它们成熟的打包合并工具进行上线前的优化。

##	三分钟上手

跑一个演示例子就能明白如何使用了，以批处理版本为例：

首先 [下载 atc](https://github.com/cdc-im/atc/archive/master.zip) 并解压。

双击 compiler.cmd 即可运行，打开后它会自动编译 ./demo/templates/ 中所有模板文件，并生成同名 js 文件。模板预编译一切就这么简单！

编译结束后你可以打开 [./demo/index.html](http://cdc-im.github.io/atc/demo/)，看其模板如何被浏览器加载。

其中演示模板 ./demo/templates/index.html 使用了``include``语句引用了多个公用模板，但使用者无需关心模板内部的包含关系，公用模板会被自动提前加载。

##	版本

###	Windows 批处理版本

``compiler.cmd ``无依赖第三方环境，双击即可运行，简单实用。打开后它会自动编译 ./demo/templates/ 中所有模板文件（你可以右键编辑 compiler.cmd 的配置修改模板目录）

###	NodeJS 版本

可以跨平台使用，也可以实时监控模板每一次保存的动作而进行编译（默认不开启）

####	安装

	npm install template-compiler -g

####	调用

	atc [options] path

其中``path``是前端模板目录，例如：``atc -w demo/templates``

####	[options] 配置参数
            
*	``-w``或``--watch``实时监控模板修改
*	``-d``或``--define-syntax``使用简单模板语法编译模板（自动加载语法扩展）
*	``-c``或``--charset``设置模板编码，默认``utf-8``
*	``--clone-helpers``设置辅助方法克隆到编译后的函数，默认外置($helpers.js)
*	``--version``显示 atc 版本号
*	``--help``显示帮助信息

##	模板语法

atc 是 [artTemplate](https://github.com/aui/artTemplate) 的子项目，语法也与其保持一致，亦可通过它的插件简化模板语法。

###	原生语法

默认支持原生语法，正如本文开头的模板示例便就是 atc 支持的标准语法。

模板使用``<%``与``%>``作为逻辑语句开始与闭合的标签，输出变量使用``=``或者``==``号开头，不同的是前者会对内容进行编码，以避免 XSS 漏洞。

###	简版语法

如果想使用简单的模板语法，可以把``./lab/template-syntax.js``合并至``./lab/template.js``即可（NodeJS版本开启``-d``参数会自动加载语法扩展，无需手动合并）。

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

##	模板 include 语句规范

为了让编译工具能够进行静态分析，需要如下约定：

1.	路径不能带后缀名
2.	路径不能够进行字符串运算
3.	路径不能使用变量

**以下三种写法都是错误的：**

1.	``<%include('./index.html')%>``路径不能带后缀名
2.	``<%include('.' + '/idnex')%>``路径不能够进行字符串运算
3.	``<%include(value)%>``路径不能使用变量

======================================


© cdc.tencent.com

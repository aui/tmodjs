#	TmodJS-运行测试例子

##	一、运行默认设置测试例子

###	编译

切换到当前目录

	$ cd test/tpl

然后执行 tmod 命令

```
$ tmod
```

###	在浏览器中加载模板

模板经过编译后，支持普通脚本引入与 SeaJS 、RequireJS 等模块管理器调用。

*	使用普通脚本加载模板：[templatejs.html](templatejs.html)
*	使用 RequireJS 加载模板：[requirejs.html](requirejs.html)
*	使用 SeaJS 加载模板：[seajs.html](seajs.html)

###	在 NodeJS 中加载模板

运行示例：

	$ node node.js
	
##	二、运行其他设置测试例子

``test/test-all`` 下每个目录都是一个独立的模板项目，它们设置了不同的配置属性，切换到目录后可以单独编译。目录有对应的同名``.html``文件，可以用来查看效果。

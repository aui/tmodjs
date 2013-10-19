#	TmodJS-运行测试例子

切换到当前目录，执行 tmod 命令

```
$ cd tmodjs/test
$ tmod templates
```
如果终端返回如下信息，表示模板已经编译完成

```
./copyright.html √
./index.html √
./public/footer.html √
./public/header.html √
./public/logo.html √
```
##	在浏览器中加载模板

模板经过编译后，支持普通脚本引入与 SeaJS 、RequireJS 等模块管理器调用。

*	使用普通脚本加载模板：[templatejs.html](templatejs.html)
*	使用 RequireJS 加载模板：[requirejs.html](requirejs.html)
*	使用 SeaJS 加载模板：[seajs.html](seajs.html)

##	在 NodeJS 中加载模板

运行示例：

	$ node node.js
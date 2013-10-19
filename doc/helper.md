# 辅助方法

===========

为了模板可维护，模板本身是不能随意访问外部数据的，它所有的语句都将运行在一个沙箱中。如果需要访问外部对象可以注册辅助方法，这样所有的模板都能访问它们。

##	一、新建一个辅助方法文件配置

在模板目录新建一个 ./config/template-helper.js 文件，然后编辑 ./package.json 设置``"helpers": "./config/template-helper.js"``。

##	二、编写辅助方法

在 ./config/template-helper.js 中声明辅助方法。

###	示例

1\. 让模板可访问全局的``Math``对象：

```
template.helper('Math', Math);
```

2\.	扩展一个 UBB 替换方法：

```
template.helper('$ubb2html', function (content) {
	return content
	.replace(/\[b\]([^\[]*?)\[\/b\]/igm, '<b>$1</b>')
	.replace(/\[i\]([^\[]*?)\[\/i\]/igm, '<i>$1</i>')
	.replace(/\[u\]([^\[]*?)\[\/u\]/igm, '<u>$1</u>')
	.replace(/\[url=([^\]]*)\]([^\[]*?)\[\/url\]/igm, '<a href="$1">$2</a>')
	.replace(/\[img\]([^\[]*?)\[\/img\]/igm, '<img src="$1" />');
});
```

##	三、在模板中使用辅助方法
	
在模板中的使用方式：

```
{{Math.min(1000, a, b)}}
{{$ubb2html content}}
```	

> 注意：引擎不会对辅助方法输出的 HTML 字符进行转义。
# 模板语法（simple）

===========

TmodJS 默认采用 simple 语法，它非常易于读写。

## 表达式

``{{``与``}}``符号包裹起来的语句则为模板的逻辑表达式。

### 输出表达式

输出模板变量：

```
{{content}}
```

默认会对变量中 HTML 字符编码输出，避免 XSS 漏洞。

输出原始模板变量 - 不编码：

```
{{#content}}
```

### 条件表达式

```
{{if admin}}
	{{content}}
{{/if}}
{{if user === 'admin'}}
	{{content}}
{{else if user === '007'}}
	<strong>hello world</strong>
{{/if}}
```

### 遍历表达式

无论数组或者对象都可以用``each``进行遍历。

```
{{each list}}
	<li>{{$index}}. {{$value.user}}</li>
{{/each}}
```

其中 list 为要遍历的数据名称, ``$value`` 与 ``$index`` 是系统变量， ``$value`` 表示数据单条内容, ``$index`` 表示索引值，这两个变量也可以自定义：

```
{{each list as value index}}
	<li>{{index}}. {{value.user}}</li>
{{/each}}
```

### 模板包含表达式

例如嵌入一个 inc 目录下名为 demo 的模板：

```
{{include './inc/demo'}}
```

还可以传入指定的数据到子模板：

```
{{include './inc/demo' data}}
```

####	include 路径规范约定

1.	路径不能带后缀名
2.	路径不能够进行字符串运算
3.	路径不能使用变量代替
4.	必须使用以``.``开头的相对路径

## 辅助方法

这属于插件的范畴，请参考：<https://github.com/aui/tmodjs/wiki/辅助方法>

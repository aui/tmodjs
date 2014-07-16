# 页面中的模板迁移指南

如果你之前项目中采用的是 artTemplate 则很容易迁移到 TmodJS 中来，因为 TmodJS 也是基于 artTemplate 的子项目，不同的是模板是预编译的。

迁移过程比较简单，大约如下四个步骤：

##	一、迁移模板

迁移模板之前，首先需要在你的项目中新建一个前端模板目录，然后寻找页面中类似这样的模板内容：

```
<script id="test" type="text/html">
<h1><%=title%></h1>
<ul>
	<%for(i = 0; i < list.length; i ++) {%>
    	<li>条目内容 <%=i + 1%> ：<%=list[i]%></li>
	<%}%>
</ul>
</script>
```

然后将``<script>``标签包裹的内容复制后另存为 test.html（不包括``<script>``标签本身），其余的模板以此类推，全部剥离后你可以删掉页面中的这些模板。

##	二、配置 TmodJS

使用``cd``命令切换到刚才建立的前端模板目录，然后执行：

```
tmod
```

可能执行后控制台会报错，请无视它，重要的是此时模板目录多出了一个 package.json 文件，这就是 TmodJS 的项目配置文件了，可以编辑它。

###	指定语法

因为 TmodJS 默认采用了简洁版本的语法，而 artTemplate 默认的是原生语法，所以需要配置下语法。

```
"syntax": "native"
```

> 在 artTemplate v3.0 中，默认语法已经改为``simple``语法。

还有一种情况是，你可能使用了 artTemplate v2.0.1 的语法扩展，而 TmodJS 使用的是 v2.0.2 的语法，两者最大的差别是逻辑语句界定符，所以你需要指定旧的模板语法位置：

```
"syntax": "./config/template-syntax.js"
```

###	指定辅助方法

如果你还使用了辅助方法，那么也需要复制辅助方法到一个 js 文件中，并且指定配置，例如：

```
"helpers": "./config/template-helpers.js"
```

##	三、编译

再次执行：

```
tmod
```

一般情况下模板可以准确无误的编译输出了。

##	四、调用

其中 build/template.js 是压缩后的模板包，你可以将页面中 artTemplate 的标签更改为：

```
<script src="tpl/build/template.js"></script>
```

至此，迁移流程已经结束，业务代码中的逻辑无需修改，接口还是原来的接口！

##	其他问题

**问**：模板报错后为何找不到原来的调试信息了？

>	你可以开启调试``tmod --debug``编译可调试版本，这样就和从前一样了。
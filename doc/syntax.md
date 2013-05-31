# atc 模板语法

===========


## 表达式

``{{`` 与 ``}}`` 符号包裹起来的语句则为模板的逻辑表达式。

### 输出表达式

对内容编码输出：


    {{content}}


编码可以防止数据中含有 HTML 字符串，避免引起 XSS 攻击。

不编码输出：


    {{echo content}}


### 条件表达式


    {{if admin}}
    	{{content}}
    {{/if}}
    
    {{if user === 'admin'}}
    	{{content}}
    {{else if user === '007'}}
    	<strong>hello world</strong>
    {{/if}}


### 遍历表达式

无论数组或者对象都可以用 each 进行遍历。


    {{each list}}
    	<li>{{$index}}. {{$value.user}}</li>
    {{/each}}


其中 list 为要遍历的数据名称, ``$value`` 与 ``$index`` 是系统变量， ``$value`` 表示数据单条内容, ``$index`` 表示索引值，这两个变量也可以自定义：


    {{each list as value index}}
    	<li>{{index}}. {{value.user}}</li>
    {{/each}}


### 模板包含表达式

用于嵌入子模板。


    {{include './demo'}}

还可以传入指定的数据到字模板：

    {{include './demo' data}}
    
为了让编译工具能够进行静态分析，需要如下约定：

1.	路径无需带后缀名
2.	路径不能够进行字符串运算
3.	路径不能使用变量

**以下三种写法都是错误的：**

1.	``{{include './index.html'}}``路径不能带后缀名
2.	``{{include '.' + '/idnex'}}``路径不能够进行字符串运算
3.	``{{include value}}``路径不能使用变量


## 辅助方法

修改 ./lib/template-syntax.js 可设置辅助方法，例如添加 UBB 替换方法：


    template.helper('$ubb2html', function (content) {
        return content
        .replace(/\[b\]([^\[]*?)\[\/b\]/igm, '<b>$1</b>')
        .replace(/\[i\]([^\[]*?)\[\/i\]/igm, '<i>$1</i>')
        .replace(/\[u\]([^\[]*?)\[\/u\]/igm, '<u>$1</u>')
        .replace(/\[url=([^\]]*)\]([^\[]*?)\[\/url\]/igm, '<a href="$1">$2</a>')
        .replace(/\[img\]([^\[]*?)\[\/img\]/igm, '<img src="$1" />');
    });


模板中使用的方式：


    {{$ubb2html content}}


若辅助方法有多个参数使用一个空格分隔即可：


    {{helperName args1 args2 args3}}
    

>	1. 编译器会对定义的辅助方法以类似 toString() 方法输出
>	2. 语法定义文件在 ./lib/template-syntax.js 中，可自行修改
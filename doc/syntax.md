# atc 模板语法

===========


## 表达式

``{{`` 与 ``}}`` 符号包裹起来的语句则为模板的逻辑表达式。

### 输出表达式

输出模板变量：


    {{content}}


默认会对变量中 HTML 字符编码输出，避免 XSS 漏洞。

输出原始模板变量 - 不编码：


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

例如嵌入一个 inc 目录下名为 demo 的模板：


    {{include './inc/demo'}}

还可以传入指定的数据到子模板：

    {{include './inc/demo' data}}


####	规范约定

1.	路径无需带后缀名
2.	路径不能够进行字符串运算
3.	路径不能使用变量代替
    

>	*	语法定义文件在 ./lib/template-syntax.js 中，可自行修改
>	*	atc v1.0.3 默认使用了简洁语法代替 js 原生语法，使用``--no-define-syntax``参数可以恢复使用原生 js 语法
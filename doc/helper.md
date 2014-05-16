# 辅助方法

===========

为了模板可维护，模板本身是不能随意访问外部数据的，它所有的语句都将运行在一个沙箱中。如果需要访问外部对象可以注册辅助方法，这样所有的模板都能访问它们。

##	一、新建一个辅助方法文件配置

在模板目录新建一个 config/template-helper.js 文件，然后编辑 package.json 设置``"helpers": "./config/template-helper.js"``。

##	二、编写辅助方法

在 config/template-helper.js 中声明辅助方法。

###	示例

以日期格式化为例：

```
template.helper('dateFormat', function (date, format) {

    date = new Date(date);

    var map = {
        "M": date.getMonth() + 1, //月份 
        "d": date.getDate(), //日 
        "h": date.getHours(), //小时 
        "m": date.getMinutes(), //分 
        "s": date.getSeconds(), //秒 
        "q": Math.floor((date.getMonth() + 3) / 3), //季度 
        "S": date.getMilliseconds() //毫秒 
    };
    format = format.replace(/([yMdhmsqS])+/g, function(all, t){
        var v = map[t];
        if(v !== undefined){
            if(all.length > 1){
                v = '0' + v;
                v = v.substr(v.length-2);
            }
            return v;
        }
        else if(t === 'y'){
            return (date.getFullYear() + '').substr(4 - all.length);
        }
        return all;
    });
    return format;
});
```
	

##	三、在模板中使用辅助方法

```
{{time | dateFormat:'yyyy-MM-dd hh:mm:ss'}}
```	

----------------------------------------------

本文档针对 TmodJS v1.0.0+ 编写
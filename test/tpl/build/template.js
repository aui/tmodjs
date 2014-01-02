/*<TMODJS> <BUILD:1388680338968> <DEBUG>*/
!function(global) {
    var template = function(path, content) {
        return template[/string|function/.test(typeof content) ? "compile" : "render"].apply(template, arguments);
    };
    var cache = template.cache = {};
    var toString = function(value, type) {
        if (typeof value !== "string") {
            type = typeof value;
            if (type === "number") {
                value += "";
            } else if (type === "function") {
                value = toString(value.call(value));
            } else {
                value = "";
            }
        }
        return value;
    };
    var escapeMap = {
        "<": "&#60;",
        ">": "&#62;",
        '"': "&#34;",
        "'": "&#39;",
        "&": "&#38;"
    };
    var escapeHTML = function(content) {
        return toString(content).replace(/&(?![\w#]+;)|[<>"']/g, function(s) {
            return escapeMap[s];
        });
    };
    var isArray = Array.isArray || function(obj) {
        return {}.toString.call(obj) === "[object Array]";
    };
    var each = function(data, callback) {
        if (isArray(data)) {
            for (var i = 0, len = data.length; i < len; i++) {
                callback.call(data, data[i], i, data);
            }
        } else {
            for (i in data) {
                callback.call(data, data[i], i);
            }
        }
    };
    var resolve = function(from, to) {
        var DOUBLE_DOT_RE = /(\/)[^/]+\1\.\.\1/;
        var dirname = from.replace(/^([^.])/, "./$1").replace(/[^/]+$/, "");
        var id = dirname + to;
        id = id.replace(/\/\.\//g, "/");
        while (id.match(DOUBLE_DOT_RE)) {
            id = id.replace(DOUBLE_DOT_RE, "/");
        }
        return id;
    };
    var helpers = template.helpers = {
        $include: function(path, data, from) {
            var id = resolve(from, path);
            return template.render(id, data);
        },
        $string: toString,
        $escape: escapeHTML,
        $each: each
    };
    var debug = function(e) {
        var message = "";
        for (var name in e) {
            message += "<" + name + ">\n" + e[name] + "\n\n";
        }
        if (message && global.console) {
            console.error("Template Error\n\n" + message);
        }
        return function() {
            return "{Template Error}";
        };
    };
    template.render = function(path, data) {
        var fn = template.get(path) || debug({
            id: path,
            name: "Render Error",
            message: "No Template"
        });
        return data ? fn(data) : fn;
    };
    template.compile = function(path, fn) {
        var isFunction = typeof fn === "function";
        var render = cache[path] = function(data) {
            try {
                return isFunction ? new fn(data, path) + "" : fn;
            } catch (e) {
                return debug(e)();
            }
        };
        render.prototype = fn.prototype = helpers;
        render.toString = function() {
            return fn + "";
        };
        return render;
    };
    template.get = function(id) {
        return cache[id.replace(/^\.\//, "")];
    };
    template.helper = function(name, helper) {
        helpers[name] = helper;
    };
    template("copyright", "(c) 2013");
    template("index", function($data, $id) {
        var $helpers = this, $line = 0, include = function(id, data) {
            data = data || $data;
            var $text = $helpers.$include(id, data, $id);
            $out += $text;
            return $text;
        }, $escape = $helpers.$escape, title = $data.title, $each = $helpers.$each, list = $data.list, $value = $data.$value, $index = $data.$index, $out = "";
        try {
            $line = 1;
            include("./public/header");
            $out += ' <div id="main"> <h3>';
            $line = 4;
            $out += $escape(title);
            $out += "</h3> <ul> ";
            $line = 6;
            $each(list, function($value, $index) {
                $out += ' <li><a href="';
                $line = 7;
                $out += $escape($value.url);
                $out += '">';
                $line = 7;
                $out += $escape($value.title);
                $out += "</a></li> ";
                $line = 8;
            });
            $out += " </ul> </div> ";
            $line = 12;
            include("./public/footer");
        } catch (e) {
            throw {
                id: $id,
                name: "Render Error",
                message: e.message,
                line: $line,
                source: "{{include './public/header'}}\n\n<div id=\"main\">\n	<h3>{{title}}</h3>\n	<ul>\n		{{each list}}\n	    <li><a href=\"{{$value.url}}\">{{$value.title}}</a></li>\n	    {{/each}}\n	</ul>\n</div>\n\n{{include './public/footer'}}".split(/\n/)[$line - 1].replace(/^[\s\t]+/, "")
            };
        }
        return new String($out);
    });
    template("public/footer", function($data, $id) {
        var $helpers = this, $line = 0, time = $data.time, $escape = $helpers.$escape, include = function(id, data) {
            data = data || $data;
            var $text = $helpers.$include(id, data, $id);
            $out += $text;
            return $text;
        }, $out = "";
        try {
            $out += '<div id="footer"> ';
            $line = 2;
            if (time) {
                $out += " <p class='time'>";
                $line = 3;
                $out += $escape(time);
                $out += "</p> ";
                $line = 4;
            }
            $out += " ";
            $line = 5;
            include("../copyright");
            $out += " </div>";
        } catch (e) {
            throw {
                id: $id,
                name: "Render Error",
                message: e.message,
                line: $line,
                source: "<div id=\"footer\">\n{{if time}}\n	<p class='time'>{{time}}</p>\n{{/if}}\n{{include '../copyright'}}\n</div>".split(/\n/)[$line - 1].replace(/^[\s\t]+/, "")
            };
        }
        return new String($out);
    });
    template("public/header", function($data, $id) {
        var $helpers = this, $line = 0, include = function(id, data) {
            data = data || $data;
            var $text = $helpers.$include(id, data, $id);
            $out += $text;
            return $text;
        }, $out = "";
        try {
            $out += ' <div id="header"> ';
            $line = 3;
            include("./logo");
            $out += ' <ul id="nav"> <li><a href="http://www.qq.com">首页</a></li> <li><a href="http://news.qq.com/">新闻</a></li> <li><a href="http://pp.qq.com/">图片</a></li> <li><a href="http://mil.qq.com/">军事</a></li> </ul> </div>  ';
        } catch (e) {
            throw {
                id: $id,
                name: "Render Error",
                message: e.message,
                line: $line,
                source: '<!-- 头部 开始 -->\n<div id="header">\n	{{include \'./logo\'}}\n	<ul id="nav">\n	    <li><a href="http://www.qq.com">首页</a></li>\n	    <li><a href="http://news.qq.com/">新闻</a></li>\n	    <li><a href="http://pp.qq.com/">图片</a></li>\n	    <li><a href="http://mil.qq.com/">军事</a></li>\n	</ul>\n</div>\n<!-- 头部 结束 --> '.split(/\n/)[$line - 1].replace(/^[\s\t]+/, "")
            };
        }
        return new String($out);
    });
    template("public/logo", '<!-- logo start -->\n<h1 id="logo">\n	<a href="http://www.qq.com">\n		<img width=\'134\' height=\'44\' src="http://mat1.gtimg.com/www/images/qq2012/qqlogo_1x.png" alt="腾讯网" />\n	</a> \n</h1>\n<!-- logo end -->');
    if (typeof define === "function") {
        define(function() {
            return template;
        });
    } else if (typeof exports !== "undefined") {
        module.exports = template;
    } else {
        global.template = template;
    }
}(this);
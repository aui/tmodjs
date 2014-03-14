/*TMODJS:{}*/
(function(global) {
    "use strict";
    var template = function(id, content) {
        return template[typeof content === "string" ? "compile" : "render"].apply(template, arguments);
    };
    template.version = "2.0.3";
    template.openTag = "<%";
    template.closeTag = "%>";
    template.isEscape = true;
    template.isCompress = false;
    template.parser = null;
    template.render = function(id, data) {
        var cache = template.get(id) || _debug({
            id: id,
            name: "Render Error",
            message: "No Template"
        });
        return cache(data);
    };
    template.compile = function(id, source) {
        var params = arguments;
        var isDebug = params[2];
        var anonymous = "anonymous";
        if (typeof source !== "string") {
            isDebug = params[1];
            source = params[0];
            id = anonymous;
        }
        try {
            var Render = _compile(id, source, isDebug);
        } catch (e) {
            e.id = id || source;
            e.name = "Syntax Error";
            return _debug(e);
        }
        function render(data) {
            try {
                return new Render(data, id) + "";
            } catch (e) {
                if (!isDebug) {
                    return template.compile(id, source, true)(data);
                }
                return _debug(e)();
            }
        }
        render.prototype = Render.prototype;
        render.toString = function() {
            return Render.toString();
        };
        if (id !== anonymous) {
            _cache[id] = render;
        }
        return render;
    };
    var _cache = template.cache = {};
    var _helpers = template.helpers = function() {
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
        return {
            $include: template.render,
            $string: toString,
            $escape: escapeHTML,
            $each: each
        };
    }();
    template.helper = function(name, helper) {
        _helpers[name] = helper;
    };
    template.onerror = function(e) {
        var message = "Template Error\n\n";
        for (var name in e) {
            message += "<" + name + ">\n" + e[name] + "\n\n";
        }
        if (global.console) {
            console.error(message);
        }
    };
    template.get = function(id) {
        var cache;
        if (_cache.hasOwnProperty(id)) {
            cache = _cache[id];
        } else if ("document" in global) {
            var elem = document.getElementById(id);
            if (elem) {
                var source = elem.value || elem.innerHTML;
                cache = template.compile(id, source.replace(/^\s*|\s*$/g, ""));
            }
        }
        return cache;
    };
    var _debug = function(e) {
        template.onerror(e);
        return function() {
            return "{Template Error}";
        };
    };
    var _compile = function() {
        var forEach = _helpers.$each;
        var KEYWORDS = "break,case,catch,continue,debugger,default,delete,do,else,false" + ",finally,for,function,if,in,instanceof,new,null,return,switch,this" + ",throw,true,try,typeof,var,void,while,with" + ",abstract,boolean,byte,char,class,const,double,enum,export,extends" + ",final,float,goto,implements,import,int,interface,long,native" + ",package,private,protected,public,short,static,super,synchronized" + ",throws,transient,volatile" + ",arguments,let,yield" + ",undefined";
        var REMOVE_RE = /\/\*[\w\W]*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|"(?:[^"\\]|\\[\w\W])*"|'(?:[^'\\]|\\[\w\W])*'|[\s\t\n]*\.[\s\t\n]*[$\w\.]+/g;
        var SPLIT_RE = /[^\w$]+/g;
        var KEYWORDS_RE = new RegExp([ "\\b" + KEYWORDS.replace(/,/g, "\\b|\\b") + "\\b" ].join("|"), "g");
        var NUMBER_RE = /^\d[^,]*|,\d[^,]*/g;
        var BOUNDARY_RE = /^,+|,+$/g;
        var getVariable = function(code) {
            return code.replace(REMOVE_RE, "").replace(SPLIT_RE, ",").replace(KEYWORDS_RE, "").replace(NUMBER_RE, "").replace(BOUNDARY_RE, "").split(/^$|,+/);
        };
        return function(id, source, isDebug) {
            var openTag = template.openTag;
            var closeTag = template.closeTag;
            var parser = template.parser;
            var code = source;
            var tempCode = "";
            var line = 1;
            var uniq = {
                $data: 1,
                $id: 1,
                $helpers: 1,
                $out: 1,
                $line: 1
            };
            var prototype = {};
            var variables = "var $helpers=this," + (isDebug ? "$line=0," : "");
            var isNewEngine = "".trim;
            var replaces = isNewEngine ? [ "$out='';", "$out+=", ";", "$out" ] : [ "$out=[];", "$out.push(", ");", "$out.join('')" ];
            var concat = isNewEngine ? "$out+=$text;return $text;" : "$out.push($text);";
            var print = "function($text){" + concat + "}";
            var include = "function(id,data){" + "data=data||$data;" + "var $text=$helpers.$include(id,data,$id);" + concat + "}";
            forEach(code.split(openTag), function(code) {
                code = code.split(closeTag);
                var $0 = code[0];
                var $1 = code[1];
                if (code.length === 1) {
                    tempCode += html($0);
                } else {
                    tempCode += logic($0);
                    if ($1) {
                        tempCode += html($1);
                    }
                }
            });
            code = tempCode;
            if (isDebug) {
                code = "try{" + code + "}catch(e){" + "throw {" + "id:$id," + "name:'Render Error'," + "message:e.message," + "line:$line," + "source:" + stringify(source) + ".split(/\\n/)[$line-1].replace(/^[\\s\\t]+/,'')" + "};" + "}";
            }
            code = variables + replaces[0] + code + "return new String(" + replaces[3] + ");";
            try {
                var Render = new Function("$data", "$id", code);
                Render.prototype = prototype;
                return Render;
            } catch (e) {
                e.temp = "function anonymous($data,$id) {" + code + "}";
                throw e;
            }
            function html(code) {
                line += code.split(/\n/).length - 1;
                if (template.isCompress) {
                    code = code.replace(/[\n\r\t\s]+/g, " ").replace(/<!--.*?-->/g, "");
                }
                if (code) {
                    code = replaces[1] + stringify(code) + replaces[2] + "\n";
                }
                return code;
            }
            function logic(code) {
                var thisLine = line;
                if (parser) {
                    code = parser(code);
                } else if (isDebug) {
                    code = code.replace(/\n/g, function() {
                        line++;
                        return "$line=" + line + ";";
                    });
                }
                if (code.indexOf("=") === 0) {
                    var isEscape = !/^=[=#]/.test(code);
                    code = code.replace(/^=[=#]?|[\s;]*$/g, "");
                    if (isEscape && template.isEscape) {
                        var name = code.replace(/\s*\([^\)]+\)/, "");
                        if (!_helpers.hasOwnProperty(name) && !/^(include|print)$/.test(name)) {
                            code = "$escape(" + code + ")";
                        }
                    } else {
                        code = "$string(" + code + ")";
                    }
                    code = replaces[1] + code + replaces[2];
                }
                if (isDebug) {
                    code = "$line=" + thisLine + ";" + code;
                }
                getKey(code);
                return code + "\n";
            }
            function getKey(code) {
                code = getVariable(code);
                forEach(code, function(name) {
                    if (!uniq.hasOwnProperty(name)) {
                        setValue(name);
                        uniq[name] = true;
                    }
                });
            }
            function setValue(name) {
                var value;
                if (name === "print") {
                    value = print;
                } else if (name === "include") {
                    prototype["$include"] = _helpers["$include"];
                    value = include;
                } else {
                    value = "$data." + name;
                    if (_helpers.hasOwnProperty(name)) {
                        prototype[name] = _helpers[name];
                        if (name.indexOf("$") === 0) {
                            value = "$helpers." + name;
                        } else {
                            value = value + "===undefined?$helpers." + name + ":" + value;
                        }
                    }
                }
                variables += name + "=" + value + ",";
            }
            function stringify(code) {
                return "'" + code.replace(/('|\\)/g, "\\$1").replace(/\r/g, "\\r").replace(/\n/g, "\\n") + "'";
            }
        };
    }();
    if (typeof define === "function") {
        define(function() {
            return template;
        });
    } else if (typeof exports !== "undefined") {
        module.exports = template;
    }
    global.template = template;
})(this);

(function(exports) {
    exports.openTag = "{{";
    exports.closeTag = "}}";
    exports.parser = function(code) {
        code = code.replace(/^\s/, "");
        var split = code.split(" ");
        var key = split.shift();
        var args = split.join(" ");
        switch (key) {
          case "if":
            code = "if(" + args + "){";
            break;

          case "else":
            if (split.shift() === "if") {
                split = " if(" + split.join(" ") + ")";
            } else {
                split = "";
            }
            code = "}else" + split + "{";
            break;

          case "/if":
            code = "}";
            break;

          case "each":
            var object = split[0] || "$data";
            var as = split[1] || "as";
            var value = split[2] || "$value";
            var index = split[3] || "$index";
            var param = value + "," + index;
            if (as !== "as") {
                object = "[]";
            }
            code = "$each(" + object + ",function(" + param + "){";
            break;

          case "/each":
            code = "});";
            break;

          case "echo":
            code = "print(" + args + ");";
            break;

          case "include":
            code = "include(" + split.join(",") + ");";
            break;

          default:
            if (exports.helpers.hasOwnProperty(key)) {
                code = "=#" + key + "(" + split.join(",") + ");";
            } else {
                code = code.replace(/[\s;]*$/, "");
                code = "=" + code;
            }
            break;
        }
        return code;
    };
})(template);

!function(global, template) {
    "use strict";
    var get = template.get;
    var helpers = template.helpers;
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
    helpers.$include = function(uri, data, from) {
        var id = resolve(from, uri);
        return template.render(id, data);
    };
    template.get = function(id) {
        return get(id.replace(/^\.\//, ""));
    };
}(this, this.template);
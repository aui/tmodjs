/*! <TmodJS> <build:'<:build:>'> '<:debug:>'*/

!function (global) {

    var template = function (path, content) {
        return template[
            /string|function/.test(typeof content) ? 'compile' : 'render'
        ].apply(template, arguments);
    };


    var cache = template.cache = {};
    var helpers = template.helpers = {

        $string: function (value) {

            var type = typeof value;

            if (!/string|number/.test(type)) {
                value = type === 'function'
                ? helpers.$string(value()) : '';
            }

            return value + '';
        },


        $escape: function (content) {
            var m = {
                "<": "&#60;",
                ">": "&#62;",
                '"': "&#34;",
                "'": "&#39;",
                "&": "&#38;"
            };
            return helpers.$string(content)
            .replace(/&(?![\w#]+;)|[<>"']/g, function (s) {
                return m[s];
            });
        },


        $each: function (data, callback) {
            var isArray = Array.isArray || function (obj) {
                return ({}).toString.call(obj) === '[object Array]';
            };
             
            if (isArray(data)) {
                for (var i = 0, len = data.length; i < len; i++) {
                    callback.call(data, data[i], i, data);
                }
            } else {
                for (i in data) {
                    callback.call(data, data[i], i);
                }
            }
        },


        $resolve: function (from, to) {
            var DOUBLE_DOT_RE = /(\/)[^/]+\1\.\.\1/;
            var dirname = from.replace(/[^/]+$/, '');
            var id = dirname + to;

            id = id.replace(/\/\.\//g, '/');
            while (id.match(DOUBLE_DOT_RE)) {
                id = id.replace(DOUBLE_DOT_RE, '/');
            }
            return id;
        },


        $include: function (path, data, from) {
            var id = helpers.$resolve(from, path);
            return template.render(id, data);
        }
        
    };


    var debug = function (e) {

        var message = '';
        for (var name in e) {
            message += '<' + name + '>\n' + e[name] + '\n\n';
        }

        if (message && global.console) {
            console.error('Template Error\n\n' + message);
        }
        
        return function () {
            return '{Template Error}';
        };
    };


    template.render = function (path, data) {
        var fn = template.get(path) || debug({
            id: path,
            name: 'Render Error',
            message: 'No Template'
        });

        return data ? fn(data) : fn;
    };


    template.compile = function (path, fn) {
        var isFunction = typeof fn === 'function';
        var render = cache[path] = function (data) {
            try {
                return isFunction ? new fn(data, path) + '' : fn;
            } catch (e) {
                return debug(e)();
            }
        };

        render.prototype = fn.prototype = helpers;
        render.toString = function () {
            return fn + '';
        };

        return render;
    };


    template.get = function (id) {
        return cache[id.replace(/^([^.])/, './$1')];
    };


    template.helper = function (name, helper) {
        helpers[name] = helper;
    };


    '<:helpers:>'
    '<:plugins:>'
    '<:templates:>' 


    // RequireJS && SeaJS
    if (typeof define === 'function') {
        define(function() {
            return template;
        });

    // NodeJS
    } else if (typeof exports !== 'undefined') {
        module.exports = template;
    } else {
        global.template = template;
    }

}(this);


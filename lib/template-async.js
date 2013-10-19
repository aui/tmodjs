/*!
 * artTemplate - Asynchronous load extension
 * https://github.com/aui/artTemplate
 * Released under the MIT, BSD, and GPL Licenses
 */
template.async = (function () {

	var helpers = template.helpers;
	var cache = template.cache;
	var resolve = helpers.$resolve;
	var each = helpers.$each;
	var isBrowser = typeof document !== 'undefined';
	var onload = 'onload';
	var onreadystatechange = 'onreadystatechange';
	var getElementsByTagName = 'getElementsByTagName';
    var INCLUDE_RE = /\binclude\s*\(\s*(["'])(.+?)\1\s*(,\s*(.+?)\s*)?\)/g;
    var SLASH_RE = /\\\\/g;
    var loadList = {};
   

	if (isBrowser) {
	    var doc = document;
	    var head = doc[getElementsByTagName]('head')[0] || doc.documentElement;
	    var baseElement = head[getElementsByTagName]('base')[0];

	    var READY_STATE_RE = /^(?:loaded|complete|undefined)$/;
	    var NAME_RE = /\btemplate\.js\b/;

	    var DIRNAME_RE = /[^?#]*\//;
	    var scripts = doc[getElementsByTagName]('script');
	    var current = scripts[scripts.length - 1];

	    each([].slice.call(scripts), function (script) {
	    	if (NAME_RE.test(script.src)) {
	    		current = script;
	    	}
	    })

		template.base = (
	        current.hasAttribute
	        ? current.src
	        : current.getAttribute('src', 4)
		).match(DIRNAME_RE)[0];

	} else {
		template.base = __dirname + '/';
	}

	// 加载器
    var loader = function (id, callback, charset) {

    	if (cache[id]) {
    		callback(id);
    		return;
    	}

    	var url = template.base + id + '.js';
    	
    	if (!isBrowser) {
			var fs = require('fs');
			var path = require('path');
			var vm = require("vm");
    		var tpl = fs.readFileSync(url, charset || 'utf-8');
			vm.runInNewContext(tpl, {
				template: template
			});
			callback(id);
    		return;
    	}


        var node = doc.createElement('script');

        if (charset) {
            node.charset = charset;
        }
        

        node[onload] = node[onreadystatechange] = function () {
            if (READY_STATE_RE.test(node.readyState)) {

                node[onload] = node[onreadystatechange] = null;

                head.removeChild(node);

                node = null;

                callback(id);
            }
        };

        node.async = true;
        node.src = url;


        baseElement ?
            head.insertBefore(node, baseElement) :
            head.appendChild(node);
    };


    var getDependencies = function (id, code) {

    	code = cache[id];
    	var dependencies = code.deps;

    	if (!dependencies) {
	        dependencies = [];
	        var uniq = {};

	        (code + '')
	        .replace(SLASH_RE, '')
	        .replace(INCLUDE_RE, function($1, $2, $3) {
	        	$3 = $3 && resolve(id, $3).replace(/^\.\//, '');
	            if ($3 && !uniq.hasOwnProperty($3)) {
	                dependencies.push($3);
	                uniq[$3] = true;
	            }
	        });

	        code.deps = dependencies;
    	}

		return dependencies;
    };

	var loadTemplates = function (list, callback, charset) {

		list = typeof list === 'string' ? [list] : list;

	    var ids = list.join(',');
	    var len = list.length;

	    if (loadList[ids] || !len) {
	    	loadList[ids] = true;
	        callback(cache[ids]);
	        return;
	    }

	    var counter = function (id) {
	        if (!--len) {
	            loadList[ids] = true;
	            callback(cache[id]);
	        }
	    };

	    each(list, function (id, index) {

	    	var render = cache[id];
			var cb = function () {
	            loadTemplates(getDependencies(id), function () {
	                loader(id, counter, charset);
	            }, charset);
	    	};

	    	render ? cb() : loader(id, cb, charset);
	    });
	};


    return loadTemplates;

})();

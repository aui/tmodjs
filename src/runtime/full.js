'<:engine:>'
'<:syntax:>'

!function (global, template) {
    
    'use strict';

    var get = template.get;
    var helpers = template.helpers;

    var resolve = function(from, to) {
        var DOUBLE_DOT_RE = /(\/)[^/]+\1\.\.\1/;
        var dirname = from.replace(/^([^.])/, './$1').replace(/[^/]+$/, "");
        var id = dirname + to;
        id = id.replace(/\/\.\//g, "/");
        while (id.match(DOUBLE_DOT_RE)) {
            id = id.replace(DOUBLE_DOT_RE, "/");
        }
        return id;
    };

    helpers.$include = function (uri, data, from) {
        var id = resolve(from, uri);
        return template.render(id, data);
    };

    template.get = function (id) {
        return get(id.replace(/^\.\//, ''));
    };

    '<:helpers:>'
    '<:templates:>' 

}(this, this.template);


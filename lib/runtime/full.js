/*<TMODJS> <build:'<:build:>'> '<:debug:>'*/

'<:engine:>'
!function (global, template) {

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

    helpers.$include = function (path, data, from) {
        var id = resolve(from, path);
        return template.render(id, data);
    };

    template.get = function (id) {
        return get(id.replace(/^\.\//, ''));
    };

    '<:syntax:>'
    '<:helpers:>'
    '<:templates:>' 

}(this, this.template);


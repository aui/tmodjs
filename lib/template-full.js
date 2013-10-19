/*! <TmodJS> <build:'<:build:>'> '<:debug:>'*/

'<:engine:>'
!function (global, template) {

    var get = template.get;
    var helpers = template.helpers;

    helpers.$resolve = function (from, to) {
        var DOUBLE_DOT_RE = /(\/)[^/]+\1\.\.\1/;
        var dirname = from.replace(/[^/]+$/, '');
        var id = dirname + to;

        id = id.replace(/\/\.\//g, '/');
        while (id.match(DOUBLE_DOT_RE)) {
            id = id.replace(DOUBLE_DOT_RE, '/');
        }
        return id;
    };

    helpers.$include = function (path, data, from) {
        var id = helpers.$resolve(from, path);
        return template.render(id, data);
    };

    template.get = function (id) {
        return get(id.replace(/^([^.])/, './$1'));
    };

    '<:syntax:>'
    '<:helpers:>'
    '<:plugins:>'
    '<:templates:>' 

}(this, this.template);


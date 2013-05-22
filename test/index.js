define(function (require) {
    var dependencies = {
        './public/header': require('./public/header'),
        './public/footer': require('./public/footer')
    };
    var helpers = require('./$helpers');
    var $render = function (id, data) {
            return dependencies[id](data);
        };
    var Render = function ($data) {
            'use strict';
            var $helpers = this,
                include = function (id, data) {
                    if (data === undefined) {
                        data = $data
                    }
                    var content = $helpers.$render(id, data);
                    if (content !== undefined) {
                        $out += content;
                        return content
                    }
                },
                $escape = $helpers.$escape,
                $string = $helpers.$string,
                title = $data.title,
                i = $data.i,
                list = $data.list,
                $out = '';
            $out += '';
            include('./public/header')
            $out += ' <div id="main"> <h3>';
            $out += $escape($string(title));
            $out += '</h3> <ul> ';
            for (i = 0; i < list.length; i++) {
                $out += ' <li><a href="';
                $out += $escape($string(list[i].url));
                $out += '">';
                $out += $escape($string(list[i].title));
                $out += '</a></li> ';
            }
            $out += ' </ul> </div> ';
            include('./public/footer')
            return new String($out)
        };
    Render.prototype = helpers;
    return function (data) {
        helpers.$render = $render;
        return new Render(data) + '';
    }
});
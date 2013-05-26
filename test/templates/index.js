;
(function () {
    var dependencies = {
        'taobao.header': namespace('taobao.header'),
        'taobao.footer': namespace('taobao.footer')
    };
    var helpers = {
        '$escape': function (content) {

            return typeof content === 'string' ? content.replace(/&(?![\w#]+;)|[<>"']/g, function (s) {
                return {
                    "<": "&#60;",
                    ">": "&#62;",
                    '"': "&#34;",
                    "'": "&#39;",
                    "&": "&#38;"
                }[s];
            }) : content;
        },
        '$string': function (value) {

            if (typeof value === 'string' || typeof value === 'number') {

                return value;

            } else if (typeof value === 'function') {

                return value();

            } else {

                return '';

            }

        }
    };
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
            include('taobao.header')
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
            include('taobao.footer')
            return new String($out)
        };
    Render.prototype = helpers;
    var result = function (data) {
            helpers.$render = $render;
            return new Render(data) + '';
        }
    namespace('jiawulu.index', result);
})();
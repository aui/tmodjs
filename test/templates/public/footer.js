;
(function () {
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
    var Render = function ($data) {
            'use strict';
            var $helpers = this,
                time = $data.time,
                $escape = $helpers.$escape,
                $string = $helpers.$string,
                $out = '';
            $out += '<div id="footer"> ';
            if (time) {
                $out += ' <p class=\'time\'>';
                $out += $escape($string(time));
                $out += '</p> ';
            }
            $out += ' </div>';
            return new String($out)
        };
    Render.prototype = helpers;
    var result = function (data) {
            return new Render(data) + '';
        }
    namespace('jiawulu.footer', result);
})();
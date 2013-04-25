define(function (require) {
    var helpers = require('../$helpers');
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
    return function (data) {
        return new Render(data) + '';
    }
});
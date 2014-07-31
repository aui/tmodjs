/*TMODJS:{"version":10,"md5":"8804d1e566c02e1752278f059521998e"}*/
define([ "./template", "./public/header", "./public/footer" ], function(template) {
    return template("index", function($data, $filename) {
        "use strict";
        var $utils = this, include = ($utils.$helpers, function(filename, data) {
            data = data || $data;
            var text = $utils.$include(filename, data, $filename);
            return $out += text;
        }), $escape = $utils.$escape, title = $data.title, $each = $utils.$each, list = $data.list, $out = ($data.$value, 
        $data.$index, "");
        return include("./public/header"), $out += ' <div id="main"> <h3>', $out += $escape(title), 
        $out += "</h3> <ul> ", $each(list, function($value) {
            $out += ' <li><a href="', $out += $escape($value.url), $out += '">', $out += $escape($value.title), 
            $out += "</a></li> ";
        }), $out += " </ul> </div> ", include("./public/footer"), new String($out);
    });
});
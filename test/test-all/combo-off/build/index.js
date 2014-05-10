/*TMODJS:{"version":4,"md5":"241e7b5d276c15b5ea88e96079b04d28"}*/
template("index", function($data, $filename) {
    "use strict";
    var $helpers = this, include = function(filename, data) {
        data = data || $data;
        var text = $helpers.$include(filename, data, $filename);
        return $out += text;
    }, $escape = $helpers.$escape, title = $data.title, $each = $helpers.$each, list = $data.list, $out = ($data.$value, 
    $data.$index, "");
    return include("./public/header"), $out += ' <div id="main"> <h3>', $out += $escape(title), 
    $out += "</h3> <ul> ", $each(list, function($value) {
        $out += ' <li><a href="', $out += $escape($value.url), $out += '">', $out += $escape($value.title), 
        $out += "</a></li> ";
    }), $out += " </ul> </div> ", include("./public/footer"), new String($out);
});
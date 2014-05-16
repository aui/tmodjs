/*TMODJS:{"version":6,"md5":"241e7b5d276c15b5ea88e96079b04d28"}*/
template("index", function($data, $filename) {
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
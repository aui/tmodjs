/*<TMODJS> <MD5:475b0d15e5f80f550925e52ed1bc3a10>*/
define(function(require) {
    require("./public/header");
    require("./public/footer");
    return require("template")("index", function($data, $id) {
        var $helpers = this, include = function(id, data) {
            data = data || $data;
            var $text = $helpers.$include(id, data, $id);
            $out += $text;
            return $text;
        }, $escape = $helpers.$escape, title = $data.title, $each = $helpers.$each, list = $data.list, $value = $data.$value, $index = $data.$index, $out = "";
        include("./public/header");
        $out += ' <div id="main"> <h3>';
        $out += $escape(title);
        $out += "</h3> <ul> ";
        $each(list, function($value, $index) {
            $out += ' <li><a href="';
            $out += $escape($value.url);
            $out += '">';
            $out += $escape($value.title);
            $out += "</a></li> ";
        });
        $out += " </ul> </div> ";
        include("./public/footer");
        return new String($out);
    });
});
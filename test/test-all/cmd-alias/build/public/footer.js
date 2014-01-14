/*TMODJS:{"version":2,"md5":"91b0bfeee484fd1caf31daf8bf403b1c"}*/
define(function(require) {
    require("../copyright");
    return require("template")("public/footer", function($data, $id) {
        var $helpers = this, time = $data.time, $escape = $helpers.$escape, include = function(id, data) {
            data = data || $data;
            var $text = $helpers.$include(id, data, $id);
            $out += $text;
            return $text;
        }, $out = "";
        $out += '<div id="footer"> ';
        if (time) {
            $out += " <p class='time'>";
            $out += $escape(time);
            $out += "</p> ";
        }
        $out += " ";
        include("../copyright");
        $out += " </div>";
        return new String($out);
    });
});
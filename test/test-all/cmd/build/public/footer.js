/*! <TmodJS> <MD5:0cb02d9a2a3111610298d89dc77d61e9>*/
define(function(require) {
    require("../copyright");
    return require("../template")("public/footer", function($data, $id) {
        var $helpers = this, time = $data.time, $escape = $helpers.$escape, include = function(id, data) {
            data = data || $data;
            var content = $helpers.$include(id, data, $id);
            if (content !== undefined) {
                $out += content;
                return content;
            }
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
/*TMODJS:{"version":1,"md5":"6599b97b0326fe559d5c1fbef543716a"}*/
define([ "../template", "../copyright" ], function(template) {
    return template("public/footer", function($data, $id) {
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
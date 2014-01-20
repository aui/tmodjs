/*TMODJS:{"version":2,"md5":"e616712eabe752419ca04ccf713b3eb8"}*/
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
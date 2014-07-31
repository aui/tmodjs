/*TMODJS:{"version":10,"md5":"59c2faf9fb8603adb836ad83babc2cd3"}*/
define([ "../template", "../copyright" ], function(template) {
    return template("public/footer", function($data, $filename) {
        "use strict";
        var $utils = this, time = ($utils.$helpers, $data.time), $escape = $utils.$escape, include = function(filename, data) {
            data = data || $data;
            var text = $utils.$include(filename, data, $filename);
            return $out += text;
        }, $out = "";
        return $out += '<div id="footer"> ', time && ($out += " <p class='time'>", $out += $escape(time), 
        $out += "</p> "), $out += " ", include("../copyright"), $out += " </div>", new String($out);
    });
});
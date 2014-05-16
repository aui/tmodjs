/*TMODJS:{"version":6,"md5":"2b64d110ff537c11e7b284f3d5ba6bca"}*/
template("public/footer", function($data, $filename) {
    "use strict";
    var $utils = this, time = ($utils.$helpers, $data.time), $escape = $utils.$escape, include = function(filename, data) {
        data = data || $data;
        var text = $utils.$include(filename, data, $filename);
        return $out += text;
    }, $out = "";
    return $out += '<div id="footer"> ', time && ($out += " <p class='time'>", $out += $escape(time), 
    $out += "</p> "), $out += " ", include("../copyright"), $out += " </div>", new String($out);
});
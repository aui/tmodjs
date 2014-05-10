/*TMODJS:{"version":4,"md5":"2b64d110ff537c11e7b284f3d5ba6bca"}*/
template("public/footer", function($data, $filename) {
    "use strict";
    var $helpers = this, time = $data.time, $escape = $helpers.$escape, include = function(filename, data) {
        data = data || $data;
        var text = $helpers.$include(filename, data, $filename);
        return $out += text;
    }, $out = "";
    return $out += '<div id="footer"> ', time && ($out += " <p class='time'>", $out += $escape(time), 
    $out += "</p> "), $out += " ", include("../copyright"), $out += " </div>", new String($out);
});
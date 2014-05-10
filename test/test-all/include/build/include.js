/*TMODJS:{"version":2,"md5":"34774a106c16d51b90f6ec081cd5de1f"}*/
define([ "./template", "./a", "./b", "./e", "./d" ], function(template) {
    return template("include", function($data, $filename) {
        "use strict";
        var $helpers = this, include = function(filename, data) {
            data = data || $data;
            var text = $helpers.$include(filename, data, $filename);
            return $out += text;
        }, xxx = ($data.labe, $data.xxx), $out = "";
        return include("./a", {
            labe: ")"
        }), include("./b", {
            labe: "("
        }), $out += " ", include("./e", {
            include: "./v"
        }), $out += " ", $out += " ", include("./d"), xxx.include("./c"), new String($out);
    });
});
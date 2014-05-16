/*TMODJS:{"version":3,"md5":"f4d1cc4066fb3f4e0e9bc077ebb9b79b"}*/
define([ "./template", "./a", "./b", "./e", "./d" ], function(template) {
    return template("include", function($data, $filename) {
        "use strict";
        var $utils = this, include = ($utils.$helpers, function(filename, data) {
            data = data || $data;
            var text = $utils.$include(filename, data, $filename);
            return $out += text;
        }), xxx = ($data.labe, $data.xxx), $out = "";
        return include("./a", {
            labe: ")"
        }), include("./b", {
            labe: "("
        }), $out += " ", include("./e", {
            include: "./v"
        }), $out += " ", $out += " ", include("./d"), xxx.include("./c"), new String($out);
    });
});
/*! <TmodJS> <MD5:1502bfe614907cbe7dfe457f1cc4a2ce>*/
define([ "./template", "./a", "./b", "./e", "./d" ], function(template) {
    return template("./include", function($data, $id) {
        var $helpers = this, include = function(id, data) {
            data = data || $data;
            var content = $helpers.$include(id, data, $id);
            if (content !== undefined) {
                $out += content;
                return content;
            }
        }, labe = $data.labe, xxx = $data.xxx, $out = "";
        include("./a", {
            labe: ")"
        });
        include("./b", {
            labe: "("
        });
        $out += " ";
        include("./e", {
            include: "./v"
        });
        $out += " ";
        if ("include('./n')") {}
        $out += " ";
        include("./d");
        xxx.include("./c");
        return new String($out);
    });
});
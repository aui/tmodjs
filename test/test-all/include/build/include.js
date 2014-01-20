/*TMODJS:{"version":2,"md5":"302a1925ef7e270689728351aa18bf36"}*/
define([ "./template", "./a", "./b", "./e", "./d" ], function(template) {
    return template("include", function($data, $id) {
        var $helpers = this, include = function(id, data) {
            data = data || $data;
            var $text = $helpers.$include(id, data, $id);
            $out += $text;
            return $text;
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
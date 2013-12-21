/*! <TmodJS> <MD5:9c755303b408bda6867838543a242d7e>*/
define([ "../template", "../copyright" ], function(template) {
    return template("public/footer", function($data, $id) {
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
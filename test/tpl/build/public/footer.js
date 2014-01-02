/*<TMODJS> <MD5:88e85e2955ea82ec1703aed916c5347f> <DEBUG>*/
template("public/footer", function($data, $id) {
    var $helpers = this, $line = 0, time = $data.time, $escape = $helpers.$escape, include = function(id, data) {
        data = data || $data;
        var $text = $helpers.$include(id, data, $id);
        $out += $text;
        return $text;
    }, $out = "";
    try {
        $out += '<div id="footer"> ';
        $line = 2;
        if (time) {
            $out += " <p class='time'>";
            $line = 3;
            $out += $escape(time);
            $out += "</p> ";
            $line = 4;
        }
        $out += " ";
        $line = 5;
        include("../copyright");
        $out += " </div>";
    } catch (e) {
        throw {
            id: $id,
            name: "Render Error",
            message: e.message,
            line: $line,
            source: "<div id=\"footer\">\n{{if time}}\n	<p class='time'>{{time}}</p>\n{{/if}}\n{{include '../copyright'}}\n</div>".split(/\n/)[$line - 1].replace(/^[\s\t]+/, "")
        };
    }
    return new String($out);
});
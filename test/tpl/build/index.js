/*<TMODJS> <MD5:caf7572a071fffebb6dff9beba6ed915> <DEBUG>*/
template("index", function($data, $id) {
    var $helpers = this, $line = 0, include = function(id, data) {
        data = data || $data;
        var $text = $helpers.$include(id, data, $id);
        $out += $text;
        return $text;
    }, $escape = $helpers.$escape, title = $data.title, $each = $helpers.$each, list = $data.list, $value = $data.$value, $index = $data.$index, $out = "";
    try {
        $line = 1;
        include("./public/header");
        $out += ' <div id="main"> <h3>';
        $line = 4;
        $out += $escape(title);
        $out += "</h3> <ul> ";
        $line = 6;
        $each(list, function($value, $index) {
            $out += ' <li><a href="';
            $line = 7;
            $out += $escape($value.url);
            $out += '">';
            $line = 7;
            $out += $escape($value.title);
            $out += "</a></li> ";
            $line = 8;
        });
        $out += " </ul> </div> ";
        $line = 12;
        include("./public/footer");
    } catch (e) {
        throw {
            id: $id,
            name: "Render Error",
            message: e.message,
            line: $line,
            source: "{{include './public/header'}}\n\n<div id=\"main\">\n	<h3>{{title}}</h3>\n	<ul>\n		{{each list}}\n	    <li><a href=\"{{$value.url}}\">{{$value.title}}</a></li>\n	    {{/each}}\n	</ul>\n</div>\n\n{{include './public/footer'}}".split(/\n/)[$line - 1].replace(/^[\s\t]+/, "")
        };
    }
    return new String($out);
});
/*TMODJS:{"version":2,"md5":"ec1bad2919c1f5938a2ddac95d097743"}*/
template("public/footer", function($data, $id) {
    var $helpers = this, time = $data.time, $escape = $helpers.$escape, include = function(id, data) {
        data = data || $data;
        var $text = $helpers.$include(id, data, $id);
        $out += $text;
        return $text;
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
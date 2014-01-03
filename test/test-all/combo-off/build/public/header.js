/*TMODJS:{"version":1,"md5":"1a90867e48c355a45f2d512c6e14dfb4"}*/
template("public/header", function($data, $id) {
    var $helpers = this, include = function(id, data) {
        data = data || $data;
        var $text = $helpers.$include(id, data, $id);
        $out += $text;
        return $text;
    }, $out = "";
    $out += ' <div id="header"> ';
    include("./logo");
    $out += ' <ul id="nav"> <li><a href="http://www.qq.com">首页</a></li> <li><a href="http://news.qq.com/">新闻</a></li> <li><a href="http://pp.qq.com/">图片</a></li> <li><a href="http://mil.qq.com/">军事</a></li> </ul> </div>  ';
    return new String($out);
});
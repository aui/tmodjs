/*TMODJS:{"version":6,"md5":"5a31ea62af555f35a18d394a92a27c04"}*/
template("public/header", function($data, $filename) {
    "use strict";
    var $utils = this, include = ($utils.$helpers, function(filename, data) {
        data = data || $data;
        var text = $utils.$include(filename, data, $filename);
        return $out += text;
    }), $out = "";
    return $out += ' <div id="header"> ', include("./logo"), $out += ' <ul id="nav"> <li><a href="http://www.qq.com">首页</a></li> <li><a href="http://news.qq.com/">新闻</a></li> <li><a href="http://pp.qq.com/">图片</a></li> <li><a href="http://mil.qq.com/">军事</a></li> </ul> </div>  ', 
    new String($out);
});
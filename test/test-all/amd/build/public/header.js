/*TMODJS:{"version":9,"md5":"1b08291b07538e26d351d02c635b2d46"}*/
define([ "../template", "./logo" ], function(template) {
    return template("public/header", function($data, $filename) {
        "use strict";
        var $utils = this, include = ($utils.$helpers, function(filename, data) {
            data = data || $data;
            var text = $utils.$include(filename, data, $filename);
            return $out += text;
        }), $out = "";
        return $out += ' <div id="header"> ', include("./logo"), $out += ' <ul id="nav"> <li><a href="http://www.qq.com">首页</a></li> <li><a href="http://news.qq.com/">新闻</a></li> <li><a href="http://pp.qq.com/">图片</a></li> <li><a href="http://mil.qq.com/">军事</a></li> </ul> </div>  ', 
        new String($out);
    });
});
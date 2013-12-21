/*! <TmodJS> <MD5:79e949fac04207e379c253caa83e37c2>*/
define([ "../template", "./logo" ], function(template) {
    return template("public/header", function($data, $id) {
        var $helpers = this, include = function(id, data) {
            data = data || $data;
            var content = $helpers.$include(id, data, $id);
            if (content !== undefined) {
                $out += content;
                return content;
            }
        }, $out = "";
        $out += ' <div id="header"> ';
        include("./logo");
        $out += ' <ul id="nav"> <li><a href="http://www.qq.com">首页</a></li> <li><a href="http://news.qq.com/">新闻</a></li> <li><a href="http://pp.qq.com/">图片</a></li> <li><a href="http://mil.qq.com/">军事</a></li> </ul> </div>  ';
        return new String($out);
    });
});
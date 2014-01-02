/*<TMODJS> <MD5:94209fadb67f42841713ac188e841c7a> <DEBUG>*/
template("public/header", function($data, $id) {
    var $helpers = this, $line = 0, include = function(id, data) {
        data = data || $data;
        var $text = $helpers.$include(id, data, $id);
        $out += $text;
        return $text;
    }, $out = "";
    try {
        $out += ' <div id="header"> ';
        $line = 3;
        include("./logo");
        $out += ' <ul id="nav"> <li><a href="http://www.qq.com">首页</a></li> <li><a href="http://news.qq.com/">新闻</a></li> <li><a href="http://pp.qq.com/">图片</a></li> <li><a href="http://mil.qq.com/">军事</a></li> </ul> </div>  ';
    } catch (e) {
        throw {
            id: $id,
            name: "Render Error",
            message: e.message,
            line: $line,
            source: '<!-- 头部 开始 -->\n<div id="header">\n	{{include \'./logo\'}}\n	<ul id="nav">\n	    <li><a href="http://www.qq.com">首页</a></li>\n	    <li><a href="http://news.qq.com/">新闻</a></li>\n	    <li><a href="http://pp.qq.com/">图片</a></li>\n	    <li><a href="http://mil.qq.com/">军事</a></li>\n	</ul>\n</div>\n<!-- 头部 结束 --> '.split(/\n/)[$line - 1].replace(/^[\s\t]+/, "")
        };
    }
    return new String($out);
});
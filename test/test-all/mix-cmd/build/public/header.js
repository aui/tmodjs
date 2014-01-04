/*TMODJS:{"version":1,"md5":"90bde39e11e49b42ffea5e5d22ceab72"}*/
define(function(require) {
    require("./logo");
    return require("../template")("public/header", ' <div id="header"> {{include \'./logo\'}} <ul id="nav"> <li><a href="http://www.qq.com">首页</a></li> <li><a href="http://news.qq.com/">新闻</a></li> <li><a href="http://pp.qq.com/">图片</a></li> <li><a href="http://mil.qq.com/">军事</a></li> </ul> </div>  ');
});
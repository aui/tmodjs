/*TMODJS:{"version":3,"md5":"17ebd37bac4153494830ed007a60b392"}*/
template('.//public/header',function($data,$filename) {
'use strict';var $helpers=this,include=function(filename,data){data=data||$data;var text=$helpers.$include(filename,data,$filename);$out+=text;return $out;},$out='';$out+=' <div id="header"> ';
include('./logo');
$out+=' <ul id="nav"> <li><a href="http://www.qq.com">首页</a></li> <li><a href="http://news.qq.com/">新闻</a></li> <li><a href="http://pp.qq.com/">图片</a></li> <li><a href="http://mil.qq.com/">军事</a></li> </ul> </div>  ';
return new String($out);
});
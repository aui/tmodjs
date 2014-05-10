/*TMODJS:{"version":3,"md5":"69e26906ebb5c6f93f1783eb94588616"}*/
template('.//public/footer',function($data,$filename) {
'use strict';var $helpers=this,time=$data.time,$escape=$helpers.$escape,include=function(filename,data){data=data||$data;var text=$helpers.$include(filename,data,$filename);$out+=text;return $out;},$out='';$out+='<div id="footer"> ';
if(time){
$out+=' <p class=\'time\'>';
$out+=$escape(time);
$out+='</p> ';
}
$out+=' ';
include('../copyright');
$out+=' </div>';
return new String($out);
});
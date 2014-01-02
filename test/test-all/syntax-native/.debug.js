/*! <DEBUG:./index> */
function anonymous($data,$id) {var $helpers=this,$escape=$helpers.$escape,$ubb2html=$data.$ubb2html,title=$data.title,$each=$helpers.$each,list=$data.list,$value=$data.$value,$index=$data.$index,$out='';$out+='<div id="main"> <h3>';
$out+=$escape($ubb2html title);
$out+='</h3> <ul> ';
$each(list,function($value,$index){
$out+=' <li><a href="';
$out+=$escape($value.url);
$out+='">';
$out+=$escape($ubb2html $value.title);
$out+='</a></li> ';
});
$out+=' </ul> </div>';
return new String($out);}
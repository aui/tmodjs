/*TMODJS:{"version":6,"md5":"284024eb8a7ac5ba1213cc8cd4cbf724"}*/
define(function(require) {
    require("./public/header");
    require("./public/footer");
    return require("./template")("index", "{{include './public/header'}} <div id=\"main\"> <h3>{{title}}</h3> <ul> {{each list}} <li><a href=\"{{$value.url}}\">{{$value.title}}</a></li> {{/each}} </ul> </div> {{include './public/footer'}}");
});
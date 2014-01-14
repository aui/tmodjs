/*TMODJS:{"version":5,"md5":"5ee9611e3fb210129ed0aafc7e55a5c5"}*/
define(function(require) {
    require("./public/header");
    require("./public/footer");
    return require("./template")("index", "{{include './public/header'}} <div id=\"main\"> <h3>{{title}}</h3> <ul> {{each list}} <li><a href=\"{{$value.url}}\">{{$value.title}}</a></li> {{/each}} </ul> </div> {{include './public/footer'}}");
});
/*! <TmodJS> <MD5:2321ba877b7b2add0aaabc4d4093ee2d>*/
define(function(require) {
    require("./public/header");
    require("./public/footer");
    return require("./template")("index", "{{include './public/header'}} <div id=\"main\"> <h3>{{title}}</h3> <ul> {{each list}} <li><a href=\"{{$value.url}}\">{{$value.title}}</a></li> {{/each}} </ul> </div> {{include './public/footer'}}");
});
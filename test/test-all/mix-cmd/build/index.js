/*! <TmodJS> <MD5:55644dde73afa7e9fc46b93a7779f39b>*/
define(function(require) {
    require("./public/header");
    require("./public/footer");
    return require("./template")("index", "{{include './public/header'}} <div id=\"main\"> <h3>{{title}}</h3> <ul> {{each list}} <li><a href=\"{{$value.url}}\">{{$value.title}}</a></li> {{/each}} </ul> </div> {{include './public/footer'}}");
});
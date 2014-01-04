/*TMODJS:{"version":1,"md5":"ca7744b5f395e246704f15a19b0f1cd3"}*/
define(function(require) {
    require("./public/header");
    require("./public/footer");
    return require("./template")("index", "{{include './public/header'}} <div id=\"main\"> <h3>{{title}}</h3> <ul> {{each list}} <li><a href=\"{{$value.url}}\">{{$value.title}}</a></li> {{/each}} </ul> </div> {{include './public/footer'}}");
});
/*! <TmodJS> <MD5:4f727a1c349a3156c4e38db5ed063296>*/
define(function(require) {
    require("../copyright");
    return require("../template")("public/footer", "<div id=\"footer\"> {{if time}} <p class='time'>{{time}}</p> {{/if}} {{include '../copyright'}} </div>");
});
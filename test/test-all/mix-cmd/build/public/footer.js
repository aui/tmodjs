/*TMODJS:{"version":1,"md5":"c87606660b2dcff6eeb6f77834eb2e33"}*/
define(function(require) {
    require("../copyright");
    return require("../template")("public/footer", "<div id=\"footer\"> {{if time}} <p class='time'>{{time}}</p> {{/if}} {{include '../copyright'}} </div>");
});
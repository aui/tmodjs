/*TMODJS:{"version":6,"md5":"4ce5fc96554db3a43286a412b2a968b8"}*/
define(function(require) {
    require("../copyright");
    return require("../template")("public/footer", "<div id=\"footer\"> {{if time}} <p class='time'>{{time}}</p> {{/if}} {{include '../copyright'}} </div>");
});
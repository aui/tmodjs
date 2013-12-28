/*! <TmodJS> <MD5:d1b8393f87721b1a0592e8b7abdf3f9b>*/
define(function(require) {
    require("../copyright");
    return require("../template")("public/footer", "<div id=\"footer\"> {{if time}} <p class='time'>{{time}}</p> {{/if}} {{include '../copyright'}} </div>");
});
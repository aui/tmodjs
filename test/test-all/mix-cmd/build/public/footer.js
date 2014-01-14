/*TMODJS:{"version":5,"md5":"4b9dd62dfb9844237c897c17244002ca"}*/
define(function(require) {
    require("../copyright");
    return require("../template")("public/footer", "<div id=\"footer\"> {{if time}} <p class='time'>{{time}}</p> {{/if}} {{include '../copyright'}} </div>");
});
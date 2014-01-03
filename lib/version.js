 /*!
 * 新旧版本号对比
 * https://github.com/aui/tmodjs
 * Released under the MIT, BSD, and GPL Licenses
 */
 
// 模板工程依赖的的 TomdJS 版本号与当前版本对比

// a < b
module.exports = function (a, b) {
    a = a.replace('~', '').split('.');
    b = b.replace('~', '').split('.');
    var ret = true;

    for (var i = 0, an, bn; i < a.length; i ++) {
        bn = Number(b[i]);
        an = Number(a[i]);

        if (bn > an) {
            ret = true;
            break;
        }

        if (an > bn) {
            ret = false;
            break;
        }
    }

    return ret;
}
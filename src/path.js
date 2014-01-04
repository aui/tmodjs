/*!
 * NodeJS path 跨平台支持（让 windows 路径分隔与 linux 保持一致，统一为：“/”）
 * https://github.com/aui/tmodjs
 * Released under the MIT, BSD, and GPL Licenses
 */
 
'use strict';

var path = require('path');

if (!/\\/.test(path.resolve())) {
    module.exports = path;
} else {
    var oldPath = path;
    var newPath = Object.create(oldPath);
    var proxy = function (name) {
        return function () {
            var value = oldPath[name].apply(oldPath, arguments);
            if (typeof value === 'string') {
                value = value.split(oldPath.sep).join('/');
            }
            return value;
        };
    };

    for (var name in newPath) {
        if (typeof oldPath[name] === 'function') {
            newPath[name] = proxy(name);
        }
    }

    module.exports = newPath;
}


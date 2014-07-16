/*
 * uglify
 * https://gruntjs.com/
 *
 * Copyright (c) 2014 "Cowboy" Ben Alman, contributors
 * Licensed under the MIT license.
 */
'use strict';

// External libs.
var path = require('path');
var fs = require('fs');
var UglifyJS = require('uglify-js');

// Minify with UglifyJS.
// From https://github.com/mishoo/UglifyJS2
// API docs at http://lisperator.net/uglifyjs/
module.exports = function (files, dest, options) {
    options = options || {};

    var topLevel = null;
    var sourcesContent = {};

    var outputOptions = getOutputOptions(options, dest);
    var output = UglifyJS.OutputStream(outputOptions);

    if (!Array.isArray(files)) {
        files = [files];
    }

    // Grab and parse all source files
    files.forEach(function (file) {

        var code = fs.readFileSync(file, 'utf-8');

        // The src file name must be relative to the source map for things to work
        var basename = path.basename(file);
        var fileDir = path.dirname(file);
        var sourceMapDir = path.dirname(options.generatedSourceMapName);
        var relativePath = path.relative(sourceMapDir, fileDir);
        var pathPrefix = relativePath ? (relativePath + path.sep) : '';

        // Convert paths to use forward slashes for sourcemap use in the browser
        file = (pathPrefix + basename).replace(/\\/g, '/');

        sourcesContent[file] = code;
        topLevel = UglifyJS.parse(code, {
            filename: file,
            toplevel: topLevel
        });
    });

    // Wrap code in a common js wrapper.
    if (options.wrap) {
        topLevel = topLevel.wrap_commonjs(options.wrap, options.exportAll);
    }

    // Wrap code in closure with configurable arguments/parameters list.
    if (options.enclose) {
        var argParamList = options.enclose.map(function (val, key) {
            return key + ':' + val;
        });

        topLevel = topLevel.wrap_enclose(argParamList);
    }

    // Need to call this before we mangle or compress,
    // and call after any compression or ast altering
    topLevel.figure_out_scope();

    if (options.compress !== false) {
        if (options.compress.warnings !== true) {
            options.compress.warnings = false;
        }
        var compressor = UglifyJS.Compressor(options.compress);
        topLevel = topLevel.transform(compressor);

        // Need to figure out scope again after source being altered
        topLevel.figure_out_scope();
    }

    if (options.mangle !== false) {
        // disabled due to:
        //   1) preserve stable name mangling
        //   2) it increases gzipped file size, see https://github.com/mishoo/UglifyJS2#mangler-options
        // // compute_char_frequency optimizes names for compression
        // topLevel.compute_char_frequency(options.mangle);

        // Requires previous call to figure_out_scope
        // and should always be called after compressor transform
        topLevel.mangle_names(options.mangle);
    }

    if (options.sourceMap && options.sourceMapIncludeSources) {
        for (var file in sourcesContent) {
            if (sourcesContent.hasOwnProperty(file)) {
                outputOptions.source_map.get().setSourceContent(file, sourcesContent[file]);
            }
        }
    }

    // Print the ast to OutputStream
    topLevel.print(output);

    var output = output.get();

    // Add the source map reference to the end of the file
    if (options.sourceMap) {
        // Set all paths to forward slashes for use in the browser
        output += "\n//# sourceMappingURL=" + options.destToSourceMap.replace(/\\/g, '/');
    }

    var result = {
        output: output,
        sourceMap: outputOptions.source_map
    };

    return result;
};

var getOutputOptions = function (options, dest) {
    var outputOptions = {
        beautify: false,
        source_map: null,
        ascii_only: false
    };


    if (/^\//.test(options.comments)) {
        outputOptions.comments = new Function("return(" + options.comments + ")")();
    } else if (options.comments == "all") {
        outputOptions.comments = true;
    } else {
        outputOptions.comments = function(node, comment) {
            var text = comment.value;
            var type = comment.type;
            if (type == "comment2") {
                // multiline comment
                return /@preserve|@license|@cc_on/i.test(text);
            }
        }
    }

    if (options.banner && options.sourceMap) {
        outputOptions.preamble = options.banner;
    }

    if (options.beautify) {
        if (typeof options.beautify === 'object') {
            // beautify options sent as an object are merged
            // with outputOptions and passed to the OutputStream
            outputOptions.beautify = Object.create(options.beautify);
        } else {
            outputOptions.beautify = options.beautify;
        }
    }


    if (options.sourceMap) {

        var destBasename = path.basename(dest);
        var destPath = path.dirname(dest);
        outputOptions.source_map = UglifyJS.SourceMap({
            file: destBasename
        });

    }

    if (options.indentLevel !== undefined) {
        outputOptions.indent_level = options.indentLevel;
    }

    if (options.ascii_only !== undefined) {
        outputOptions.ascii_only = options.ascii_only;
    }

    if (options.mangle && options.reserved !== undefined) {
        options.mangle.except = options.reserved.replace(/^\s+|\s+$/g).split(/\s*,+\s*/);
    }

    return outputOptions;
};
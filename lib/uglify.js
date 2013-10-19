"use strict";


var sys = require("util");
var fs = require("fs");
var path = require("path");
var UglifyJS = require("./UglifyJS/tools/node");
var async = require("./UglifyJS/node_modules/async/");
var acorn;


exports.beautify = function (file) {

    var isJSON = /\.json$/i.test(file);

    var command = {
        _: [file],
        expr: false,
        beautify: "width=80",
        b: "width=80",
        self: false,
        v: false,
        verbose: false,
        stats: false,
        acorn: false,
        spidermonkey: false,
        lint: false,
        V: false,
        version: false,
        output: file,
        o: file,
        comments: '/<TmodJS>/',
        screw_ie8: false,
        export_all: false
    };

    if (isJSON) {
        command.expr = true;
        command.beautify = command.b = 'quote-keys=true,width=80';
    }

    init(command);
};



exports.minify = function (file) {
    var command = {
        _: [file],
        expr: false,
        self: false,
        v: false,
        verbose: false,
        stats: false,
        acorn: false,
        spidermonkey: false,
        lint: false,
        V: false,
        version: false,
        output: file,
        o: file,
        mangle: true,
        m: true,
        reserved: 'include,require',
        r: 'include,require',
        comments: '/<TmodJS>|^$/',
        compress: 'warnings=fasle',
        c: 'warnings=false',
        beautify: 'beautify=false,ascii-only=true',
        b: 'beautify=false,ascii-only=true',
        screw_ie8: false,
        export_all: false
    };

    init(command);
};




function init (ARGS) {



var COMPRESS = getOptions("c", true);
var MANGLE = getOptions("m", true);
var BEAUTIFY = getOptions("b", true);

if (ARGS.d) {
    if (COMPRESS) COMPRESS.global_defs = getOptions("d");
}

if (ARGS.r) {
    if (MANGLE) MANGLE.except = ARGS.r.replace(/^\s+|\s+$/g).split(/\s*,+\s*/);
}

var OUTPUT_OPTIONS = {
    beautify: BEAUTIFY ? true : false
};

if (ARGS.screw_ie8) {
    if (COMPRESS) COMPRESS.screw_ie8 = true;
    if (MANGLE) MANGLE.screw_ie8 = true;
    OUTPUT_OPTIONS.screw_ie8 = true;
}

if (BEAUTIFY)
    UglifyJS.merge(OUTPUT_OPTIONS, BEAUTIFY);

if (ARGS.comments) {
    if (/^\//.test(ARGS.comments)) {
        OUTPUT_OPTIONS.comments = new Function("return(" + ARGS.comments + ")")();
    } else if (ARGS.comments == "all") {
        OUTPUT_OPTIONS.comments = true;
    } else {
        OUTPUT_OPTIONS.comments = function(node, comment) {
            var text = comment.value;
            var type = comment.type;
            if (type == "comment2") {
                // multiline comment
                return /@preserve|@license|@cc_on/i.test(text);
            }
        }
    }
}

var files = ARGS._.slice();

if (ARGS.self) {
    if (files.length > 0) {
        sys.error("WARN: Ignoring input files since --self was passed");
    }
    files = UglifyJS.FILES;
    if (!ARGS.wrap) ARGS.wrap = "UglifyJS";
    ARGS.export_all = true;
}

var ORIG_MAP = ARGS.in_source_map;

if (ORIG_MAP) {
    ORIG_MAP = JSON.parse(fs.readFileSync(ORIG_MAP));
    if (files.length == 0) {
        sys.error("INFO: Using file from the input source map: " + ORIG_MAP.file);
        files = [ ORIG_MAP.file ];
    }
    if (ARGS.source_map_root == null) {
        ARGS.source_map_root = ORIG_MAP.sourceRoot;
    }
}

if (files.length == 0) {
    files = [ "-" ];
}

if (files.indexOf("-") >= 0 && ARGS.source_map) {
    sys.error("ERROR: Source map doesn't work with input from STDIN");
    process.exit(1);
}

if (files.filter(function(el){ return el == "-" }).length > 1) {
    sys.error("ERROR: Can read a single file from STDIN (two or more dashes specified)");
    process.exit(1);
}

var STATS = {};
var OUTPUT_FILE = ARGS.o;
var TOPLEVEL = null;
var P_RELATIVE = ARGS.p && ARGS.p == "relative";

var SOURCE_MAP = ARGS.source_map ? UglifyJS.SourceMap({
    file: P_RELATIVE ? path.relative(path.dirname(ARGS.source_map), OUTPUT_FILE) : OUTPUT_FILE,
    root: ARGS.source_map_root,
    orig: ORIG_MAP,
}) : null;

OUTPUT_OPTIONS.source_map = SOURCE_MAP;

try {
    var output = UglifyJS.OutputStream(OUTPUT_OPTIONS);
    var compressor = COMPRESS && UglifyJS.Compressor(COMPRESS);
} catch(ex) {
    if (ex instanceof UglifyJS.DefaultsError) {
        sys.error(ex.msg);
        sys.error("Supported options:");
        sys.error(sys.inspect(ex.defs));
        process.exit(1);
    }
}

async.eachLimit(files, 1, function (file, cb) {
    read_whole_file(file, function (err, code) {
        if (err) {
            sys.error("ERROR: can't read file: " + file);
            process.exit(1);
        }
        if (ARGS.p != null) {
            if (P_RELATIVE) {
                file = path.relative(path.dirname(ARGS.source_map), file);
            } else {
                var p = parseInt(ARGS.p, 10);
                if (!isNaN(p)) {
                    file = file.replace(/^\/+/, "").split(/\/+/).slice(ARGS.p).join("/");
                }
            }
        }
        time_it("parse", function(){
            if (ARGS.spidermonkey) {
                var program = JSON.parse(code);
                if (!TOPLEVEL) TOPLEVEL = program;
                else TOPLEVEL.body = TOPLEVEL.body.concat(program.body);
            }
            else if (ARGS.acorn) {
                TOPLEVEL = acorn.parse(code, {
                    locations     : true,
                    trackComments : true,
                    sourceFile    : file,
                    program       : TOPLEVEL
                });
            }
            else {
                TOPLEVEL = UglifyJS.parse(code, {
                    filename   : file,
                    toplevel   : TOPLEVEL,
                    expression : ARGS.expr,
                });
            };
        });
        cb();
    });
}, function () {
    if (ARGS.acorn || ARGS.spidermonkey) time_it("convert_ast", function(){
        TOPLEVEL = UglifyJS.AST_Node.from_mozilla_ast(TOPLEVEL);
    });

    if (ARGS.wrap) {
        TOPLEVEL = TOPLEVEL.wrap_commonjs(ARGS.wrap, ARGS.export_all);
    }

    if (ARGS.enclose) {
        var arg_parameter_list = ARGS.enclose;
        if (arg_parameter_list === true) {
            arg_parameter_list = [];
        }
        else if (!(arg_parameter_list instanceof Array)) {
            arg_parameter_list = [arg_parameter_list];
        }
        TOPLEVEL = TOPLEVEL.wrap_enclose(arg_parameter_list);
    }

    var SCOPE_IS_NEEDED = COMPRESS || MANGLE || ARGS.lint;

    if (SCOPE_IS_NEEDED) {
        time_it("scope", function(){
            TOPLEVEL.figure_out_scope({ screw_ie8: ARGS.screw_ie8 });
            if (ARGS.lint) {
                TOPLEVEL.scope_warnings();
            }
        });
    }

    if (COMPRESS) {
        time_it("squeeze", function(){
            TOPLEVEL = TOPLEVEL.transform(compressor);
        });
    }

    if (SCOPE_IS_NEEDED) {
        time_it("scope", function(){
            TOPLEVEL.figure_out_scope({ screw_ie8: ARGS.screw_ie8 });
            if (MANGLE) {
                TOPLEVEL.compute_char_frequency(MANGLE);
            }
        });
    }

    if (MANGLE) time_it("mangle", function(){
        TOPLEVEL.mangle_names(MANGLE);
    });
    time_it("generate", function(){
        TOPLEVEL.print(output);
    });

    output = output.get();

    if (SOURCE_MAP) {
        fs.writeFileSync(ARGS.source_map, SOURCE_MAP, "utf8");
        var source_map_url = ARGS.source_map_url || (
            P_RELATIVE
                ? path.relative(path.dirname(OUTPUT_FILE), ARGS.source_map)
                : ARGS.source_map
        );
        output += "\n//# sourceMappingURL=" + source_map_url;
    }

    if (OUTPUT_FILE) {
        fs.writeFileSync(OUTPUT_FILE, output, "utf8");
    } else {
        sys.print(output);
        sys.error("\n");
    }

    if (ARGS.stats) {
        sys.error(UglifyJS.string_template("Timing information (compressed {count} files):", {
            count: files.length
        }));
        for (var i in STATS) if (STATS.hasOwnProperty(i)) {
            sys.error(UglifyJS.string_template("- {name}: {time}s", {
                name: i,
                time: (STATS[i] / 1000).toFixed(3)
            }));
        }
    }
});

/* -----[ functions ]----- */


function getOptions(x, constants) {
    x = ARGS[x];
    if (!x) return null;
    var ret = {};
    if (x !== true) {
        var ast;
        try {
            ast = UglifyJS.parse(x);
        } catch(ex) {
            if (ex instanceof UglifyJS.JS_Parse_Error) {
                sys.error("Error parsing arguments in: " + x);
                process.exit(1);
            }
        }
        ast.walk(new UglifyJS.TreeWalker(function(node){
            if (node instanceof UglifyJS.AST_Toplevel) return; // descend
            if (node instanceof UglifyJS.AST_SimpleStatement) return; // descend
            if (node instanceof UglifyJS.AST_Seq) return; // descend
            if (node instanceof UglifyJS.AST_Assign) {
                var name = node.left.print_to_string({ beautify: false }).replace(/-/g, "_");
                var value = node.right;
                if (constants)
                    value = new Function("return (" + value.print_to_string() + ")")();
                ret[name] = value;
                return true;    // no descend
            }
            sys.error(node.TYPE)
            sys.error("Error parsing arguments in: " + x);
            process.exit(1);
        }));
    }
    return ret;
}

function read_whole_file(filename, cb) {
    if (filename == "-") {
        var chunks = [];
        process.stdin.setEncoding('utf-8');
        process.stdin.on('data', function (chunk) {
            chunks.push(chunk);
        }).on('end', function () {
            cb(null, chunks.join(""));
        });
        process.openStdin();
    } else {
        fs.readFile(filename, "utf-8", cb);
    }
}

function time_it(name, cont) {
    var t1 = new Date().getTime();
    var ret = cont();
    if (ARGS.stats) {
        var spent = new Date().getTime() - t1;
        if (STATS[name]) STATS[name] += spent;
        else STATS[name] = spent;
    }
    return ret;
}


/*init end*/
};





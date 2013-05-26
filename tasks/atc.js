/*
 * grunt-atc
 * https://github.com/jiawulu/atc
 *
 * Copyright (c) 2013 jiawulu
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  var compiler = require('../compiler'),
    _ = require('underscore')._;

  grunt.registerMultiTask('atc', 'using atc ( artTemplate ) to convert templates to javascripts ', function() {

    this.files.forEach(function(f) {

      f.src.forEach(function(filepath) {

         if(!grunt.file.exists(filepath)){
             grunt.log.error(filepath + " not exists");
             return false;
         }

//          grunt.log.writeln(JSON.stringify(f));

          var options = f;
          options['path'] = filepath;

          _.extend(compiler.options, options);

//          grunt.log.writeln(JSON.stringify(compiler.options));

          compiler.execute();

      });
      // Print a success message.
      grunt.log.writeln('arttemplate generates successfully');
    });
  });

};

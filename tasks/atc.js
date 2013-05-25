/*
 * grunt-atc
 * https://github.com/jiawulu/atc
 *
 * Copyright (c) 2013 jiawulu
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  var compiler = require('../compiler');

  grunt.registerMultiTask('atc', 'using atc ( artTemplate ) to convert templates to javascripts ', function() {

    this.files.forEach(function(f) {

      f.src.forEach(function(filepath) {

         if(!grunt.file.exists(filepath)){
             grunt.log.error(filepath + " not exists");
             return false;
         }

          compiler.options['path'] = filepath;
          compiler.options['namespace'] = f.dest;
          compiler.execute();

      });
      // Print a success message.
      grunt.log.writeln('arttemplate generates successfully');
    });
  });

};

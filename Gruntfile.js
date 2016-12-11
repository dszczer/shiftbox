module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {
      files: ['Gruntfile.js', 'src/*.js'],
      options: {
        globals: {
          jQuery: true
        }
      }
    },
    uglify: {
      my_target: {
        files: {
          'dist/js/shiftbox.min.js': ['src/shiftbox.js'],
          'docs/dist/shiftbox.min.js': ['src/shiftbox.js']
        }
      }
    },
    cssmin: {
      target: {
        files: {
          'dist/css/shiftbox_bootstrap.min.css': ['dist/css/shiftbox_bootstrap.css'],
          'docs/dist/shiftbox_bootstrap.min.css': ['css/shiftbox_bootstrap.css']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.registerTask('default', ['jshint', 'uglify', 'cssmin']);

};
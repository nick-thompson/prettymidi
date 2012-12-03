module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',

    simplemocha: {
      all: {
        src: 'test/**/*.js',
        options: {
          reporter: 'spec'
        }
      }
    },

    lint: {
      files: ['lib/**/*.js']
    },

    watch: {
      files: '<config:lint.files>',
      tasks: 'default'
    },

    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: false,
        newcap: true,
        noarg: true,
        sub: true,
        undef: false,
        boss: true,
        eqnull: true,
        node: true,
        laxcomma: true,
        laxbreak: true,
        strict: false
      },
      globals: {
        exports: true,
        DataView: true
      }
    }
  });

  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.registerTask('default', 'lint simplemocha');

};

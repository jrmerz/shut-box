'use strict';
var LIVERELOAD_PORT = 35729;
var lrSnippet = require('connect-livereload')({port: LIVERELOAD_PORT});
var mountFolder = function (connect, dir) {
  return connect.static(require('path').resolve(dir));
};

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {
  // show elapsed time at the end
  require('time-grunt')(grunt);
  // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  // configurable paths
  var yeomanConfig = {
    app: 'app',
    dist: 'dist'
  };

  grunt.initConfig({
    yeoman: yeomanConfig,
    autoprefixer: {
      options: {
        browsers: ['last 2 versions']
      },
      server: {
        files: [{
          expand: true,
          cwd: '.tmp',
          src: '**/*.css',
          dest: '.tmp'
        }]
      },
      dist: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.dist %>',
          src: ['**/*.css', '!bower_components/**/*.css'],
          dest: '<%= yeoman.dist %>'
        }]
      }
    },
    clean: {
      dist: ['.tmp', '<%= yeoman.dist %>/*'],
      server: '.tmp'
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      all: [
        '<%= yeoman.app %>/scripts/{,*/}*.js',
        '!<%= yeoman.app %>/scripts/vendor/*',
        'test/spec/{,*/}*.js'
      ]
    },
    useminPrepare: {
      html: '<%= yeoman.app %>/index.html',
      options: {
        dest: '<%= yeoman.dist %>'
      }
    },
    usemin: {
      html: ['<%= yeoman.dist %>/{,*/}*.html'],
      css: ['<%= yeoman.dist %>/styles/{,*/}*.css'],
      options: {
        dirs: ['<%= yeoman.dist %>'],
        blockReplacements: {
          vulcanized: function (block) {
            return '<link rel="import" href="' + block.dest + '">';
          }
        }
      }
    },
    vulcanize: {
      default: {
        options: {
          strip: true
        },
        files: {
          '<%= yeoman.dist %>/elements/elements.vulcanized.html': [
            '<%= yeoman.dist %>/elements/elements.html'
          ]
        }
      }
    },
    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>/images',
          src: '{,*/}*.{png,jpg,jpeg}',
          dest: '<%= yeoman.dist %>/images'
        }]
      }
    },
    cssmin: {
      main: {
        files: {
          '<%= yeoman.dist %>/styles/main.css': [
            '.tmp/concat/styles/{,*/}*.css'
          ]
        }
      },
      elements: {
        files: [{
          expand: true,
          cwd: '.tmp/elements',
          src: '{,*/}*.css',
          dest: '<%= yeoman.dist %>/elements'
        }]
      }
    },
    minifyHtml: {
      options: {
        quotes: true,
        empty: true
      },
      app: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.dist %>',
          src: '*.html',
          dest: '<%= yeoman.dist %>'
        }]
      }
    },
    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= yeoman.app %>',
          dest: '<%= yeoman.dist %>',
          src: [
            '*.{ico,txt}',
            '.htaccess',
            '*.html',
            'elements/**',
            '!elements/**/*.css',
            'images/{,*/}*.{webp,gif}',
            'bower_components/**'
          ]
        }]
      },
      styles: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>',
          dest: '.tmp',
          src: ['{styles,elements}/{,*/}*.css']
        }]
      }
    },
    // See this tutorial if you'd like to run PageSpeed
    // against localhost: http://www.jamescryer.com/2014/06/12/grunt-pagespeed-and-ngrok-locally-testing/
    pagespeed: {
      options: {
        // By default, we use the PageSpeed Insights
        // free (no API key) tier. You can use a Google
        // Developer API key if you have one. See
        // http://goo.gl/RkN0vE for info
        nokey: true
      },
      // Update `url` below to the public URL for your site
      mobile: {
        options: {
          url: "https://developers.google.com/web/fundamentals/",
          locale: "en_GB",
          strategy: "mobile",
          threshold: 80
        }
      }
    },

    shell: {
      'serve' : {
          options: {
              stdout: true,
              stderr: true
          },
          command: 'node server.js --dev'
      },
      'generate-deep-css' : {
          options: {
              stdout: true,
              stderr: true
          },
          command: 'rm -rf <%= yeoman.app %>/styles/deep.css <%= yeoman.app %>/styles/tmp.* && ' +
                   'cp <%= yeoman.app %>/bower_components/bootstrap/dist/css/bootstrap.css <%= yeoman.app %>/styles/tmp.bootstrap.css && '+
                   'sed -i "" -e \':a\' -e \'N\' -e \'$!ba\' -e \'s/\\}\\(\\n *\\)\\([a-z\\.\\*]\\)/\\}\\1html \\/deep\\/ \\2/g\' <%= yeoman.app %>/styles/tmp.bootstrap.css &&' +
                   'sed -i "" -e \':a\' -e \'N\' -e \'$!ba\' -e \'s/\\,\\(\\n *\\)\\([a-z\\.\\*]\\)/\\,\\1html \\/deep\\/ \\2/g\' <%= yeoman.app %>/styles/tmp.bootstrap.css &&' +
                   'sed -i "" -e \':a\' -e \'N\' -e \'$!ba\' -e \'s/\\,\\( *\\)\\([a-z\\.]\\)/\\,\\1html \\/deep\\/ \\2/g\' <%= yeoman.app %>/styles/tmp.bootstrap.css &&' +
                   'sed -i "" -e \':a\' -e \'N\' -e \'$!ba\' -e \'s/\\(@media[a-z0-9()-\\: ]*{\\n\\)/\\1 html \\/deep\\//g\' <%= yeoman.app %>/styles/tmp.bootstrap.css &&' +
                   // fix the modal selector
                   'sed -i "" -e \':a\' -e \'N\' -e \'$!ba\' -e \'s/html \\/deep\\/ \\.modal-open \\.modal/.modal-open \\/deep\\/ .modal/g\' <%= yeoman.app %>/styles/tmp.bootstrap.css &&' +

                   // there is issue where the regex adds html /deep/ to a animate keyframe set, this cleans it
                   'sed -i "" -e \':a\' -e \'N\' -e \'$!ba\' -e \'s/  html \\/deep\\/ to {/  to {/g\' <%= yeoman.app %>/styles/tmp.bootstrap.css &&' +
                   'cp <%= yeoman.app %>/bower_components/animate-css/animate.css <%= yeoman.app %>/styles/tmp.animate.css && '+
                   'sed -i "" -e \':a\' -e \'N\' -e \'$!ba\' -e \'s/\\(\\n\\)\\(\\.[a-zA-Z]*\\)/\\1html \\/deep\\/ \\2/g\' <%= yeoman.app %>/styles/tmp.animate.css && ' +
                   'cat '+
                   '<%= yeoman.app %>/styles/tmp.bootstrap.css '+
                   '<%= yeoman.app %>/styles/tmp.animate.css '+
                   '>> <%= yeoman.app %>/styles/deep.css && '+
                   'rm -rf <%= yeoman.app %>/styles/tmp.*'

      },
      'mv-fonts' : {
          options: {
              stdout: true,
              stderr: true
          },
          command: 'mv <%= yeoman.app %>/bower_components/font-awesome/fonts <%= yeoman.app %>/'
      }
    }
  });

  grunt.registerTask('server', function (target) {
    grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
    grunt.task.run(['serve:' + target]);
  });

  grunt.registerTask('serve', function (target) {
    if (target === 'dist') {
      return grunt.task.run(['build', 'shell:serve_dist']);
    }

    grunt.task.run([
      'clean:server',
      'shell:serve'
    ]);
  });

  grunt.registerTask('test', [
    'clean:server'
  ]);

  grunt.registerTask('prep',[
    'shell:generate-deep-css'
  ]);

  grunt.registerTask('build', [
    'clean:dist',
    'copy',
    'useminPrepare',
    'imagemin',
    'concat',
    'autoprefixer',
    'uglify',
    'cssmin',
    'vulcanize',
    'usemin',
    'minifyHtml'
  ]);

  grunt.registerTask('default', [
    'jshint',
    // 'test'
    'build'
  ]);
};
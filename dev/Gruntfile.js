'use strict';

module.exports = function(grunt) {

	// Load grunt tasks automatically
	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		appConfig : {
			app: require('./bower.json').appPath || './',
			dist: './'
		},

		// Watches files for changes and runs tasks based on the changed files
		watch: {
			js: {
				files: ['<%= appConfig.app %>/js/{,*/}*.js'],
				options: {
					livereload: true
				}
			},
			styles: {
				files: ['<%= appConfig.app %>/style/{,*/}*.css'],
				options: {
					livereload: true
				}
			},
			gruntfile: {
				files: ['Gruntfile.js']
			},
			livereload: {
				options: {
					livereload: '<%= connect.options.livereload %>'
				},
				files: [
					'<%= appConfig.app %>/{,*/}*.html',
					'<%= appConfig.app %>/style/{,*/}*.css'
				]
			}
		},

		jshint: {
			all: ['js/*.js']
		},

		uglify: {
			dist: {
				files: {
					'../dist/js/built.js': [
						'./bower_components/jquery/dist/jquery.min.js',
						'./bower_components/firebase/firebase.js',
						'./bower_components/lodash/lodash.min.js',
						'./bower_components/pnotify/pnotify.core.js',
						'./js/app.js',
						'./js/welcome.js',
						'./js/game.js',
						'./js/board.js',
						'./js/fireb.js'
					]
				}
			}
		},

		cssmin: {
			target: {
				files: {
					'../dist/css/built.css': [
						'./bower_components/pnotify/pnotify.core.css',
						'./bower_components/bootstrap/dist/css/bootstrap.min.css',
						'./css/goban.css'
					]
				}
			}
		},

		copy: {
			main: {
				files: [
					{expand: true, src: ['./*.html', './*.jpg', './*.png', './*.ico', './.htaccess'], dest: '../dist/'},
					{expand: true, src: ['./img/**'], dest: '../dist/'},
				]
			}
		},

		usemin: {
			html: '../dist/index.html'
		},

		// The actual grunt server settings
		connect: {
			options: {
				port: 9000,
				// Change this to '0.0.0.0' to access the server from outside.
				hostname: 'localhost',
				livereload: 35729
			},
			livereload: {
				options: {
					open: true,
					base: [
						'.'
					]
				}
			}
		}
	});

	grunt.registerTask('serve', 'Compile then start a connect web server', function (target) {
		grunt.task.run(['connect:livereload', 'watch']);
	});

	grunt.registerTask('prod', ['jshint', 'uglify', 'cssmin', 'copy', 'usemin']);

}
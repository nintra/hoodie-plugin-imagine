module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);


    // Configurable paths
    var config = {
        admin: {
            base      : 'admin-dashboard',
            assets    : 'admin-dashboard/assets',
            scripts   : 'admin-dashboard/assets/scripts',
            styles    : 'admin-dashboard/assets/styles',
            scriptsSrc: 'admin-dashboard/assets/scripts/src',
            stylesSrc : 'admin-dashboard/assets/styles/src',
            images    : 'admin-dashboard/assets/images',
            vendor    : 'admin-dashboard/assets/vendor',
            tmp       : 'admin-dashboard/assets/.tmp',
        },

        backend: {
            files: 'plugin/*.js'
        },

        frontend: {
            file: 'hoodie.imagine.js'
        },

        livereloadPort: 35729
    };

    // Project configuration.
    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        // Project settings
        config: config,

        // Watches files for changes and runs tasks based on the changed files
        watch: {
            options: {
                spawn: false,
            },

            gruntfile: {
                files: ['Gruntfile.js'],
                tasks: ['jshint:gruntfile']
            },

            adminScripts: {
                files: ['<%= config.admin.scriptsSrc %>/**/*.{js,json}'],
                tasks: ['jshint:admin', 'livereload:adminAll']
            },

            adminStyles: {
                files: ['<%= config.admin.stylesSrc %>/**/*.scss'],
                tasks: ['sass:admin', 'autoprefixer:admin', 'livereload:adminStyles']
            },

            plugin: {
                files: ['<%= config.backend.files %>'],
                tasks: 'jshint'
            },

            unittest: {
                files: '<%= config.backend.files %>',
                tasks: 'test:unit'
            },

            livereload: {
                files: [
                    // '<%= config.tmp %>/styles/main.css',
                    '<%= config.admin.base %>/index.html',
                    '<%= config.admin.images %>/**/*'
                    // '!node_modules/**'
                ],
                tasks: ['livereload:adminAll']
            }
        },

        jshint: {
            admin: {
                options: {
                    jshintrc: '<%= config.admin.base %>/.jshintrc',
                    reporter: require('jshint-stylish')
                },

                files: {
                    src: [
                        '<%= config.admin.scriptsSrc %>/{,*/}*.js',
                        '!<%= config.admin.vendor %>/*'
                    ]
                }
            },

            plugin: [
                '<%= config.frontend.file %>',
                '<%= config.backend.files %>'
            ],

            gruntfile: [
                'Gruntfile.js'
            ],

            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            }
        },

        requirejs: {
            admin: {
                options: {
                    baseUrl: '<%= config.admin.scriptsSrc %>',

                    name          : 'main',
                    mainConfigFile: '<%= config.admin.scriptsSrc %>/main.js',
                    out           : '<%= config.admin.scripts %>/main.js',

                    include: [
                        '../../vendor/requirejs/require',
                        'app'
                    ],

                    // optimize: 'none',

                    useStrict: true,
                    wrap     : true
                }
            }
        },

        sass: {
            options: {
                imagePath: '../images'
            },
            admin: {
                files: [
                    {
                        src : '<%= config.admin.stylesSrc %>/index.scss',
                        dest: '<%= config.admin.styles %>/main.css'
                    }
                ]
            }
        },

        autoprefixer: {
            options: {
                browsers: ['last 2 versions', 'ie 8', 'ie 9', 'android 2.3', 'android 4', 'opera 12']
            },
            admin: {
                files: [
                    {
                        src : '<%= config.admin.styles %>/main.css',
                        dest: '<%= config.admin.styles %>/main.css'
                    }
                ]
            }
        },

        cssmin: {
            admin: {
                files: {
                    '<%= config.admin.styles %>/main.css': '<%= config.admin.styles %>/main.css'
                }
            }
        },

        simplemocha: {
            options: {
                ui: 'tdd'
            },
            unit: {
                src: ['test/unit/*.js']
            }
        },

        mocha_browser: {
            all: {
                options: {
                    urls: ['http://localhost:<%= connect.options.port %>']
                }
            }
        },

        shell: {
            removeData: {
                command: 'rm -rf ' + require('path').resolve(__dirname, 'data')
            },
            npmLink: {
                command: 'npm link && npm link hoodie-plugin-imagine'
            },
            npmUnlink: {
                command: 'npm unlink && npm unlink hoodie-plugin-imagine'
            },
            installPlugin: {
                command: 'hoodie install imagine'
            },
            removePlugin: {
                command: 'hoodie uninstall imagine'
            }
        },

        hoodie: {
            start: {
                options: {
                    www: 'test/browser',
                    callback: function (config) {
                        grunt.config.set('connect.options.port', config.stack.www.port);
                    }
                }
            }
        },

        env: {
            test: {
                HOODIE_SETUP_PASSWORD: 'testing'
            }
        }

    });



    // create a live reload server instance
    var server = require('tiny-lr')();

    grunt.registerTask('livereload', function(target) {

        switch (target) {

            case 'start':
                // listen on port
                console.log('Livereload: starting server');
                server.listen(config.livereloadPort, function(err) {
                    console.log('Livereload: server started on port '+config.livereloadPort);
                });
                break;

            case 'adminAll':
                server.changed({
                    body: {
                        files: [
                            'admin-dashboard/assets/scripts/src/main.js'
                        ]
                    }
                });
                break;

            case 'adminStyles':
                server.changed({
                    body: {
                        files: [
                            'admin-dashboard/assets/styles/main.css'
                        ]
                    }
                });
                break;
        }
    });




    grunt.registerTask('admin-serve', function (target) {
        grunt.task.run([
            'sass:admin',
            'autoprefixer:admin',
            'livereload:start',
            'watch'
        ]);
    });


    grunt.registerTask('admin-build', [
        'sass:admin',
        'autoprefixer:admin',
        'requirejs:admin',
        'cssmin:admin'
    ]);


    grunt.registerTask('test:unit', ['simplemocha:unit']);
    grunt.registerTask('test:browser', [
        'env:test',
        'shell:removeData',
        'shell:npmLink',
        'shell:installPlugin',
        'hoodie',
        'continueOn',
        'mocha_browser:all',
        'continueOff',
        'hoodie_stop',
        'shell:npmUnlink',
        'shell:removePlugin'
    ]);


    grunt.registerTask('default', []);
    grunt.registerTask('test', [
        'jshint',
        'test:unit',
        'test:browser'
    ]);


};
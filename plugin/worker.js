


/*


    o8o                                          o8o
    `"'                                          `"'
   oooo  ooo. .oo.  .oo.    .oooo.    .oooooooo oooo  ooo. .oo.    .ooooo.
   `888  `888P"Y88bP"Y88b  `P  )88b  888' `88b  `888  `888P"Y88b  d88' `88b
    888   888   888   888   .oP"888  888   888   888   888   888  888ooo888
    888   888   888   888  d8(  888  `88bod8P'   888   888   888  888    .o
   o888o o888o o888o o888o `Y888""8o `8oooooo.  o888o o888o o888o `Y8bod8P'
                                     d"     YD
                                     "Y88888P'

*/



var _ = require('lodash'),

    getConfig = require('./config'),
    setup     = require('./setup'),
    initRequest = require('./request'),
    createUtils = require('./utils'),
    createImageHandler = require('./images');



module.exports = function(hoodie, callback) {

    var database,
        createRequest = initRequest(hoodie);



    function Imagine(opts) {
        var self = this;

        self.config  = opts.config;
        self.utils   = opts.utils;
        self.request = opts.request;
        self.imageHandler = opts.imageHandler;
    }



    // retrieves an image document and assures user is owner of the document
    Imagine.prototype.accessImageDocument = function(id, callback) {
        var self = this;

        database.find('image', id, function(error, image) {
            if (error) {
                if (error.error === 'not_found') {
                    callback(false);
                    return;

                } else {
                    return self.request.error(error);
                }
            }

            if (image.user !== self.request.user) {
                return self.request.error('access not allowed');
            }

            callback(image);
        });

    };



    // adds or updates an image and returns an image object
    Imagine.prototype.upsert = function(taskData) {
        var self   = this,
            result = self.utils.validateData(['objectId', 'data', 'group', 'options'], taskData),

            deleteFile = function(imageId, callback) {
                self.imageHandler.deleteFile(imageId, function(error) {
                    if (error) {
                        return self.request.error(error);
                    }

                    callback();
                });
            },

            saveFile = function(image, callback) {
                var group = taskData.group || (image ? _.find(self.config.groups, { id: image.groupId }) : false),

                    imageData = self.utils.prepareImageData({
                        user   : self.request.user,
                        group  : group,
                        options: taskData.options
                    }),

                    imageId = image ? image.id : taskData.objectId;

                if (_.isString(imageData)) {
                    return self.request.error(imageData);
                }

                self.imageHandler.saveFile(imageId, imageData.groupId, taskData.data, function(error, processedData) {
                    if (error) {
                        return self.request.error(error);
                    }

                    callback(imageId, imageData);
                });
            };


        if (!result.valid) {
            return self.request.error(result);
        }


        self.accessImageDocument(taskData.objectId, function(image) {

            if (image) {
                // exists and is owner

                deleteFile(image.id, function() {
                    saveFile(image, function(imageId, imageData) {

                        database.update('image', imageId, imageData, function(error) {
                            if (error) {
                                return self.request.error(error);
                            }

                            self.request.success({ id: imageId });
                        });

                    });
                });

            } else {
                // image not found

                saveFile(false, function(imageId, imageData) {
                    imageData.id = imageId;

                    database.add('image', imageData, function(error, image) {
                        if (error) {
                            return self.request.error(error);
                        }

                        self.request.success({ id: imageId });
                    });
                });
            }

        });
    };



    // retrieves images
    Imagine.prototype.find = function(taskData) {
        var self   = this,
            result = self.utils.validateData(['objectIds'], taskData);

        if (!result.valid) {
            return self.request.error(result);
        }


        database.query('by-id',
            {
                include_docs: true,
                keys        : taskData.objectIds
            },
            function(error, results, query) {
                if (error) {
                    return self.request.error(error);
                }

                /*results = _.filter(results, function(result) {
                    var doc   = result.doc,
                        group = _.find(self.config.groups, { id: doc.groupId });

                    // all public and verified images and images created by current user
                    return (group.public && doc.verified) || doc.user === self.request.user;
                });*/

                self.request.success(self.utils.preparePublicImageData(results));
            }
        );
    };



    // find all user images
    Imagine.prototype.findOwn = function(taskData) {
        var self   = this,
            result = self.utils.validateData(['group'], taskData),
            params = { include_docs: true }, group;

        if (!result.valid) {
            return self.request.error(result);
        }


        if (taskData.group) {
            group = _.find(self.config.groups, { name: taskData.group });
            params.key = [self.request.user, group.id];

        } else {
            params.startkey = [self.request.user];
            params.endkey   = [self.request.user, {}];

        }


        database.query('by-user-group', params,
            function(error, results, query) {
                if (error) {
                    return self.request.error(error);
                }

                self.request.success(self.utils.preparePublicImageData(results));
            }
        );

    };



    // deletes an image
    Imagine.prototype.remove = function(taskData) {
        var self   = this,
            result = self.utils.validateData(['objectIds'], taskData),

            finish = (function() {
                var count  = taskData.objectIds.length,
                    errors = [];

                return function(id, error) {
                    if (error) {
                        errors.push({ id: id, error: error });
                    }

                    count--;
                    if (count === 0) {
                        if (errors.length) {
                            self.request.error(errors[errors.length - 1].error);
                        } else {
                            self.request.success();
                        }
                    }
                };
            })();


        if (!result.valid) {
            return self.request.error(result);
        }


        _.each(taskData.objectIds, function(id) {

            self.accessImageDocument(id, function(image) {

                database.remove('image', id, function(error) {
                    if (error) {
                        return finish(id, error);
                    }

                    self.imageHandler.deleteFile(id, function(error) {
                        if (error) {
                            return finish(id, error);
                        }

                        finish(id, false);
                    });
                });

            });

        });
    };



    // deletes all images by current user
    Imagine.prototype.removeOwn = function(taskData) {
        var self = this,
            result = self.utils.validateData(['group'], taskData),
            params = { include_docs: true }, group;

        if (!result.valid) {
            return self.request.error(result);
        }


        if (taskData.group) {
            group = _.find(self.config.groups, { name: taskData.group });
            params.key = [self.request.user, group.id];

        } else {
            params.startkey = [self.request.user];
            params.endkey   = [self.request.user, {}];

        }


        database.query('by-user-group', params,
            function(error, results, query) {
                if (error) {
                    return self.request.error(error);
                }


                var iterateList = function(list, iterator, finish) {
                        var i = 0,
                            length   = list.length,
                            results  = [],
                            flawless = true,

                            callback = function(error) {
                                if (i > 0) {
                                    results.push({ index: i, error: error });

                                    if (error) {
                                        flawless = false;
                                    }
                                }

                                if (i < length) {
                                    iterator(list[i], callback);
                                    i++;

                                } else {

                                    if (flawless) {
                                        finish(false, results);
                                    } else {
                                        finish(new Error('remove process incomplete'), results);
                                    }

                                }
                            };

                        callback();
                    },


                    iterator = function(result, callback) {
                        var doc = result.doc,
                            id  = doc._id.replace('image/', '');

                        self.imageHandler.deleteFile(id, function(error) {
                            if (error) {
                                return callback(error);
                            }

                            database.remove('image', id, function(error) {
                                if (error) {
                                    return callback(error);
                                }

                                callback();
                            });
                        });
                    };


                iterateList(results, iterator, function(error, results) {
                    if (error) {
                        return self.request.error(error);
                    }

                    self.request.success();
                });

            }
        );
    };





    // initialize
    setup(hoodie, function(error, pluginDatabase) {
        if (error) {
            return callback(error);
        }

        database = pluginDatabase;

        hoodie.Imagine = Imagine;


        // the only contact to the outside
        /*hoodie.task.on('imagine:add', function(dbName, task) {

            var config  = getConfig(hoodie),
                utils   = createUtils(config),
                request = createRequest(dbName, task, utils),

                imagine = new Imagine({
                    config: config,
                    utils : utils,
                    imageHandler: createImageHandler(config),
                    request: request
                });

            request.process(function(method, data) {
                imagine[method](data);
            });

        });*/


        // everything is fine
        callback(false);

    });



};
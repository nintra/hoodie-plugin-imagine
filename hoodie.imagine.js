
var config = require('./../../../../hoodie-plugin-imagine/config.json');


Hoodie.extend(function(hoodie, lib, utils) {


    var imagine = (function() {


        if (!config ||
            !config.groups || !config.groups.length ||
            !config.types || !config.types.length) {

            console.warn('please configure imagine first!');

        } else {
            config.general.basePath = '/' + config.general.directory;
        }



        // build image url
        function getImageUrl(id, type, srcFormat) {
            return hoodie.baseUrl + config.general.basePath + '/' + id + '/' + type.name + '.' + type.format;
        }



        // create a image object for the client
        function buildObject(id) {
            return {
                id : id,
                url: function(typeName) {
                    var type, i;

                    for(i=0; i < config.types.length; i++) {
                        if (config.types[i].name === typeName) {
                            type = config.types[i];
                            break;
                        }
                    }

                    if (!type) {
                        return false;
                    }

                    return getImageUrl(id, type);
                }
            };
        }



        // resize an image to targetWidth x targetHeight by using canvas
        function resizeImage(image, targetWidth, targetHeight) {
            var canvas = [
                    { element: document.createElement('canvas') },
                    { element: document.createElement('canvas') }
                ],

                step = {
                    width : image.width,
                    height: image.height
                },

                steps = Math.ceil(Math.log((image.width / targetWidth) / Math.log(2))),
                i = 0, dst = 0, src = 0;

            if (!canvas[0].element || !canvas[0].element.getContext){
                return 'canvas not supported!';
            }

            canvas[0].ctx = canvas[0].element.getContext('2d');
            canvas[1].ctx = canvas[1].element.getContext('2d');

            // resize step wise to improve quality
            canvas[dst].element.width  = step.width;
            canvas[dst].element.height = step.height;
            canvas[dst].ctx.drawImage(image, 0, 0, canvas[dst].element.width, canvas[dst].element.height);

            for (i=steps-1; i >= 0; i--) {
                dst = dst === 1 ? 0 : 1;
                src = dst === 1 ? 0 : 1;

                if (i > 0) {
                    step.width  = step.width / 2;
                    step.height = step.height / 2;
                } else {
                    step.width  = targetWidth;
                    step.height = targetHeight;
                }

                // console.log('step :', i, '/', steps, step.width, step.height);

                canvas[dst].element.width  = step.width;
                canvas[dst].element.height = step.height;

                canvas[dst].ctx
                    .drawImage(canvas[src].element,
                        0, 0, step.width, step.height
                    );
            }

            return canvas[dst].element;
        }



        // resize image by using canvas
        function downSizeImage(opts) {
            var defer = utils.promise.defer();

            if (!opts.dataUrl || !opts.size) {
                defer.reject('downsizing failed: missing parameters');
            }

            var image  = document.createElement('img'),

                handleLoadError = function() {
                    defer.reject(new Error('loading image failed'));
                };



            image.onload = function() {
                var imageRatio  = image.width / image.height,
                    canvasRatio = opts.size.width / opts.size.height,
                    mimeType    = opts.dataUrl.substring(5, opts.dataUrl.indexOf(';')),
                    canvas, width, height;


                if (image.width < opts.size.width && image.height < opts.size.height) {

                    // resizing superfluous
                    defer.resolve(opts.dataUrl);

                } else {

                    // fit image into bounding box
                    if (imageRatio < canvasRatio) {
                        width  = opts.size.height * imageRatio;
                        height = opts.size.height;
                    } else {
                        width  = opts.size.width;
                        height = opts.size.width / imageRatio;
                    }

                    canvas = resizeImage(image, width, height);

                    if (typeof(canvas) === 'string'){
                        defer.reject(new Error(canvas));
                    } else {
                        defer.resolve(canvas.toDataURL(mimeType));
                    }

                }

            };

            image.onerror = handleLoadError;
            image.onabort = handleLoadError;


            image.src = opts.dataUrl;


            return defer.promise;
        }



        function updateCreateImage(opts) {
            var defer = utils.promise.defer(),

                createTask = function(dataUrl) {
                    var settings = {
                        method  : opts.method,
                        objectId: opts.id,
                        group   : opts.group,
                        data    : dataUrl,
                        options : opts.options
                    };

                    hoodie.task.start('imagine', settings)
                        .done(function(request) {
                            defer.resolve(buildObject(request.imageData.id));
                        })
                        .fail(defer.reject);
                };


            if (!opts.id) {
                if (opts.method === 'update') {

                    defer.reject(new Error('´id´ property missing'));
                    return defer.promise;

                } else {

                    opts.id = utils.generateId() + utils.generateId();

                }
            }


            if (opts.imageData.substr(0,5) !== 'data:') {
                defer.reject(new Error('invalid data-url'));

            } else {

                if (config.general.clientResize) {

                    downSizeImage({
                            dataUrl: opts.imageData,
                            size: {
                                width : config.general.clientResize[0],
                                height: config.general.clientResize[1]
                            }
                        })
                        .done(function(dataUrl) {

                            // notify that resizing finished
                            defer.notify({
                                id     : opts.id,
                                dataUrl: dataUrl
                            });

                            createTask(dataUrl);
                        })
                        .fail(defer.reject);

                } else {
                    createTask(opts.imageData);
                }

            }

            return defer.promise;
        }



        // add image and return image id
        function addImage(group, imageData, options) {
            return updateCreateImage({
                method   : 'add',
                group    : group,
                imageData: imageData,
                options  : options
            });
        }



        // update imageData for image with id
        function updateImage(id, group, imageData, options) {
            return updateCreateImage({
                method   : 'update',
                id       : id,
                group    : group,
                imageData: imageData,
                options  : options
            });
        }



        // get image by id
        function findImages(ids) {
            var i, objects = {};

            if (typeof(ids) === 'object' && ids.constructor === Array) {
                for(i = ids.length-1; i > -1; i--) {
                    objects[ids[i]] = buildObject(ids[i]);
                }
                return objects;

            } else if (typeof(ids) === 'string') {
                return buildObject(ids);

            } else {
                throw new Error('´ids´ parameter must be string or array');
            }
        }



        // get images by current user
        function findOwnImages(group) {
            var defer     = utils.promise.defer(),
                settings  = { method: 'findOwn' };

            if (group) {
                settings.group = group;
            }

            hoodie.task.start('imagine', settings)
                .done(function(request) {
                    var images = request.imageData,
                        i, objects = {};

                    for(i = images.length-1; i > -1; i--) {
                        objects[images[i].id] = buildObject(images[i].id);
                    }

                    defer.resolve(objects);
                })
                .fail(defer.reject);

            return defer.promise;
        }



        // remove image by id
        function removeImage(ids) {
            var defer = utils.promise.defer();

            if (typeof(ids) === 'string') {
                ids = [ids];
            } else if (typeof(ids) === 'object' && ids.constructor === Array) {

            } else {
                defer.reject(new Error('´ids´ parameter must be string or array'));
            }

            hoodie.task.start('imagine', {
                    method   : 'remove',
                    objectIds: ids
                })
                .done(defer.resolve)
                .fail(defer.reject);

            return defer.promise;
        }



        // remove images by current user
        function removeOwnImages(group) {
            var defer    = utils.promise.defer(),
                settings = { method: 'removeOwn' };

            if (group) {
                settings.group = group;
            }

            hoodie.task.start('imagine', settings)
                .done(defer.resolve)
                .fail(defer.reject);

            return defer.promise;
        }



        return {
            add      : addImage,
            update   : updateImage,
            find     : findImages,
            findOwn  : findOwnImages,
            remove   : removeImage,
            removeOwn: removeOwnImages
        };

    })();



    hoodie.imagine = imagine;

});
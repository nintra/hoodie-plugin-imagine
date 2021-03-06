


var fs  = require('fs'),
    fse = require('fs-extra'),
    _   = require('lodash'),
    gm  = require('gm'),

    request = require('request');



module.exports = function(config) {



    // concats basePath and id
    function getFolderPath(id) {
        return config.basePath + '/' + id;
    }



    // converts a data-url to an object with: buffer, type
    function processImageData(imageData, callback) {
        if (typeof(imageData) !== 'string') {
            callback(true);
            return false;
        }

        if (imageData.substr(0, 5) === 'data:') {

            var headerLength = imageData.indexOf(','),
                header       = imageData.substr(0, headerLength+1),

                processed = {
                    buffer: new Buffer(imageData.substr(headerLength+1), 'base64'),
                    format: header.substring(5, header.indexOf(';'))
                        .replace('image/', '')
                        .replace('jpeg', 'jpg')
                };

            callback(false, processed);

        } else {

            request({
                    uri     : imageData,
                    method  : 'GET',
                    timeout : 8000,
                    encoding: null
                },

                function (error, response, buffer) {
                    processed = {
                        buffer: buffer,
                        format: response.headers['content-type']
                            .replace('image/', '')
                            .replace('jpeg', 'jpg')
                    };

                    callback(false, processed);
                }
            );

        }

    }



    // save resized images into a folder
    function saveImageFile(id, groupId, imageData, callback) {
        var path  = getFolderPath(id),

            group = _.find(config.groups, { id: groupId }),
            types = _.filter(config.types, function(type) {
                return group.types.indexOf(type.id) !== -1;
            });

        // add admin types
        types = types.concat(config.admin.types);


        processImageData(imageData, function(error, imageData) {
            if (error) {
                callback(new Error('could not convert data-url'));
                return false;
            }


            fs.mkdir(path, function(error) {
                if (error && error.code !== 'EEXIST') {
                    return callback(error);
                }

                fs.chmodSync(path, '755');


                // load image
                var image = gm(imageData.buffer, 'image.'+imageData.format);

                image.size(function(error, imageSize) {
                    if (error) {
                        console.warn(error);
                        callback(new Error('could not read image size'));
                        return false;
                    }


                    var imageRatio = imageSize.width / imageSize.height,
                        finish     = _.after(_.keys(types).length, function() {
                            // success
                            callback(false, {
                                sourceFormat: imageData.format
                            });
                        });

                    // create different image version
                    _.each(types, function(type) {
                        var image = gm(imageData.buffer, 'image.'+imageData.format),
                            fileFormat = imageData.format,
                            fileName   = type.name;

                        if (type.format) {
                            image = image.setFormat(type.format);
                            fileFormat = type.format;
                        }

                        if (type.quality) {
                            image = image.quality(type.quality);
                        }

                        fileName += '.' + fileFormat;


                        // background color
                        if (fileFormat === 'png') {
                            image = image
                                .bitdepth(32)
                                .background('#ffff');

                        } else if (fileFormat === 'jpg') {
                            image = image
                                .bitdepth(24)
                                .background('#fff');
                        }


                        if (type.resize && _.isArray(type.resize)) {

                            var canvasRatio  = type.resize[0] / type.resize[1],
                                canvasWidth  = type.resize[0],
                                canvasHeight = type.resize[1];

                            image = image
                                .gravity('Center');

                            if (type.method === 'cover' ? imageRatio > canvasRatio :  imageRatio < canvasRatio) {
                                imageSize.width  = canvasHeight * imageRatio;
                                imageSize.height = canvasHeight;
                            } else {
                                imageSize.width  = canvasWidth;
                                imageSize.height = canvasWidth / imageRatio;
                            }

                            image = image
                                .resize(imageSize.width, imageSize.height)
                                .extent(imageSize.width, imageSize.height);

                            if (type.method === 'cover') {
                                image = image.crop(canvasWidth, canvasHeight);
                            } else {
                                // needed?
                                // image = image.crop(imageSize.width, imageSize.height);
                            }

                        } else {
                            image = image.extent(imageSize.width, imageSize.height);
                        }



                        if (_.isArray(type.filters)) {
                            _.each(type.filters, function(filter) {
                                image = image[filter.command].apply(image, filter.arguments);
                            });
                        }


                        image.write(path + '/' + fileName, function(error) {
                            if (error) {
                                console.error('could not save image');
                                console.error(error);

                            } else {
                                fs.chmodSync(path + '/' + fileName, '755');
                            }


                            finish();
                        });


                    });
                });
            });
        });


    }



    // deletes image folder
    function deleteImageFile(id, callback) {
        var path = getFolderPath(id);

        fse.remove(path, callback);
    }



    return {
        saveFile  : saveImageFile,
        deleteFile: deleteImageFile
    };

};

var _ = require('lodash'),

    initRequest = require('./../plugin/request'),
    createUtils = require('./../plugin/utils'),
    getConfig   = require('./../plugin/config'),
    createImageHandler = require('./../plugin/images');


module.exports = function(hoodie) {
    var createRequest = initRequest(hoodie);

    return {

        // /_api/_plugins/imagine/_api
        'server.api.plugin-request': function(request, reply) {
            var data;

            if (!request.state.AuthSession) {
                return reply('unauthorized');
            }

            // only allow post requests to /image-upload
            if (request.params.p === 'image-upload' && request.method === 'post') {
                data = request.payload;

                var config  = getConfig(hoodie),
                    utils   = createUtils(config),
                    requestHandler = createRequest(data.userId, data, utils),

                    imagine = new hoodie.Imagine({
                        config      : config,
                        utils       : utils,
                        imageHandler: createImageHandler(config),
                        request     : requestHandler
                    });

                requestHandler.process(function(method, data) {
                    imagine[method](data);
                });

                requestHandler.defer.promise
                    .then(function(data) {
                        reply(data || {}).code(200);
                    })
                    .catch(function(error) {
                        reply(error).code(404);
                    });

                return true;
            }

            return reply();
        }

    };


};
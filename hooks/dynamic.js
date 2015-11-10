
var _ = require('lodash'),

    initRequest = require('./../plugin/request'),
    createUtils = require('./../plugin/utils'),
    getConfig   = require('./../plugin/config'),
    createImageHandler = require('./../plugin/images'),

    requestLib = require('request'),
    jar        = requestLib.jar();


module.exports = function(hoodie) {
    var createRequest = initRequest(hoodie);


    return {

        // /_api/_plugins/imagine/_api
        'server.api.plugin-request': function(request, reply) {
            var data, config, utils,
                requestHandler, imagine,
                bearerStr = 'Bearer ', cookie,
                sessionUrl = hoodie.env.couch.url + '/_session';


            // only allow post requests to /image-upload
            if (request.params.p !== 'image-upload' || request.method !== 'post') {
                return reply('method not allowed').code(405);
            }


            if (!request.headers.authorization || request.headers.authorization.substr(0, bearerStr.length) !== bearerStr) {
                return reply('unauthorized').code(401);
            }


            cookie = requestLib.cookie('AuthSession=' + request.headers.authorization.substring(bearerStr.length));
            jar.setCookie(cookie, sessionUrl);

            requestLib({
                    uri    : sessionUrl,
                    method : 'GET',
                    timeout: 5000,
                    jar    : jar,
                    json   : true
                },

                function(error, response, body) {
                    if (error) {
                        return reply(error);
                    }


                    hoodie.account
                        .find('user', body.userCtx.name.substr(5), function(error, doc) {
                            if (error) {
                                return reply('user id wrong').code(400);
                            }

                            data   = request.payload;
                            config = getConfig(hoodie);
                            utils  = createUtils(config);
                            requestHandler = createRequest(doc.hoodieId, data, utils);

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

                        });
                }
            );

            return true;
        }

    };


};
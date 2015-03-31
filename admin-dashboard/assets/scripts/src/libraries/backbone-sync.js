
define(function(require) {


    var _ = require('lodash'),

        Backbone = require('backbone'),
        config   = require('./config');



    function generateId() {
        var source = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-',
            id  = '', i;

        for (i=0; i < 10; i++) {
            id += source[_.random(source.length)];
        }

        return id;
    }


    // aweful
    Backbone.sync = function (method, modelOrCollection, options) {

        var attributes = _.omit(modelOrCollection.toJSON(), 'id'),

            id   = modelOrCollection.id,
            type = modelOrCollection.type,

            isCollection = _.has(modelOrCollection, 'models'),
            model, collection, data, index,
            promise;


        if (isCollection) {
            collection = modelOrCollection;
        } else {
            model = modelOrCollection;
        }

        options = options || {};


        switch (method) {
            case 'read':

                promise = config.get(type)
                    .then(function(data) {
                        if (isCollection) {
                            return data || [];
                        } else {
                            return data || {};
                        }
                    });

                break;


            case 'create':
            case 'update':

                if (type === 'general') {
                    promise = config.set(type, attributes);

                } else if (!isCollection) {

                    if (model.isNew()) {
                        model.set('id', generateId());
                    }

                    data = config.getCached(type) || [];
                    index = _.findIndex(data, { id: model.id });

                    if (index === -1) {
                        data.push(model.toJSON());
                    } else {
                        data[index] = model.toJSON();
                    }

                    promise = config.set(type, data);
                }



                break;


            case 'delete':

                if (!isCollection) {

                    data = config.getCached(type) || [];
                    index = _.findIndex(data, { id: model.id });

                    if (index > -1) {
                        data.splice(index, 1);
                    }

                    promise = config.set(type, data);
                }

                break;

        }


        if (options.success) {
            promise.done(function(response) {

                if (type !== 'general' && !isCollection) {
                    response = _.find(response, { id: id });
                }

                options.success.call(modelOrCollection, response);
            });
        }

        if (options.error) {
            promise.fail(options.error);
        }

        // allow for chaining
        return promise;
    };


});
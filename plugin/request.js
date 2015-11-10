


var fs = require('fs'),
    _  = require('lodash'),
    when = require('when');



module.exports = function(hoodie) {


    function Request(user, data, utils) {
        var self = this;

        self.defer = when.defer();
        self.utils = utils;
        self.data  = data;
        self.user  = user;
        self.userDbName = 'user/' + user;
    }



    // send error message to client
    Request.prototype.error = function(error) {
        var self = this,
            message = '';

        if (_.isObject(error) && !_.isUndefined(error.valid) && !_.isUndefined(error.errors)) {
            message = 'validation: ' +
                _.map(error.errors, function(error) {
                    return '´' + error.property + '´ ' + error.message;
                }).join(', ');

        } else if (_.isString(error)) {
            message = error;

        } else if (_.isObject(error)) {
            if (error.error && error.reason) {
                message = error.error + ': ' + error.reason;
            } else {
                message = error.message;
            }
        }

        self.defer.reject(message);
    };



    // send success message, append custom data
    Request.prototype.success = function(data) {
        var self = this;
        self.defer.resolve(data);
    };



    // checks 'method' of request and delegates
    Request.prototype.process = function(callback) {
        var self = this,
            data   = _.pick(self.data, ['method', 'objectId', 'objectIds', 'group', 'data', 'options']),
            result = self.utils.validateData(['method'], data);

        if (!result.valid) {
            return self.error(result);
        }

        callback(self.data.method, data, self);
    };


    return function(user, data, utils) {
        return new Request(user, data, utils);
    };

};
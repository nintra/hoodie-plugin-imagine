


var fs = require('fs'),
    _  = require('lodash');



module.exports = function(hoodie) {



    function Request(dbName, task, utils) {
        var self = this;

        self.utils = utils;
        self.task = task;
        self.user = dbName.replace('user/', '');
        self.userDbName = dbName;
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

        } else if (_.isObject(error) && error.reason) {
            message = error.reason;

        }

        // console.error(message);
        return hoodie.task.error(self.userDbName, self.task, message);
    };



    // send success message, append custom data
    Request.prototype.success = function(data) {
        var self = this;

        self.task.imageData = data;
        hoodie.task.success(self.userDbName, self.task, function(error) {
            if (error) {
                console.error('failure on task success', error.reason);
            }
        });
    };



    // checks 'method' of request and delegates
    Request.prototype.process = function(callback) {
        var self = this,
            data   = _.pick(self.task, ['method', 'objectId', 'objectIds', 'group', 'data', 'options']),
            result = self.utils.validateData(['method'], data);

        if (!result.valid) {
            return self.error(result);
        }

        callback(self.task.method, data, self);
    };


    return function(dbName, task, utils) {
        return new Request(dbName, task, utils);
    };

};
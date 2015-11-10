


var fs = require('fs'),
    _  = require('lodash'),
    shortid     = require('shortid'),
    revalidator = require('revalidator'),

    rxIsUrl = /^https?:\/\/.*/;



function Utils(config) {
    var self = this;

    self.config = config;
}



Utils.prototype.validationRules = function(keys) {
    var self  = this,
        rules = {
            method: {
                required: true,
                type: 'string',
                enum: [
                    'upsert',
                    'find',
                    'findOwn',
                    'remove',
                    'removeOwn'
                ]
            },

            objectId: {
                required: true,
                type: 'string',
                allowEmpty: false
            },

            objectIds: {
                required: true,
                type: 'array',
                minItems: 1,
                conform: function(ids) {
                    var i = 0;

                    for (i; i < ids.length; i++) {
                        if (typeof(ids[i]) !== 'string' || !ids[i]) {
                            return false;
                        }
                    }

                    return true;
                }
            },

            group: {
                type: 'string',
                allowEmpty: false,
                conform: function(name) {
                    return _.find(self.config.groups, { name: name });
                },
                messages: {
                    conform: 'group does not exist'
                }
            },

            data: {
                required: true,
                type: 'string',
                conform: function(data) {
                    return data.substr(0,5) === 'data:' || rxIsUrl.test(data);
                },
                messages: {
                    conform: 'invalid data'
                }
            },

            options: {
                type: 'object',

                properties: {
                }

            }
        };

    return keys ? _.pick(rules, keys) : rules;
};



// tests 'keys' of 'data' and returns an object
//     valid : boolean
//     errors: array of strings
Utils.prototype.validateData = function(keys, data) {
    var self  = this,
        rules = self.validationRules(keys);

    return revalidator.validate(data, { properties: rules });
};



//
Utils.prototype.generateId = function() {
    return shortid.generate() + shortid.generate();
};



// return image data for database interaction
Utils.prototype.prepareImageData = function(settings) {
    var self  = this,
        group = _.find(self.config.groups, { name: settings.group }),

        data = {
            // fileId: settings.fileId,
            user  : settings.user
        };

    if (!group) {
        return 'group not found';
    }

    data.groupId  = group.id;
    // data.verified = !!['before', 'after'].indexOf(group.verify);

    return data;
};



//
Utils.prototype.preparePublicImageData = function(results) {
    return _.map(results, function(result) {
        var doc = result.doc;

        return {
            id          : doc._id.replace('image/', ''),
            sourceFormat: doc.sourceFormat,
            groupId     : doc.groupId,
            fileId      : doc.fileId,
            verified    : doc.verified
        };
    });
};



module.exports = function(config) {
    var utils = new Utils(config);
    return utils;
};
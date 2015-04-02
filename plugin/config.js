


var fs = require('fs'),
    _  = require('lodash');



module.exports = function(hoodie) {

    var config = {
            databaseName: 'plugin-imagine'
        },
        database;


    var general = hoodie.config.get('general');
    if (!general || !general.directory) {
        return false;
    }

    config.basePath = hoodie.env.www_root + '/' + general.directory;
    config.general  = general;

    config.groups   = hoodie.config.get('groups');
    config.types    = hoodie.config.get('types');


    config.admin = hoodie.config.get('admin');
    if (!config.admin) {
        config.admin = {
            types: [
                {
                    id     : 'E1cnGYY41cIVtF',
                    name   : 'thumb',
                    size   : [150, 150],
                    method : 'cover',
                    format : 'jpg',
                    quality: 95
                },
                {
                    id     : 'VkHcbtFVJQfZtF',
                    name   : 'detail',
                    size   : [500, 500],
                    method : 'contain',
                    format : 'jpg',
                    quality: 90
                }
            ]
        };

        hoodie.config.set('admin', config.admin);
    }


    return config;

};
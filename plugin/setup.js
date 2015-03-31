


var fs  = require('fs'),
    fse = require('fs-extra'),
    _   = require('lodash'),

    getConfig = require('./config');



module.exports = function(hoodie, callback) {
    var config = getConfig(hoodie);

    if (!config) {
        console.warn('\nConfiguration missing: please configure imagine first, and restart the server!\n');
        return false;
    }


    // create a copy of the configuration for the client
    fs.writeFileSync('config.json',
        JSON.stringify({
            general: config.general,
            groups : config.groups,
            types  : config.types
        })
    );


    // create directory
    fse.mkdirs(config.basePath, function(error) {
        if (error && error.code !== 'EEXIST') {
            return callback(error);
        }


        // find / create database
        hoodie.database.findAll(function(error, databases) {
            if (error) {
                return callback(error);
            }


            if (databases.indexOf(config.databaseName) !== -1) {
                callback(false, hoodie.database(config.databaseName));

            } else {
                hoodie.database.add(config.databaseName, function(error, db) {
                    if (error) {
                        return callback(error);
                    }


                    db.addIndex('by-id',
                        {
                            map: function(doc) {
                                var id = doc._id.replace('image/', '');

                                if (doc.type === 'image') {
                                    emit(id, null);
                                }
                            }
                        },
                        function(error) {
                            if (error) {
                                return callback(error);
                            }


                            db.addIndex('by-user-group',
                                {
                                    map: function(doc) {
                                        if (doc.type === 'image') {
                                            emit([doc.user, doc.groupId], null);
                                        }
                                    }
                                },
                                function(error) {
                                    if (error) {
                                        return callback(error);
                                    }


                                    callback(false, db);

                                }
                            );

                        }
                    );


                });

            }
        });
    });

};
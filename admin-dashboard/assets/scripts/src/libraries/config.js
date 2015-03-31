

define(function(require) {

    var _ = require('lodash'),
        hoodieAdmin = require('./hoodie-admin');


    var config = (function() {
        var id  = 'plugin/hoodie-plugin-imagine',
            url = '/plugins/' + encodeURIComponent(id),
            rev = '',
            currentData = {};


        function createDocument() {
            var doc = {
                _id : id,
                config: currentData
            };

            if (rev) {
                doc._rev = rev;
            }

            return doc;
        }


        function processResponse(key) {
            return function(doc) {
                rev = doc.rev || doc._rev;
                return key ? currentData[key] || false : currentData;
            };
        }


        function getCached(key) {
            return currentData[key] && _.cloneDeep(currentData[key]);
        }


        function getConfig(key) {
            var promise = hoodieAdmin
                .request('GET', url)
                .then(function(doc) {
                    currentData = doc.config || {};
                    return doc;
                })
                .then(processResponse(key));

            return promise;
        }


        function setConfig(key, data) {
            var promise,
                doc = createDocument();

            doc.config[key] = data;

            promise = hoodieAdmin.request('PUT', url, {
                    data: JSON.stringify(doc)
                });

            promise = promise
                .then(processResponse(key));

            return promise;
        }


        return {
            get: getConfig,
            set: setConfig,
            getCached: getCached
        };

    })();


    return config;
});
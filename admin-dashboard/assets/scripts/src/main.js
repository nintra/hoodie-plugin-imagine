'use strict';

require.config({

    // To get timely, correct error triggers in IE, force a define/shim exports check.
    enforceDefine: true,
    baseUrl: 'assets/scripts/src',


    paths: {
        'lodash': '../../vendor/lodash/lodash.min',
        'jquery': 'libraries/jquery',
        'jquery.serialize-object': '../../vendor/jquery-serialize-object/dist/jquery.serialize-object.min',

        'sortable': '../../vendor/Sortable/Sortable',

        'backbone': '../../vendor/backbone/backbone'
    },

    shim: {

        'jquery.serialize-object': {
            deps: [
                'jquery'
            ],
            exports: '$.fn.serializeObject'
        }
    },

    wrapShim: true,

    map: {
        '*': {
            'underscore': 'lodash'
        }
    }
});


require([

        'jquery.serialize-object',
        'libraries/backbone-sync',

        'app'

    ], function() {

    }
);



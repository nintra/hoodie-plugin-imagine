
define(function(require) {

    var _ = require('lodash'),
        Backbone = require('backbone');


    var General = Backbone.Model.extend({

        defaults: {
            directory   : '',
            clientResize: [1000, 1000]
        },

        type: 'general',

        initialize: function() {

        }

    });


    return General;

});
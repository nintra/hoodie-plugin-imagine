
define(function(require) {

    var _ = require('lodash'),
        Backbone = require('backbone');


    var Type = Backbone.Model.extend({

        defaults: function() {
            return {
                name   : '',
                resize : false,
                method : 'contain',
                format : false,
                quality: 90,
                filters: []
            };
        },

        type: 'types',

        initialize: function() {

        }

    });


    return Type;

});
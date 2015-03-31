
define(function(require) {

    var _ = require('lodash'),
        Backbone = require('backbone');


    var Group = Backbone.Model.extend({

        defaults: function() {
            return {
                name  : '',
                public: false,
                verify: 'after',
                types : []
            };
        },

        type: 'groups',

        initialize: function() {

        }

    });


    return Group;

});
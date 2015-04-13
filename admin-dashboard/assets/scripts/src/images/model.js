
define(function(require) {

    var _ = require('lodash'),
        Backbone = require('backbone');


    var hImage = Backbone.Model.extend({

        defaults: function() {
            return {
                groupId: '',
                user   : ''
            };
        },

        initialize: function() {

        }

    });


    return hImage;

});
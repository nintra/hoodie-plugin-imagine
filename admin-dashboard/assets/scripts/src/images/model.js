
define(function(require) {

    var _ = require('lodash'),
        Backbone = require('backbone');


    var hImage = Backbone.Model.extend({

        defaults: function() {
            return {
                fileId      : '',
                groupId     : '',
                sourceFormat: '',
                user        : '',
                verified    : ''
            };
        },

        initialize: function() {

        }

    });


    return hImage;

});
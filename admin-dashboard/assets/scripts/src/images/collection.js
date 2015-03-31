
define(function(require) {

    var _ = require('lodash'),
        Backbone = require('backbone'),

        ImageModel = require('./model');


    var Images = Backbone.Collection.extend({

        model: ImageModel,

        initialize: function() {

        }

    });


    return Images;

});
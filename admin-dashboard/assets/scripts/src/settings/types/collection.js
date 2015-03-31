
define(function(require) {

    var _ = require('lodash'),
        Backbone = require('backbone'),

        TypeModel = require('./model');


    var Types = Backbone.Collection.extend({

        model: TypeModel,

        type: 'types',

        initialize: function() {

        }

    });


    return Types;

});
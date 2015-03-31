
define(function(require) {

    var _ = require('lodash'),
        Backbone = require('backbone'),

        GroupModel = require('./model');


    var Groups = Backbone.Collection.extend({

        model: GroupModel,

        type: 'groups',

        initialize: function() {

        }

    });


    return Groups;

});

define(function(require) {

    var _ = require('lodash'),
        $ = require('jquery'),

        Backbone = require('backbone'),
        ImageModel = require('./model');



    var View = Backbone.View.extend({



        ui: {
        },



        events: {
        },



        handleRemove: function(ev) {
            ev.preventDefault();
            var view  = this,
                model = view.model;

            if (window.confirm('Are you sure you want to remove this image?')) {
                model.destroy();
            }
        },



        modelDestroyed: function(model) {
            var view = this;
        },



        render: function() {
            var view  = this,
                model = view.model;


            return view;
        },



        initialize: function() {
            var view = this;

            _.each(view.ui, function(selector, name) {
                view.ui[name] = view.$el.find(selector);
            });

            view.listenTo(view.model, 'change', view.render);
            view.listenTo(view.collection, 'destroy', view.modelDestroyed);
        }


    });



    return View;

});
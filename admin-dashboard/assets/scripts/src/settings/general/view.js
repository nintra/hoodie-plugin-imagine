
define(function(require) {

    var _ = require('lodash'),
        $ = require('jquery'),

        hoodieAdmin = require('libraries/hoodie-admin'),
        config = require('libraries/config'),

        Backbone = require('backbone');


    var View = Backbone.View.extend({


        ui: {
            '$inputDirectory': 'input[name="directory"]',
            '$checkboxResize': 'input[name="client-resize"]',
            '$inputWidth'    : 'input[name="resize-width"]',
            '$inputHeight'   : 'input[name="resize-height"]'
        },



        events: {
            'ifToggled input[name="client-resize"]': 'updateClientResize',
            'submit': 'handleSubmit'
        },



        updateClientResize: function(ev) {
            var view  = this,
                state = ev.target.checked;

            view.ui.$inputWidth.prop('disabled', !state);
            view.ui.$inputHeight.prop('disabled', !state);
        },



        handleSubmit: function(ev) {
            ev.preventDefault();

            var view = this,
                data = {
                    directory: view.ui.$inputDirectory.val(),
                    clientResize: false
                };

            if (view.ui.$checkboxResize.is(':checked')) {
                data.clientResize = [
                    parseInt(view.ui.$inputWidth.val(),10),
                    parseInt(view.ui.$inputHeight.val(),10)
                ];
            }

            view.model.set(data);
            view.model.save();
        },



        render: function() {
            var view  = this,
                model = view.model;

            view.ui.$inputDirectory.val(model.get('directory'));

            var clientResize = model.get('clientResize');
            view.ui.$checkboxResize.iCheck(!!clientResize ? 'check' : 'uncheck');

            if (clientResize) {
                view.ui.$inputWidth.val(clientResize[0]);
                view.ui.$inputHeight.val(clientResize[1]);
            } else {
                view.ui.$inputWidth.val('');
                view.ui.$inputHeight.val('');
            }

            return view;
        },



        initialize: function() {
            var view = this;

            _.each(view.ui, function(selector, name) {
                view.ui[name] = view.$el.find(selector);
            });

            view.listenTo(view.model, 'change', view.render);
        }


    });


    return View;

});
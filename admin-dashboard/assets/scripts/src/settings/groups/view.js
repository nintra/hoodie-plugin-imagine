
define(function(require) {

    var _ = require('lodash'),
        $ = require('jquery'),

        Backbone = require('backbone'),

        GroupModel = require('./model');


    var View = Backbone.View.extend({


        ui: {
            '$selectGroup'   : '#group',
            '$inputName'     : '#group-name',
            '$checkboxPublic': '#group-public',
            '$radioVerifyBefore': '#group-verify-before',
            '$radioVerifyAfter' : '#group-verify-after',
            '$selectTypes'   : '#group-types',
            '$error': '.error'
        },



        events: {
            'change #group'    : 'changeModel',
            'submit'           : 'handleSubmit',
            'click .btn.remove': 'handleRemove'
        },



        showError: function(message) {
            var view = this;

            view.ui.$error
                .html('<span>'+message+'</span>')
                .addClass('show');

            if (view.errorTimer) {
                clearTimeout(view.errorTimer);
            }

            view.errorTimer = _.delay(function() {
                view.ui.$error.removeClass('show');
            }, 3000);
        },



        handleRemove: function(ev) {
            ev.preventDefault();
            var view  = this,
                model = view.model;

            if (model.isNew()) {
                model.clear();
            } else {
                if (window.confirm('Are you sure to you want to remove the group "'+model.get('name')+'"? You should never do this in production!')) {
                    model.destroy();
                }
            }
        },


        modelDestroyed: function(model) {
            var view   = this;

            if (model.id === view.model.id) {
                view.model = new GroupModel({});
                view.render();
            }

            view.updateGroup();
        },



        changeModel: function(ev) {
            ev.preventDefault();
            var view = this,
                modelId = view.ui.$selectGroup.val();

            if (!modelId || !view.collection.get(modelId)) {
                view.model = new GroupModel({});
            } else {
                view.model = view.collection.get(modelId);
            }

            view.render();
        },



        checkNameUnique: function(model) {
            var view = this;
            return view.collection.find(function(cmpModel) {
                return model.id !== cmpModel.id &&
                    model.get('name') === cmpModel.get('name');
            });
        },



        handleSubmit: function(ev) {
            ev.preventDefault();

            var view  = this,
                model = view.model,

                data  = _.extend(
                    _.result(model, 'defaults'),
                    view.$el.serializeObject().group,
                    {
                        types: view.ui.$selectTypes.select2('val')
                    }
                ),

                addCollection = view.model.isNew();

            model.set(data);

            if (view.checkNameUnique(model)) {
                view.showError('name not unique');
                return false;
            }


            model
                .save({}, {
                    error: function() {
                        console.error(arguments);
                        view.showError('could not save model');
                    },

                    success: function() {
                        if (addCollection) {
                            view.collection.add(model);
                        }
                    }
                });
        },



        updateGroup: function() {
            var view = this,
                data = [];

            view.collection.each(function(model) {
                data.push({
                    id  : model.id || model.cid,
                    text: model.get('name')
                });
            });

            view.updateGroupElement(data, view.model.id);
        },


        updateTypesElement: function(data) {
            var view = this;
            data = data || [];

            this.ui.$selectTypes
                .select2({
                    placeholder            : 'Choose Types',
                    minimumResultsForSearch: Infinity,
                    data                   : data,
                    multiple               : true,
                    tags                   : true
                });

            view.ui.$selectTypes.select2('val', view.model.get('types'));
        },


        updateGroupElement: function(data, id) {
            var view = this;

            data = data || [];
            data.unshift({ id: 0, text: 'Add Group' });

            this.ui.$selectGroup
                .select2({
                    placeholder: 'Choose Group',
                    minimumResultsForSearch: Infinity,
                    data: data
                });

            if (id) {
                view.ui.$selectGroup.select2('val', id);
            }
        },


        render: function() {
            var view  = this,
                model = view.model;


            view.ui.$inputName.val(model.get('name'));
            view.ui.$checkboxPublic.iCheck(model.get('public') ? 'check' : 'uncheck');

            if (model.get('verify') === 'before') {
                view.ui.$radioVerifyBefore.iCheck('check');
            } else {
                view.ui.$radioVerifyAfter.iCheck('check');
            }

            view.ui.$selectTypes.select2('val', model.get('types'));

            return view;
        },



        initialize: function() {
            var view = this;

            _.each(view.ui, function(selector, name) {
                view.ui[name] = view.$el.find(selector);
            });

            view.updateGroupElement();
            view.updateTypesElement();

            view.listenTo(view.model, 'change', view.render);
            view.listenTo(view.collection, 'destroy', view.modelDestroyed);
            view.listenTo(view.collection, 'sync', view.updateGroup);
        }


    });


    return View;

});
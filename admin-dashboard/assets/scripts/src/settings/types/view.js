
define(function(require) {

    var _ = require('lodash'),
        $ = require('jquery'),
        Sortable = require('sortable'),

        Backbone = require('backbone'),

        TypeModel = require('./model');


    var View = Backbone.View.extend({


        filterTemplate: _.template(
            '<li>'+
                '<input type="text" class="form-control" name="type[filters][][command]" placeholder="command" value="<%= command %>">'+
                '<input type="text" class="form-control" name="type[filters][][arguments]" placeholder="arg, ume, nts" value="<%= arguments %>">'+
                '<div class="btn move-filter">Move</div>'+
                '<button class="btn careful remove-filter">Remove</button>'+
            '</li>'
        ),


        ui: {
            '$selectType': '#type',
            '$inputName' : '#type-name',

            '$checkboxResize'   : '#type-resize',
            '$inputResizeWidth' : '#type-resize-width',
            '$inputResizeHeight': '#type-resize-height',

            '$radioResizeMethod': '[name="type[method]"]',

            '$radioFormat' : 'input[name="type[format]"]',
            '$inputQuality': '#type-quality',
            '$outputQuality': '#type-quality-output',

            '$filterList': '.filters-container .filters',

            '$error': '.error'
        },



        events: {
            'input #type-quality'   : 'updateQuality',
            'change #type'          : 'changeModel',
            'ifToggled #type-resize': 'handleCheckResize',
            'submit'                : 'handleSubmit',
            'click .btn.remove'     : 'handleRemove',

            'click .btn.remove-filter': 'removeFilter',
            'click .btn.add-filter': 'addFilter'
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



        removeFilter: function(ev) {
            ev.preventDefault();

            var view    = this,
                $button = $(ev.currentTarget);

            $button.parent().remove();
        },


        addFilter: function(ev) {
            ev.preventDefault();

            var view = this;
            view.ui.$filterList.append(view.filterTemplate({ command: '', arguments: '' }));
        },



        updateQuality: function(ev) {
            ev.preventDefault();
            var view = this;
            view.ui.$outputQuality.val(view.ui.$inputQuality.val());
        },



        handleCheckResize: function(ev) {
            var view  = this,
                state = ev.target.checked;

            view.ui.$inputResizeWidth.prop('disabled', !state);
            view.ui.$inputResizeHeight.prop('disabled', !state);

            view.ui.$radioResizeMethod.iCheck(state ? 'enable' : 'disable');

        },



        handleRemove: function(ev) {
            ev.preventDefault();
            var view  = this,
                model = view.model;

            if (model.isNew()) {
                model.clear();
            } else {
                if (window.confirm('Are you sure you want to remove the type "'+model.get('name')+'"? You should never do this in production!')) {
                    model.destroy();
                }
            }
        },


        modelDestroyed: function(model) {
            var view   = this;

            if (model.id === view.model.id) {
                view.model = new TypeModel({});
                view.render();
            }

            view.updateType();
        },



        changeModel: function(ev) {
            ev.preventDefault();
            var view = this,
                modelId = view.ui.$selectType.val();

            if (!modelId || !view.collection.get(modelId)) {
                view.model = new TypeModel({});
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
                    view.$el.serializeObject().type
                ),

                addCollection = view.model.isNew();


            if (data.resize) {
                data.resize = [
                    parseInt(data.resize.width,10),
                    parseInt(data.resize.height,10)
                ];
            }

            // data.format  = data.format || false;
            data.quality = parseInt(data.quality, 10);


            data.filters = _.compact(_.map(data.filters, function(filter) {
                if (!filter.command.length) {
                    return false;
                }

                var args = filter.arguments.split(',');
                _.each(args, function(arg, index) {
                    arg = _.trim(arg, ' \'"');

                    if (arg.length && !isNaN(arg)) {
                        arg = _.parseInt(arg);
                    }

                    args[index] = arg;
                });

                return {
                    command  : filter.command,
                    arguments: args
                };
            }));


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



        updateType: function() {
            var view = this,
                data = [];

            view.collection.each(function(model) {
                data.push({
                    id  : model.id || model.cid,
                    text: model.get('name')
                });
            });

            view.trigger('updated:types', data);
            view.updateTypeElement(_.clone(data), view.model.id);
        },


        updateTypeElement: function(data, id) {
            var view = this;

            data = data || [];
            data.unshift({ id: 0, text: 'Add Type' });

            this.ui.$selectType
                .select2({
                    placeholder: 'Choose Type',
                    minimumResultsForSearch: Infinity,
                    data: data
                });

            if (id) {
                view.ui.$selectType.select2('val', id);
            }
        },


        render: function() {
            var view  = this,
                model = view.model,
                htmlList  = [];


            view.ui.$inputName.val(model.get('name'));
            view.ui.$checkboxResize.iCheck(model.get('resize') ? 'check' : 'uncheck');

            if (model.get('resize')) {
                view.ui.$inputResizeWidth.val(model.get('resize')[0]);
                view.ui.$inputResizeHeight.val(model.get('resize')[1]);
            } else {
                view.ui.$inputResizeWidth.val('');
                view.ui.$inputResizeHeight.val('');
            }

            view.ui.$inputResizeWidth.prop('disabled', !model.get('resize'));
            view.ui.$inputResizeHeight.prop('disabled', !model.get('resize'));

            view.ui.$radioResizeMethod.iCheck(model.get('resize') ? 'enable' : 'disable');
            view.ui.$radioResizeMethod.filter('[value="'+model.get('method')+'"]').iCheck('check');

            view.ui.$radioFormat.filter('[value="'+model.get('format')+'"]').iCheck('check');
            view.ui.$inputQuality.val(model.get('quality'));
            view.ui.$outputQuality.val(model.get('quality'));


            htmlList = _.map(model.get('filters'), function(filter) {
                var args = _.isArray(filter.arguments) ? filter.arguments : [];

                return view.filterTemplate({
                        command  : filter.command,
                        arguments:  args.join(', ')
                    });
            });
            view.ui.$filterList.html(htmlList.join(''));


            return view;
        },



        initialize: function() {
            var view = this;

            _.each(view.ui, function(selector, name) {
                view.ui[name] = view.$el.find(selector);
            });

            // load collection in type selector
            view.updateTypeElement();

            // make filter list sortable
            var sortable = Sortable.create(view.ui.$filterList[0], {
                handle: '.move-filter'
            });

            view.listenTo(view.model, 'change', view.render);
            view.listenTo(view.collection, 'destroy', view.modelDestroyed);
            view.listenTo(view.collection, 'sync', view.updateType);
        }


    });


    return View;

});
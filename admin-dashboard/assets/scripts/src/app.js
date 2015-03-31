
define(function(require) {

    var _ = require('lodash'),
        $ = require('jquery'),

        GeneralView  = require('settings/general/view'),
        GeneralModel = require('settings/general/model'),

        GroupView  = require('settings/groups/view'),
        GroupModel = require('settings/groups/model'),
        GroupCollection = require('settings/groups/collection'),

        TypeView  = require('settings/types/view'),
        TypeModel = require('settings/types/model'),
        TypeCollection = require('settings/types/collection');



    var $plugin = $('#plugin-imagine');


    // tabs
    var $tabItems      = $plugin.find('> .tabs > li'),
        $tabContainers = $plugin.find('> .tab-containers > div');

    $plugin.children('.tabs').on('click', 'li', function(ev) {
        ev.preventDefault();
        var $tab = $(this);

        if (!$tab.hasClass('active')) {
            $tabItems.not($tab).removeClass('active');
            $tab.addClass('active');

            $tabContainers
                .removeClass('active')
                .filter('#'+$tab.data('tab'))
                .addClass('active');
        }
    });


    // settings general
    var generalModel = new GeneralModel({ id: 'general' }),
        generalView  = new GeneralView({
            model: generalModel,
            el   : $plugin.find('form.general')
        });

    generalModel.fetch();


    // settings groups
    var groupCollection = new GroupCollection(),

        groupView  = new GroupView({
            model     : new GroupModel({}),
            collection: groupCollection,
            el        : $plugin.find('form.groups')
        });

    groupCollection.fetch();


    // settings types
    var typeCollection = new TypeCollection(),

        typeView  = new TypeView({
            model     : new TypeModel({}),
            collection: typeCollection,
            el        : $plugin.find('form.types')
        });

    typeCollection.fetch();


    // update type select in group view on change
    groupView.listenTo(typeView, 'updated:types', groupView.updateTypesElement);



    // image verification,
    /*var hoodieAdmin = require('libraries/hoodie-admin');
    hoodieAdmin
        .request('GET', '/plugin-imagine/_design/views/_view/by-id/', {
            data: {
                start_key: 0,
                limit: 3,
                include_docs: true
            }
        })
        .then(function(results) {
            console.warn(results);
        });*/

});
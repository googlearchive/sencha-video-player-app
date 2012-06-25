/**
 * Defines the viewport, with the north toolbar, the west treepanel navigation
 * and the central part for the Media Servers Graph and Media Server Explorer
 */
Ext.define('VP.view.Viewport',{
    extend: 'Ext.container.Viewport',
    layout: 'border',
    items: [{
        xtype: 'container',
        region: 'north',
        itemId: 'viewport-toolbar',
        cls: 'viewport-toolbar',
        defaultType: 'button',
        height: 50,
        layout: {
            type: 'hbox',
            align: 'middle',
            overflowHandler: 'Menu'
        },
        items: [{
            xtype: 'label',
            cls: 'sencha-logo',
            text: 'Sencha'
        },{
            xtype: 'label',
            cls: 'messages-ct',
            itemId: 'messages-ct',
            flex: 1
        },{
            text: 'Take Offline',
            itemId: 'download-btn',
            ui: 'action',
            iconCls: 'ico-download-button-arrow',
            iconAlign: 'right',
            disabled: true
        },{
            text: 'Cancel',
            itemId: 'cancel-download-btn',
            disabled: true
        }]
    },{
        xtype: 'mediaserverstree',
        region: 'west'
    },{
        xtype: 'container',
        itemId: 'viewport-center',
        layout: 'fit',
        region: 'center',
        items: {
            xtype: 'mediaserversgraph'
        }
    }]
});
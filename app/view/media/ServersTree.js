/**
 * Displays the lateral treepanel navigation, with servers, folders and files.
 */
Ext.define('VP.view.media.ServersTree',{
    extend: 'Ext.tree.Panel',
    xtype: 'mediaserverstree',
    cls: 'vp-mediaserverstree',
    displayField: 'name',
    border: false,
    rootVisible: false,
    hideHeaders: true,
    singleExpand: true,
    width: 200,
    
    initComponent: function() {
        this.store = Ext.create('VP.store.MediaItems', {
            root: {
                children: [{
                    name: 'MEDIA SERVERS',
                    cls: 'server-node',
                    type: 'media_servers',
                    leaf: true
                },{
                    name: 'Local',
                    cls: 'server-node',
                    type: 'local',
                    expanded: true,
                    isRemote: false,
                    children: [{
                        id: '/audio',
                        url: '/audio',
                        serverId: 'local',
                        name: 'Audio',
                        isRemote: false
                    },{
                        id: '/video',
                        url: '/video',
                        serverId: 'local',
                        name: 'Video',
                        isRemote: false
                    }]
                }]
            }
        });

        this.callParent(arguments);
    }
});
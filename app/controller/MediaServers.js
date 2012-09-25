/**
 * Controller for the Media Servers, the treepanel that stands on the left of the viewport, 
 * and also the Media Server Graph, that goes at the center and allows the user to discover 
 * and pick a server.
 */
Ext.define('VP.controller.MediaServers', {
    extend: 'Ext.app.Controller',
    
    stores: [
        'MediaItems'
    ],
    models: [
        'MediaItem'
    ],
    views: [
        'Viewport',
        'media.ServersGraph',
        'media.ServersTree'
    ],
    refs: [
        {ref: 'viewportCenter',     selector: 'viewport > #viewport-center'     },
        {ref: 'messagesCt',         selector: 'viewport > #viewport-toolbar > #messages-ct'},
        {ref: 'serversTree',        selector: 'mediaserverstree'                },
        {ref: 'mediaExplorer',      selector: 'mediaexplorer'                   }
        
    ],
    
    //@private
    init: function() {
        var me = this;
        
        me.control({
            'mediaserversgraph': {
                afterrender : me.onServersGraphRender
            },
            'mediaserversgraph button': {
                click : me.onServerGraphClick
            },
            'mediaserversgraph #main-button': {
                click: me.onGraphReloadClick
            },
            'mediaserverstree': {
                itemclick: me.onItemClick,
                itemdblclick: me.onServerItemDblClick
            }
        });
    },
    
    /**
     * Triggers server discovering when the graph view is rendered.
     */
    onServersGraphRender: function(serversGraph) {
        this.discoverServers(true, serversGraph);
    },
    
    /**
     * Triggers server discovering when the center button is clicked.
     */
    onGraphReloadClick: function(btn) {
        this.discoverServers(false, btn.up('mediaserversgraph'));
    },
    
    /**
     * When an server on the graph is clicked, insert it on the lateral
     * treepanel and trigger the process to show the Media Explorer
     */
    onServerGraphClick: function(btn) {
        if (btn.itemId === 'main-button') {
            return;
        }
        
        var serversTree     = this.getServersTree(),
            root            = serversTree.getRootNode(),
            nodeRemote      = root.findChild('isRemote', true),
            serverData      = btn.data;
            
        if (nodeRemote) {
            nodeRemote.remove();
        }

        nodeRemote = root.insertChild(1, {
            id: serverData.id,
            name: serverData.friendlyName,
            cls: 'server-node',
            type: 'server',
            isRemote: true,
            expanded: true
        });
        
        serversTree.selModel.select(nodeRemote);
    },
    
    /**
     * Method for sending a message to the parent page for discovering
     * media servers, gather the results, and add to the graph view
     */
    discoverServers: function(isFirstLoad, serversGraph) {
        var me          = this,
            len         = 0,
            bodyCt      = serversGraph.child('#body'),
            mainBtn     = bodyCt.child('#main-button'),
            messagesCt  = me.getMessagesCt();
    
        //active loading
        if (mainBtn.isLoading) {
            return;
        }
        
        mainBtn.isLoading = true;
        mainBtn.setIconCls('ico-loading');
        mainBtn.setText('Discovering Servers...');
        messagesCt.setText('Please select a media server to start browsing');
        
        if (isFirstLoad) {
            mainBtn.addCls('pop-in');
        }
        
        //remove current servers
        bodyCt.suspendLayouts();
        while (bodyCt.getComponent(1)) {
            bodyCt.remove(bodyCt.getComponent(1));
            len++;
        }
        bodyCt.resumeLayouts(!!len);
        
        //discover servers
        if (me.activeDiscoverRequest) {
            Ext.data.PostMessage.abort(me.activeDiscoverRequest);
        }
        
        me.activeDiscoverRequest = Ext.data.PostMessage.request({
            key: 'upnp-discover',
            success: function(data) {
                var items = [];
                delete me.activeDiscoverRequest;
                
                if (serversGraph.isDestroyed) {
                    return;
                }
                
                mainBtn.isLoading = false;
                mainBtn.removeCls('pop-in');
                mainBtn.setIconCls('ico-server');
                mainBtn.setText('Media Servers');
                
                //add servers
                Ext.each(data, function(server) {
                    var icon,
                        urlBase = server.urlBase;
                    
                    if (urlBase) {
                        if (urlBase.substr(urlBase.length-1, 1) === '/'){
                            urlBase = urlBase.substr(0, urlBase.length-1);
                        }
                    }
                    
                    if (server.icons && server.icons.length) {
                        if (server.icons[1]) {
                            icon = server.icons[1].url;
                        } 
                        else {
                            icon = server.icons[0].url;
                        }
                        
                        icon = urlBase + icon;
                    }

                    items.push({
                        itemId: server.id,
                        text: server.friendlyName,
                        icon: icon,
                        data: server
                    });
                });
                
                //fake
                // items.push({itemId: 1, text: 'Server 1' });
                // items.push({itemId: 2, text: 'Server 2' });
                // items.push({itemId: 3, text: 'Server 3' });
                // items.push({itemId: 4, text: 'Server 4' });
                //modify according to your local network
                items.push({
                    itemId: 1, 
                    text: 'My PC',
                    icon: 'http://172.16.10.124/code/GooglePlatformApps/SenchaVideoPlayer/resources/images/computer.png'
                });
                
                items.push({
                    itemId: 2, 
                    text: 'PS3 Media Server',
                    icon: 'http://172.16.10.124/code/GooglePlatformApps/SenchaVideoPlayer/resources/images/play3.png'
                });
                
                    
                bodyCt.add(items);
                serversGraph.fanOut();
            },
            failure: function() {
                delete me.activeDiscoverRequest;
                
                if (serversGraph.isDestroyed) {
                    return;
                }
                
                mainBtn.isLoading = false;
                mainBtn.removeCls('pop-in');
                mainBtn.setIconCls('ico-error');
                mainBtn.setText('Error...click to retry');
            }
        });
    },
    
    /**
     * When an item on the tree is clicked, we want 
     * to collapse/expand. By default you need to click
     * exacly on the arrow, or double click.
     */
    onItemClick: function(view, record) {
        if(record.isExpanded()) {
            record.collapse();
        } 
        else {
            record.expand();
        }
    },
    
    /**
     * When an item on the side navigation is double clicked,
     * and if it's a media file, triggers the player on the parent
     * page.* 
     */
    onServerItemDblClick: function(treeView, node) {
        var type = node.get('type');
        
        if (type === 'video' || type === 'audio') {
            Ext.data.PostMessage.request({
                key     : 'play-media',
                params  : {
                    url : node.get('url'),
                    name: node.get('name'),
                    type: node.get('type')
                }
            });
        }
    }
});

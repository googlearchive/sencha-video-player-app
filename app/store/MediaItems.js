/**
 * This is the store used on the lateral treepanel navigation.
 * It uses the {@link VP.model.MediaItem} model, and it fetches 
 * the data from the parent page using a HTML5 PostMessage Proxy.
 */
Ext.define('VP.store.MediaItems',{
    extend: 'Ext.data.TreeStore',
    model: 'VP.model.MediaItem',
    nodeParam: 'nodeId',
    proxy: {
        type: 'postmessage',
        key: 'upnp-browse'
    },
    
    /**
     * Overrides the normal load method to pass the whole node
     * object to the proxy, other than just the string nodeID* 
     */
    load: function(options) {
        options = options || {};
        options.params = options.params || {};

        var node = options.node || this.tree.getRootNode();
            
        options.params.node = node.data;
        this.callParent([options]);
    }
});
Ext.define('VP.store.MediaExplorer',{
    extend: 'Ext.data.Store',
    model: 'VP.model.MediaItem',
    proxy: {
        type: 'memory'
    }
});
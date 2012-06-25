/**
 * @class VP.Application
 * @singleton
 * Starts up the application, defining the namespace, loading up the baseUrl from the 
 * parent page, and creating the {@link VP.view.Viewport}
 */
Ext.data.PostMessage.request({
    key     : 'extension-baseurl',
    success : function(baseUrl) {
        
        debugger;
        
        //<debug>
        Ext.Loader.setConfig({
            enabled: true,
            paths: {
                'Ext.data.proxy.PostMessage': baseUrl + 'lib/ext/data/proxy/PostMessage.js'
            }
        });
    
        Ext.require([
            'Ext.data.proxy.PostMessage'
        ]);
        //</debug>
    
        Ext.application({
            name: 'VP',
            appFolder: baseUrl + 'app',
        
            controllers: [
                'MediaExplorer',
                'MediaServers'
            ],
    
            launch:function() {
                Ext.create('VP.view.Viewport');
            }
        });
    }
});
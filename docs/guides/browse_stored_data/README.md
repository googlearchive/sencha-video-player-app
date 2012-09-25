# Browse server for media assets

## 1. Requirements

To have an access to media assets, first a valid discovered UPNP media instance should be resolved. For sample implementation, please follow section Media Discovery.

## 2. Browse and show assets

Main logic is implemented inside MediaExplorer and MediaServers controllers. Visual part in the center is handled by view named VP.view.media.Explorer . A base for visual representation is ExtJs dataview with custom template. To have artwork and other details displayed inside dataview, we define a custom template.

For the left side media tree we have a view named VP.view.media.ServersTree . This view extends tree panel, which is an ExtJs component responsive for rendering hierarchically structured sets of data. This component will automagically represent information from the bounded store.

To feed the view stores with data, a method is called whenever user clicks on Media server icon or an interaction is done selected tree node.

To load a fresh set of data Tree sores proxy is called with a key 'upnpBrowse' which will trigger a call to media server and return structured data.

Detailed information on how to use these components can be found in following ExtJs documentation sections:

- [Ext.data.Store](http://docs.sencha.com/ext-js/4-1/#!/api/Ext.data.Store)
- [Ext.view.View](http://docs.sencha.com/ext-js/4-1/#!/api/Ext.view.View)
- [Ext.panel.Panel](http://docs.sencha.com/ext-js/4-1/#!/api/Ext.panel.Panel)
- [Ext.XTemplate](http://docs.sencha.com/ext-js/4-1/#!/api/Ext.XTemplate)
- [Ext.tree.Panel](http://docs.sencha.com/ext-js/4-1/#!/api/Ext.tree.Panel)

Related information can also be found in the following Sencha guides:
- [Data package concepts](http://docs.sencha.com/ext-js/4-1/#!/guide/data)
- [Trees](http://docs.sencha.com/ext-js/4-1/#!/guide/tree)
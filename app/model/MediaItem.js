/**
 * MediaItem represents any item that is used on the side navigation
 * tree, or the central Media Explorer View. It could be either a server,
 * a folder or a file.
 */
Ext.define('VP.model.MediaItem',{
    extend: 'Ext.data.Model',
    fields: [
        {name: 'id'         },
        {name: 'url'        },
        {name: 'serverId'   },
        {name: 'type'       },
        {name: 'name'       },
        {name: 'metaData'   },
        {
            name: 'isRemote',
            defaultValue: false,
            persistent: false   
        },
        {
            name: 'downloadStatus', //downloaded or ''
            type: 'string',
            defaultValue: '',
            persistent: false
        }
    ]
});
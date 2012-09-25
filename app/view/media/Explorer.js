Ext.define('VP.view.media.Explorer',{
    extend: 'Ext.Panel',
    xtype: 'mediaexplorer',
    cls: 'vp-mediaexplorer',
    layout: 'fit',
    border: false,
    isRemote: false,
    items: {
        xtype: 'dataview',
        store: 'MediaExplorer',
        emptyText: '<div class="empty-media-folder">No media files found.</div>',
        autoScroll: true,
        simpleSelect: true,
        itemTpl: Ext.create('Ext.XTemplate', '{[this.getTemplate(values)]}', {
            getTemplate: function(values) {
                var output          = [],
                    downloadStatus  = values.downloadStatus,
                    metaData        = values.metaData||{},
                    type            = values.type,
                    i               = values.url.lastIndexOf('.'),
                    extension       = i != -1 ? values.url.substring(i+1) : '',
                    duration        = metaData.duration||'-',
                    size            = metaData.size ? Ext.util.Format.fileSize(metaData.size) : '-';

                //download icon    
                output.push('<a class="col checkbox ' + downloadStatus + '"></a>');
                
                //artwork
                output.push('<div class="col artwork ' + type + '" ');

                if (metaData.artwork) {
                    output.push('style="background-image:url(\''+ metaData.artwork +'\');" ');
                }
                
                output.push('></div>');
                
                //name and extension
                output.push('<div class="header" title="'+values.name+'"><h3>'+ values.name +'</h3>');
                
                if (extension) {
                    output.push('<h4>'+extension.toUpperCase()+'</h4>');
                }
                
                output.push('</div>');
            
                //duration
                if (duration.length === 8 && duration.substr(0,3) === '00:') {
                    duration = duration.substr(3,5);
                }
                
                output.push('<div class="col info">'+ duration +'</div>');
                
                //size
                output.push('<div class="col info">'+ size  +'</div>');
                
                return output.join('');
            }
        })
    },
    dockedItems: [{
        xtype: 'toolbar',
        dock: 'top',
        items: ['->',{
            xtype: 'tbtext',
            itemId: 'files-count',
            cls: 'files-count'
        }]
    }],
    
    afterRender: function() {
        this.callParent(arguments);
        this.checkRemote();
    },
    
    checkRemote: function() {
        if (this.isRemote) {
            this.el.addCls('mediaexplorer-remote');
            this.el.removeCls('mediaexplorer-local');
        }
        else {
            this.el.addCls('mediaexplorer-local');
            this.el.removeCls('mediaexplorer-remote');
        } 
    }
});
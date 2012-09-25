/**
 * Controller for the Media Explorer, the central panel that list all
 * the files inside a media server folder.
 */
Ext.define('VP.controller.MediaExplorer', {
    extend: 'Ext.app.Controller',
    
    stores: [
        'MediaExplorer'
    ],
    views: [
        'media.Explorer'
    ],
    refs: [
        {ref: 'viewportCenter',     selector: 'viewport > #viewport-center'     },
        {ref: 'messagesCt',         selector: 'viewport > #viewport-toolbar > #messages-ct' },
        {ref: 'downloadBtn',        selector: 'viewport > #viewport-toolbar > #download-btn'},
        {ref: 'cancelBtn',          selector: 'viewport > #viewport-toolbar > #cancel-download-btn'},
        {ref: 'serversTree',        selector: 'mediaserverstree'                },
        {ref: 'mediaExplorer',      selector: 'mediaexplorer'                   },
        {ref: 'explorerToolbar',    selector: 'mediaexplorer > toolbar'         }
    ],
    
    //@private
    init: function() {
        var me = this;
        
        me.control({
            'mediaserverstree': {
                select: me.onServerItemSelect,
                itemclick: me.onServerItemClick
            },
            'mediaexplorer': {
                render: me.onExplorerRender
            },
            'mediaexplorer dataview': {
                itemdblclick: me.onFileDblClick,
                beforeselect: me.onBeforeSelectFile,
                selectionchange: me.onFilesSelectionChange
            },
            'viewport > #viewport-toolbar > #download-btn': {
                click: me.downloadSelectedFiles
            },
            'viewport > #viewport-toolbar > #cancel-download-btn': {
                click: me.onCancelBtnClick
            }
        });
        
        Ext.EventManager.on(window, 'message',  me.onMessage, me);
    },
    
    /**
     * Listener for the 'download-progress' message. Each time a file is taken offline,
     * the parent page will emit a progress status. This method is notified and it 
     * displays a progress bar indicator.
     * @param {Ext.EventObject} e The {@link Ext.EventObject} encapsulating the DOM event.
     */
    onMessage: function(e) {
        var me  = this,
            data= e.browserEvent.data||{};

        if (data.key !== 'download-progresss') {
            return;
        }

        var filesLeft, msg,
            messagesCt      = me.getMessagesCt(),
            totalPercentage = data.totalPercentage,
            completedFiles  = data.completedFiles,
            progressMsgEl   = messagesCt.el.child('.progress-msg'),
            progressBarEl   = messagesCt.el.down('.progress-bar span');
        
        //process completed
        if (completedFiles) {
            messagesCt.update(
                '' + completedFiles + (completedFiles > 1 ?  ' files' : ' file') + ' saved!' +
                '<span class="completed-icon"></span>'
            );
        }
        else {
            
            //calculate files left to download
            filesLeft = data.totalFiles-data.downloadedFiles;
            
            //if none, only left is to save them
            if (filesLeft === 0) {
                messagesCt.update('Saving files...');
            } 
            else {
                
                //otherwhise, update progress
                msg = 'Synchronizing '+ filesLeft + ' of ' + data.totalFiles + (data.totalFiles > 1 ? ' files' : ' file');
            
                if (progressMsgEl) {
                    progressMsgEl.update(msg);
        
                    if (Ext.isDefined(totalPercentage)){
                        progressBarEl.applyStyles({ width: totalPercentage + '%' });
                    }
                }
                else {
                    messagesCt.update(
                        '<p class="progress-msg">' + msg + '</p>' + 
                        '<div class="progress-bar"><span style="width:'+totalPercentage+'%;"></span></div>'
                    );
                }
            }
        }
    },
    
    /**
     * Every time a item on the servers tree is selected, we need to expand the node for
     * loading its media, and also update the Media Explorer View and its breadcrumb
     * navigation.
     * @param {Ext.selection.RowModel} selModel
     * @param {Ext.data.Model} node The selected record
     */
    onServerItemSelect: function(selModel, node) {
        if (node.isLeaf()) {
            return;
        }

        var me              = this,
            viewportCenter  = me.getViewportCenter(),
            mediaExplorer   = me.getMediaExplorer();
        //debugger;
        //if it does not exists, add the media explorer
        if (!mediaExplorer) {
            viewportCenter.removeAll();
            mediaExplorer = viewportCenter.add({
                xtype: 'mediaexplorer',
                isRemote: node.get('isRemote')
            });
        }
        else {
            mediaExplorer.isRemote = node.get('isRemote');
            mediaExplorer.checkRemote();
        }
        
        //update breadcrumb
        me.updateBreadcrumb();
        
        //update list
        var loadExplorer = function() {
            var data = [];
            
            //only add to explorer media files
            node.eachChild(function(node) {
                var type = node.get('type');
                
                if (type === 'audio' || type === 'video') {
                    data.push(Ext.apply({}, node.raw));
                }
            });
            
            Ext.getStore('MediaExplorer').loadData(data);
            
            //update counter
            mediaExplorer.down('#files-count').setText(data.length + ' files');
        };
        
        if (node.isLoaded()) {
            loadExplorer();
        }
        else {
            node.expand(false, function() {
                loadExplorer();
            });
        }
    },
    
    /**
     * When the first item of Servers Tree, which is "Media Servers" is clicked,
     * then displays the Media Servers Graph at the center, so the user can discover
     * and pick media servers.
     * @param {Ext.selection.RowModel} treeView
     * @param {Ext.data.Model} node The selected record
     */
    onServerItemClick: function(treeView, node) {
        if (node.get('type') === 'media_servers') {
            var viewportCenter = this.getViewportCenter();
            
            if (viewportCenter.getComponent(0) && viewportCenter.getComponent(0).is('mediaserversgraph')) {
                return;
            }
            
            viewportCenter.removeAll();
            viewportCenter.add({
                xtype: 'mediaserversgraph'
            });
        }
    },
    
    /**
     * Takes the selected node on the left, and build the whole 
     * path that will generate the breadcrumb navigation.
     */
    updateBreadcrumb: function() {
        var path            = [],
            serversTree     = this.getServersTree(),
            explorerToolbar = this.getExplorerToolbar(),
            selectedNode    = serversTree.selModel.getSelection()[0];

        //clear breadcrumb toolbar until reach the tbfill
        while (explorerToolbar.getComponent(0).is('tbfill') !== true) {
            explorerToolbar.remove(explorerToolbar.getComponent(0));
        }
        
        //generate breadcrumb
        while (selectedNode) {
            path.unshift({
                cls: 'breadcrumb',
                text: selectedNode.get('name')
            });
            
            selectedNode = selectedNode.parentNode;
            
            if (selectedNode.isRoot()) {
                break;
            }
            
            if (selectedNode) {
                path.unshift({
                    xtype: 'component',
                    cls: 'breadcrumb-arrow'
                });
            }
        }
        
        explorerToolbar.insert(0, path);
    },
    
    /**
     * Updates the message on the top to 'Please select some files take offline...'
     * when the Media Explorer View is rendered
     */
    onExplorerRender: function() {
        this.getMessagesCt().setText('Please select some files to take offline...');
    },
    
    /**
     * When a file is double clicked, send a message to the parent page
     * so the file is played.
     */
    onFileDblClick: function(explorer, record) {
        var serverPanel, node,
            type    = record.get('type'),
            url     = record.get('url'),
            name    = record.get('name'),
            serverId= record.get('serverId');
            
        if (type === 'audio' || type === 'video') {
            Ext.data.PostMessage.request({
                key     : 'play-media',
                params  : {
                    url: url,
                    name: name,
                    type: type
                }
            });
        }
    },
    
    /**
     * Only allow file selection for taking offline if they are remote and has 
     * not been downloaded yet. Local files, or files already downloaded must not
     * be selected.
     */
    onBeforeSelectFile: function(view, file) {
        if (file.get('downloadStatus') === 'downloaded' || file.get('isRemote') === false) {
            return false;
        }
    },
    
    /**
     * When the file selection change, we need to update the message at the top,
     * and also enable/disable the buttons for taking files offline and cancel.
     */
    onFilesSelectionChange: function(renderView, selections) {
        var msg,
            explorer = renderView.view.up('mediaexplorer');
        
        if (!explorer.isRemote) {
            return;
        }
        
        if (selections.length === 0) {
            msg = 'Please select some files to take offline...';
        }
        else {
            msg = selections.length + ' files selected to offline storage...';
        }
        
        this.getMessagesCt().setText(msg);
        this.getDownloadBtn().setDisabled(selections.length === 0);
        this.getCancelBtn().setDisabled(selections.length === 0);
    },
    
    /**
     * Collects the files selected, and send a message to the parent page so they are 
     * taken offline. When the download process is finished, we need then to update the 
     * Media Explorer list, but also the treepanel on the side.
     */
    downloadSelectedFiles: function() {
        var mediaExplorer = this.getMediaExplorer(),
            serversStore = this.getServersTree().getStore();
        
        if (!mediaExplorer) {
            return;
        }
        
        var downloadFiles = [],
            selections = mediaExplorer.child('dataview').getSelectionModel().getSelection();
        
        Ext.each(selections, function(file) {
            var type = file.get('type');
            
            if ((type !== 'audio' && type !== 'video') || file.get('isRemote') === false) {
                return;
            }
            
            downloadFiles.push({
                type: type,
                url: file.get('url'),
                fileName: file.get('name')
            });
        });
        
        if (downloadFiles.length) {
            Ext.data.PostMessage.request({
                key     : 'download-media',
                params  : {
                    files: downloadFiles
                },
                success: function() {
                    Ext.each(selections, function(file) {
                        var type = file.get('type');

                        if ((type !== 'audio' && type !== 'video') || file.get('isRemote') === false) {
                            return;
                        }
                        
                        file.set('downloadStatus', 'downloaded');
                        file = serversStore.getNodeById(file.getId());
                        
                        if (file) {
                            file.set('downloadStatus', 'downloaded');
                        }
                    });

                    var audioNode = serversStore.getNodeById('/audio'),
                        videoNode = serversStore.getNodeById('/video');
                    
                    if (audioNode.isLoaded()) {
                        serversStore.load({ node: audioNode });
                    }
                  
                    if (videoNode.isLoaded()) {
                        serversStore.load({ node: videoNode });
                    }
                }
            });
        }
    },
    
    /**
     * If the cancel button is pressed, we deselect all files, and also send
     * a message to parent page so it can stop the download process
     */
    onCancelBtnClick: function() {
        this.getMediaExplorer().child('dataview').getSelectionModel().deselectAll();
        
        Ext.data.PostMessage.request({
            key: 'cancel-download'
        });
    }
});
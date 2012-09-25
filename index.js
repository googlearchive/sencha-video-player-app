(function() {

    var filePlaying,
        iframeWindow,
        mediaServers= {};

    /**
     * Create the filer, used to save files locally.
     * Once it's created, try to browse local audio and
     * videos to cache it for further requests
     */
    var localFiles = {
        audio: [],
        video: [],
        idMap: {}
    };

    var filer = new Filer();
    filer.init({ persistent: true, size: 100 * 1024 * 1024 }, function() {
        loadLocalFiles();
    });

    function loadLocalFiles(callback) {

        localFiles = {
            audio: [],
            video: [],
            idMap: {}
        };

        var loaded = 0;

        //browse audio
        filer.ls(
            '/media/audio',
            function(entries) {
                localFiles.audio = processLocalFiles(entries, 'audio');

                loaded++;
                if (callback && loaded === 2) {
                    callback();
                }
            },
            function(err) {
                filer.mkdir('media/audio/', false, function(){});
            }
        );

        //browse video
        filer.ls(
            '/media/video',
            function(entries) {
                localFiles.video = processLocalFiles(entries, 'video');

                loaded++;
                if (callback && loaded === 2) {
                    callback();
                }
            },
            function(err) {
                filer.mkdir('media/video/', false, function(){});
            }
        );
    }

    function processLocalFiles(entries, type){
        var output = [];

        entries.forEach(function(entry) {

            //save entry with full name, and with no extension as well
            localFiles.idMap[entry.name] = 1;
            localFiles.idMap[entry.name.substr(0, entry.name.lastIndexOf('.'))] = 1;

            output.push({
                id      : entry.fullPath,
                url     : entry.toURL(),
                serverId: 'local',
                type    : type,
                name    : entry.name,
                leaf    : true,
                isRemote: false
            });
        });

        return output;
    }

    /**
     * On page load create iframe and associate
     * listeners for the media player
     */
    window.addEventListener('DOMContentLoaded', function() {

        var iframe = document.getElementById('sandbox-frame');

        iframeWindow = iframe.contentWindow;

        //add event to player btns
        document.getElementById('close-player-btn').addEventListener('click', onClosePlayerClick, false);

    }, false);

    /**
     * Player functions
     */
    function onClosePlayerClick() {
        var playerCt = document.getElementById('player-ct'),
            videoEl = playerCt.getElementsByTagName('video')[0],
            audioEl = playerCt.getElementsByTagName('audio')[0];

        audioEl.pause();
        videoEl.pause();
        audioEl.src = "";
        videoEl.src = "";

        filePlaying = null;
        playerCt.style.webkitTransform = "translateY(100%)";
    }

    /**
     * For each post message from the iframe, dispatch to the right action.
     */
    window.addEventListener('message', function(e) {
        var data= e.data,
            key = data.key;

        console.log('[index.js] Post Message received with key ' + key);

        switch (key) {
            case 'extension-baseurl':
                extensionBaseUrl(data);
                break;

            case 'upnp-discover':
                upnpDiscover(data);
                break;

            case 'upnp-browse':
                upnpBrowse(data);
                break;

            case 'play-media':
                playMedia(data);
                break;

            case 'download-media':
                downloadMedia(data);
                break;

            case 'cancel-download':
                cancelDownload(data);
                break;

            default:
                console.log('[index.js] unidentified key for Post Message: "' + key + '"');
        }
    }, false);

    /**
     * Utility method to download files locally
     */
    var DownloadProcess = {
        totalFiles: 0,
        downloadedFiles: 0,
        completedFiles: 0,
        percentage: 0,

        cancel: function() {
            var me = DownloadProcess;
            me.totalFiles = me.downloadedFiles = me.completedFiles = me.percentage =0;
            delete me.percentages;
        },

        run: function(files, callback) {
            var me = DownloadProcess;

            //increment total files to load
            me.totalFiles += files.length;
            me.percentage = 0;
            me.percentages = {};

            //start the progress
            sendMessage({
                key             : 'download-progresss',
                totalFiles      : me.totalFiles,
                downloadedFiles : 0,
                totalPercentage : 0
            });

            //open processes
            files.forEach(function(file) {

                var fileUrl = file.url;

                //create ajax request
                var xhr = new XMLHttpRequest();
                xhr.responseType = "arraybuffer";

                //track progress
                xhr.onprogress = function(e) {
                    var increment       = 0,
                        filePercentage  = (e.loaded / e.totalSize) * 100;

                    //calculate how much increase from last lookup
                    if (!me.percentages[fileUrl]) {
                        me.percentages[fileUrl] = filePercentage;
                        increment = filePercentage;
                    }
                    else {
                        increment = Math.abs(filePercentage - me.percentages[fileUrl]);
                        me.percentages[fileUrl] = filePercentage;
                    }

                    //divide by total
                    me.percentage += (increment/me.totalFiles);

                    sendMessage({
                        key             : 'download-progresss',
                        totalFiles      : me.totalFiles,
                        downloadedFiles : me.downloadedFiles,
                        totalPercentage : me.percentage
                    });
                };

                //track complete status
                xhr.onload = function() {

                    console.log('File ' + fileUrl + ' status ' + this.status);

                    //file downloaded, save locally
                    if (this.status === 200) {
                        var fileArrayBuf= xhr.response,
                            extension   = Util.getFileExtension(file.fileName) ? '' : Util.getFileExtension(fileUrl),
                            saveUrl     = '/media/' + file.type + '/' + file.fileName + extension,
                            contentType = xhr.getResponseHeader('Content-Type');

                        //increment downloaded and inform progress
                        me.downloadedFiles++;
                        sendMessage({
                            key             : 'download-progresss',
                            totalFiles      : me.totalFiles,
                            downloadedFiles : me.downloadedFiles
                        });

                        console.log('saving file to ' + saveUrl);

                        filer.write(
                            saveUrl,
                            {
                                data: Util.arrayBufferToBlob(fileArrayBuf),
                                type: contentType
                            },
                            function(fileEntry, fileWriter) {

                                console.log('file saved!');

                                //increment downloaded
                                me.completedFiles++;

                                //if reached the end, finalize the process
                                if (me.completedFiles === me.totalFiles) {

                                    sendMessage({
                                        key             : 'download-progresss',
                                        totalFiles      : me.totalFiles,
                                        completedFiles  : me.completedFiles
                                    });

                                    me.completedFiles = me.totalFiles = me.percentage = me.downloadedFiles = 0;
                                    delete me.percentages;

                                    //reload local
                                    loadLocalFiles(callback);
                                }
                            },
                            function(e) {
                                console.log(e);
                            }
                        );
                    }
                };

                //send request
                xhr.open("GET", fileUrl);
                xhr.send();
            });
        }
    };

    /**
     * Post Message Actions
     */
    function sendMessage(data) {
        iframeWindow.postMessage(data, '*');
    }

    function extensionBaseUrl(data) {
        //data.result = chrome.extension.getURL('/');
        data.result = '/';
        sendMessage(data);
    }

    function upnpDiscover(data) {
        UPNPDiscover(function(upnpServers) {
            var count   = 0,
                result= [],
                length  = upnpServers.length;

            upnpServers.forEach(function(server) {

                new UPNPServer(server, function(s) {
                    s.device = s.device||{};

                    if (!s.URLBase_) {
                        //extract domain from parameters
                        s.URLBase_ = server.match(/(http|https):\/\/(www\.)?(.[^/]+)/)[0];
                    }

                    var serverId = s.device.UDN||s.URLBase_;

                    //save server locally
                    mediaServers[serverId] = s;

                    //format data
                    var i,
                        device = s.device,
                        serverData = {
                            id: serverId,
                            urlBase: s.URLBase_
                        };

                    for (i in device) {
                        serverData[i] = device[i];
                    }

                    //push it to result
                    result.push(serverData);
                    count++;

                    if(count === length) {
                        data.result = result;
                        sendMessage(data);
                    }

                }, function(errorType) {
                    data.errorType = errorType;
                    sendMessage(data);
                });
            });
        });
    }

    function upnpBrowse(data) {
        var serverId, server, nodeId,
            node = data.params.node;

        if (node.type === 'server') {
            serverId = node.id;
            nodeId = 0;
        }
        else {
            serverId = node.serverId;
            nodeId = node.id;
        }

        //get server from local object
        server = mediaServers[serverId];

        //if it's local, change flow
        if (nodeId === '/audio') {
            data.result = localFiles.audio;
            sendMessage(data);
            return;
        }
        else if (nodeId === '/video') {
            data.result = localFiles.video;
            sendMessage(data);
            return;
        }

        //if does not exists, exception!
        if (!server) {
            throw 'Server not found';
        }

        //browse it
        server.browse(nodeId, 0, 100, function(items){

            var output = [];

            items.forEach(function(item) {
                if (item.isContainer()) {
                    output.push({
                        id      : item.id,
                        serverId: serverId,
                        type    : 'container',
                        name    : item.title,
                        isRemote: true
                    });
                }
                else {
                    var type,
                        cls = item['class']||'';

                    if (/videoItem/.test(cls)) {
                        type = 'video';
                    }
                    else if (/musicTrack/.test(cls)) {
                        type = 'audio';
                    }
                    else if (/imageItem/.test(cls)) {
                        type = 'image';
                    }

                    output.push({
                        id              : item.id,
                        url             : item.res.URL,
                        serverId        : serverId,
                        type            : type,
                        name            : item.title,
                        leaf            : true,
                        isRemote        : true,
                        downloadStatus  : localFiles.idMap[item.title] ? 'downloaded' : '',
                        metaData        : {
                            album       : item.album,
                            artwork     : item.albumArtURI,
                            artist      : item.artist,
                            description : item.description,
                            genre       : item.genre,
                            bitrate     : item.res.bitrate,
                            duration    : item.res.duration,
                            size        : item.res.size
                        }
                    });
                }
            });

            data.result = output;
            sendMessage(data);
        });
    }

    function playMedia(data) {
        var type        = data.params.type,
            url         = data.params.url,
            playerCt    = document.getElementById('player-ct'),
            audioBody   = document.getElementById('audio-body'),
            videoBody   = document.getElementById('video-body'),
            mediaEl     = playerCt.getElementsByTagName(type)[0],
            mediaBody   = type === 'video' ? videoBody : audioBody,
            isLocal     = false;

        //save data
        filePlaying = {
            url : url,
            type: type,
            name: data.params.name
        };

        //hide body els
        audioBody.style.display = 'none';
        videoBody.style.display = 'none';

        var animEnd = function(e) {

            //show body el
            mediaBody.style.display = '';

            //play media
            mediaEl.play();

            //clear listeners
            playerCt.removeEventListener( 'webkitTransitionEnd', animEnd, false );
            animEnd = null;
        };

        //load media
        mediaEl.src = url;
        mediaEl.load();

        //animate in player
        playerCt.addEventListener( 'webkitTransitionEnd', animEnd, false );
        playerCt.style.webkitTransform = "translateY(0)";

        //reply postmessage
        data.result = true;
        sendMessage(data);
    }

    function downloadMedia(data) {
        DownloadProcess.run(data.params.files, function() {
            data.result = true;
            sendMessage(data);
        });
    }

    function cancelDownload(data) {
        DownloadProcess.cancel();
        data.result = true;
        sendMessage(data);
    }

}());
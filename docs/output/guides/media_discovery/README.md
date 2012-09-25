# Media Discovery

## 1. Requirements

### 1.1 UPNP compliant media server

We recommend using MediaTomb UPnP Server for this example, as it has most complete feature set.

### 1.2. UPNP Javascript library and enabled sockets support

First we should tell application inside manifest.json file, that we would like to have access to socket features. This can be done by adding following lines inside permissions property.
In this example we add socket support after unlimitedStorage as an object, as it contains extra parameters:

    "permissions": [
            "experimental",
            "http://*/*",
            "unlimitedStorage",
            {
                "socket": [
                    "tcp-connect",
                    "udp-send-to",
                    "udp-bind"
                ]
            }
        ]

UPNP library itself is located inside lib folder and called 'Upnp' and works in tandem with 'soapclient'. Both files are included as part of index.html

## 2. Discover available Media servers

For this functionality we have two controllers inside ExtJs application namely, MediaExplorer and MediaServers.

MediaServers is responsible for managing visual part and base interaction with the views, whereas MediaExplorer have all data related methods. When click is detected on the button in the center, it calls method discoverServers(), where main logic is processed. First, it will check wherever there are any outstanding discovery requests, and if true, it wil abort them, so the new request can be initiated. Next, a request is sent to parent frame with a key upnp-discovery, and two callback listeners added inside:

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
                // modify according to your local running machine/network

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


                bodyCt.add(items); // add array items at once
                serversGraph.fanOut(); // do animation
            },
            failure: function() {
                delete me.activeDiscoverRequest;

                if (serversGraph.isDestroyed) {
                    return;
                }

                //update visual representation of view in the case of failure
            }
        });

In the parent frame we have listeners set up for messages and for this key function upnpDiscover() will be called. For detailed implementation please see Upnp.js file.
// vim: et sts=2 ts=2 :
(function(exports) {

  const CONNECTION_MANAGER = "urn:schemas-upnp-org:service:ConnectionManager:1";
  const CONTENT_DIRECTORY = "urn:schemas-upnp-org:service:ContentDirectory:1";

  function UPNPServer(url, callback, errorCallback) {
    var self = this;
    this.device = null;

    init(callback, errorCallback);
    function init(callback, errorCallback) {
      $.ajax({
          type      : 'GET',
          url       : url,
          success   : function(xml) {
                var $xml = $(xml);
                self.URLBase_ = $xml.find("URLBase").text();
                // Parses the device.
                var $device = $xml.find("device").first();
                if ($device.length != 1) {
                  callback(null);
                  return;
                }

                function Device($device) {
                  var self = this;
                  this.deviceType = $device.find("deviceType").text();
                  this.presentationURL = $device.find("presentationURL").text();
                  this.friendlyName = $device.find("friendlyName").text();
                  this.manufacturer = $device.find("manufacturer").text();
                  this.manufacturerURL = $device.find("manufacturerURL").text();
                  this.modelDescription = $device.find("modelDescription").text();
                  this.modelName = $device.find("modelName").text();
                  this.modelNumber = $device.find("modelNumber").text();
                  this.serialNumber = $device.find("serialNumber").text();
                  this.UDN = $device.find("UDN").text();
                  this.UDN = $device.find("UDN").text();
                  this.icons = [];
                  this.services = {};

                  // Parses icons.
                  $device.find("icon").each(function() {
                    var $this = $(this);
                    var icon = {
                        mimetype: $this.find("mimetype").text(),
                        width: Number($this.find("width").text()),
                        height: Number($this.find("height").text()),
                        depth: Number($this.find("depth").text()),
                        url: $(this).find("url").text()
                    };
                    self.icons.push(icon);
                  });

                  // Parses services.
                  $device.find("ServiceList service").each(function() {
                    var $this = $(this);
                    var service = {
                        serviceType: $this.find("serviceType").text(),
                        serviceId: $this.find("serviceId").text(),
                        scpdURL: $this.find("SCPDURL").text(),
                        controlURL: $this.find("controlURL").text(),
                        eventSubURL: $this.find("eventSubURL").text()
                    };
                    self.services[service.serviceType] = service;
                  });

                }

                self.device = new Device($device);
                callback(self);
            },
            error: function(request) {
                errorCallback(request.status);
            }
        });
    }
  }

  UPNPServer.prototype.makeURL = function(path) {
    return this.URLBase_ + path.substring(1);
  };

  UPNPServer.prototype.getIcon = function(width, height, mimetypes) {
    var url = "";
    if (this.device != null) {
      var $icons = $(this.device.icons);
      $icons = $icons.filter(function(){
        if ($.inArray(this.mimetype, mimetypes) < 0)
          return false;
        if (width > 0 && this.width > width)
          return false;
        if (height > 0 && this.height > height)
          return false;
        return true;
      });

      var best = null;
      $icons.each(function(){
        if (best != null) {
          if (width <= height) {
            if (this.width > best.width)
              best = this;
          } else {
            if (this.height > best.height)
              best = this;
          }
        } else {
          best = this;
        }
      });
      url = this.makeURL(best.url);
    }
    return url;
  };

  UPNPServer.prototype.browse = function(id, start, count, callback) {
    if (this.device == null) {
      callback(null);
      return false;
    }

    var service = this.device.services[CONTENT_DIRECTORY];
    if (service == null) {
      callback(null);
      return false;
    }

    var url = this.makeURL(service.controlURL);
    var params = new SOAPClientParameters();
    params.add("ObjectID", id);
    params.add("BrowseFlag", "BrowseDirectChildren");
    params.add("Filter", "*");
    params.add("StartingIndex", start);
    params.add("RequestedCount", count);
    params.add("SortCriteria", "");

    SOAPClient._sendSoapRequestInternal(url, CONTENT_DIRECTORY, "Browse",
        params, true, function(o, xml){
      var $xml = $(xml);
      console.log($xml.find("UpdateID").text());
      var $result = $($.parseXML($xml.find("Result").text()));
      var items = [];
      $result.find("DIDL-Lite").first().children().each(function(){
        function Item($item){
          var item = $item[0];
          this.class = $item.find("class").text();
          this.title = $item.find("title").text();
          this.id = Number(item.getAttribute("id"));
          this.parentID = Number(item.getAttribute("parentID"));
          this.restricted = Boolean(item.getAttribute("restricted"));
          this.childCount = Number(item.getAttribute("childCount"));
          // console.log($item);

          if (!this.isContainer()) {
            this.artist = $item.find("artist").text();
            this.album = $item.find("album").text();
            this.date = $item.find("date").text();
            this.genre = $item.find("genre").text();
            this.description = $item.find("description").text();
            this.originalTrackNumber = Number($item.find("originalTrackNumber").text());
            this.albumArtURI = $item.find("albumArtURI").text();

            function Res($res) {
              var res = $res[0];
              this.URL = $res.text();
              this.protocolInfo = res.getAttribute("protocolInfo");
              this.size = Number(res.getAttribute("size"));
              this.duration = res.getAttribute("duration");
              this.bitrate = Number(res.getAttribute("bitrate"));
              this.resolution = res.getAttribute("resulation");
              this.sampleFrequency = Number(res.getAttribute("sampleFrequency"));
              this.nrAudioChannels = Number(res.getAttribute("nrAudioChannels"));
            }
            this.res = new Res($item.find("res").first());
          }
        }

        Item.prototype.isContainer = function() {
          return this.class.substring(0, 16) === "object.container";
        };

        items.push(new Item($(this)));
      });

      callback(items);

    }, null);
    return true;
  };
  
  
    /**  
     * Upnp Discover routine adapted by
     * Sencha
     */

    String.toBuffer = function( str ) {
        var idx, len = str.length, arr = new Array( len );
        for ( idx = 0 ; idx < len ; ++idx ) {
            arr[ idx ] = str.charCodeAt(idx) & 0xFF;
        }
        // You may create an ArrayBuffer from a standard array (of values) as follows:
        return new Uint8Array( arr ).buffer;
    };
    
    String.fromBuffer = function(buf) {
        var view    = new Uint8Array( buf ),
            str     = String.fromCharCode.apply(String, view);

        return str;
    }; 
     
    function UPNPDiscover(callback) {
       // var socket = top.chrome.experimental.socket,
        var socket = top.chrome.socket,
            UPNP_ADDRESS = '239.255.255.250',
            UPNP_PORT = 1900,
            UPNP_MESSAGE = [
                'M-SEARCH * HTTP/1.1',
                'MX: 5',
                'ST: upnp:rootdevice',
                'MAN: "ssdp:discover"',
                'User-Agent: Platinum/0.5.3.0, DLNADOC/1.50',
                'Host: 239.255.255.250:1900',
                '\r\n'
            ].join('\r\n');
        
        //create socket
        socket.create("udp", {}, function(info) {
            var socketId = info.socketId;
        
            //bind locally
            socket.bind(socketId, "0.0.0.0", 0, function(info) {
            
                //pack upnp message
                var message = String.toBuffer(UPNP_MESSAGE);
            
                //broadcast to upnp
                socket.sendTo(socketId, message, UPNP_ADDRESS, UPNP_PORT, function(info) {
                
                    // Wait 1 second
                    setTimeout(function() {
                    
                        //receive
                        socket.recvFrom(socketId, function(info) {

                            //unpack message
                            var data        = String.fromBuffer(info.data),
                                servers     = [],
                                locationReg = /^location:/i;
                            
                            //extract location info
                            if (data) {
                                data = data.split("\r\n");
                            
                                data.forEach(function(value) {
                                    if (locationReg.test(value)){
                                        servers.push(value.replace(locationReg, "").trim());
                                    }
                                });
                            }
                            
                            //success
                            callback(servers);
                        });
                    
                    }, 1000);
                });
            });
        });  
    } //eo UpnpDiscover
    
    
    
  exports.UPNPServer = UPNPServer;
  exports.UPNPDiscover = UPNPDiscover;

})(window);

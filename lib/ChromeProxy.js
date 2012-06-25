"use strict";

var ChromeProxy = (function(){
    var me, receiver,
        initialized = false,
        queue = {},
        idSeed = 1,
        emptyFn = function(){};
        
    var onMessage = function(e) {
        ChromeProxy.init();
        
        var message     = e.data,
            type        = message.type,
            messageId   = message.messageId;
            
        if (type === 'REQUEST') {
            
            var params  = message.params,
                uri     = message.uri,
                route   = me.routes[uri];
            
            if (route) {
                params.push(function(result) {
                    receiver.postMessage({
                        type        : 'REPLY',
                        messageId   : messageId,
                        result      : result
                    }, '*');
                });
                
                route.apply(window, params);
            }
        }
        else if(type === 'REPLY') {
            
            var callback = queue[messageId];
            
            if (callback) {
                callback.fn.call(callback.scope||me, message.result);
                delete queue[message];
            }
        }
    }; 

    addEventListener('message', onMessage);
    
    return {
        routes: {},
        
        init: function() {
            if (initialized) {
                return;
            }
            
            initialized = true;
            me = this;
            receiver = window.top !== window ? window.top :
                document.getElementsByTagName('iframe')[0].contentWindow;
        },
        
        request: function(uri, params, callback, scope) {
            this.init();
            var messageId = idSeed++;
            
            if (!Array.isArray(params)) {
                scope = callback;
                callback = params;
                params = [];
            }
            
            //add request to queue
            queue[messageId] = {
                fn: callback,
                scope: scope
            };

            //post
            receiver.postMessage({
                type        : 'REQUEST',
                messageId   : messageId,
                uri         : uri,
                params      : params
            }, '*');
        }
    };
}());
/**
 * @author Bruno Tavares
 * @class Ext.data.PostMessage
 * @singleton
 *
 * This class is used to create Post Messages requests. Post Message is a new HTML5 API that allows two different 
 * windows/frames to communicate with each other.
 */
Ext.define('Ext.data.PostMessage', {
    singleton: true,
    
    statics: {
        requestCount: 0,
        activeRequests: 0,
        requests: {}
    },

    /**
     * @property {String} receiver
     * Reference to the other page that will receive the messages. Default to window.top.
     */
    receiver: null,
    
    /**
     * @property {String} domain
     * According to window.postMessage API, you can restrict which domain's message to
     * listen for. Default value is '*', any domain.
     */
    domain: '*',
    
    /**
     * @property timeout
     * @type Number
     * A default timeout for any JsonP requests. If the request has not completed in this time the
     * failure callback will be fired. The timeout is in ms. Defaults to <tt>30000</tt>.
     */
    timeout: 30000,

    /**
     * Makes a Post Message request.
     * @param {Object} options An object which may contain the following properties. Note that options will
     * take priority over any defaults that are specified in the class.
     * <ul>
     * <li><b>key</b> : String <div class="sub-desc">Different pages can send multiple messages to each other. 
     * Each message posted will be signed with this key, so the other page is able to execute the proper callback.</div></li>
     * <li><b>params</b> : Object (Optional)<div class="sub-desc">An object containing a series of
     * key value pairs that will be sent along with the request.</div></li>
     * <li><b>timeout</b> : Number (Optional) <div class="sub-desc">See {@link #timeout}</div></li>
     * <li><b>receiver</b> : DOMWindow (Optional) <div class="sub-desc">Reference to the other page that will receive the messages. Default to window.top.</div></li>     
     * <li><b>success</b> : Function (Optional) <div class="sub-desc">A function to execute if the request succeeds.</div></li>
     * <li><b>failure</b> : Function (Optional) <div class="sub-desc">A function to execute if the request fails.</div></li>
     * <li><b>callback</b> : Function (Optional) <div class="sub-desc">A function to execute when the request
     * completes, whether it is a success or failure.</div></li>
     * <li><b>scope</b> : Object (Optional)<div class="sub-desc">The scope in
     * which to execute the callbacks: The "this" object for the callback function. Defaults to the browser window.</div></li>
     * </ul>
     * @return {Object} request An object containing the request details.
     */
    request: function(options) {
        options = Ext.apply({}, options);

        var request, message,
            me      = this,
            id      = ++me.statics().requestCount,
            key     = options.key,
            timeout = Ext.isDefined(options.timeout) ? options.timeout : me.timeout,
            params  = Ext.apply({}, options.params),
            domain  = options.domain||me.domain,
            receiver= options.receiver||me.receiver||window.top;
        
        //<debug>
        if (!key) {
            Ext.Error.raise('A key must be specified for a Post Message request.');
        }
        //</debug>
        
        me.statics().requests[id] = request = {
            key         : key,
            domain      : domain,
            receiver    : receiver,
            params      : params,
            id          : id,
            scope       : options.scope,
            success     : options.success,
            failure     : options.failure,
            callback    : options.callback
        };

        if (timeout > 0) {
            request.timeout = setTimeout(Ext.bind(me.handleTimeout, me, [request]), timeout);
        }

        me.monitorMessage(request);
        me.postMessage(request);
        
        return request;
    },
    
    /**
     * Abort a request. If the request parameter is not specified all open requests will
     * be aborted.
     * @param {Object/String} request (Optional) The request to abort
     */
    abort: function(request) {
        var me = this,
            requests = me.statics().requests,
            key;

        if (request) {
            if (!request.id) {
                request = requests[request];
            }
            me.handleAbort(request);
        } else {
            for (key in requests) {
                if (requests.hasOwnProperty(key)) {
                    me.abort(requests[key]);
                }
            }
        }
    },

    /**
     * Handles any aborts when loading the script
     * @private
     * @param {Object} request The request
     */
    handleAbort: function(request) {
        request.errorType = 'abort';
        this.handleResponse(null, request);
    },

    /**
     * Handles any script errors when loading the script
     * @private
     * @param {Object} request The request
     */
    handleError: function(request, error) {
        request.errorType = 'error';
        request.error = error;
        this.handleResponse(null, request);
    },

    /**
     * Handle any script timeouts
     * @private
     * @param {Object} request The request
     */
    handleTimeout: function(request) {
        request.errorType = 'timeout';
        this.handleResponse(null, request);
    },

    /**
     * Handle a successful response
     * @private
     * @param {Object} result The result from the request
     * @param {Object} request The request
     */
    handleResponse: function(result, request) {
        var me      = this,
            success = true;
            
        //handle timeout
        if (request.timeout) {
            clearTimeout(request.timeout);
        }
        
        //clear request
        delete me.statics().requests[request.id];
        --me.statics().activeRequests;
                
        if (me.statics().activeRequests === 0) {
            me.destroyMessageListener();
        }
        
        //execute callbacks
        if (request.errorType) {
            success = false;
            Ext.callback(request.failure, request.scope, [request.errorType]);
        } else {
            Ext.callback(request.success, request.scope, [result]);
        }
        Ext.callback(request.callback, request.scope, [success, result, request.errorType]);
    },
    
    /**
     * Creates a message with key and params and post to the receiber page.
     * @private
     * @param request The request object.
     */
    postMessage: function (request) {
        var message = {
            key     : request.key,
            params  : request.params
        };

        try {
            request.receiver.postMessage(message, request.domain);
        } catch(e) {
            this.handleError(request, e);
        }
    },
    
    /**
     * @private
     * Increments the active requests number and set the 'message' listener
     * for any post messages
     */
    monitorMessage: function(request, operation, callback, scope) {
        var me = this;
        
        ++me.statics().activeRequests;
        
        if (!me.listening) {
            me.listening = true;
            Ext.EventManager.on(window, 'message',  me.onMessage, me);
        }
    },

    /**
     * @private
     * Listens for any post messages, trying to find a match 
     * with previous requests.
     */    
    onMessage: function(e) {
        var requests,
            me  = this,
            data= e.browserEvent.data,
            key = data.key;

        if (!key) {
            return;
        }    

        requests = me.statics().requests;
        
        Ext.iterate(requests, function(i, request) {
            if (request.key === key) {
                
                if (data.errorType) {
                    request.errorType = data.errorType;
                }
                
                me.handleResponse(data.result, request);
                return false;
            }
        });
    },
    
    /**
     * @private
     */
    destroyMessageListener: function() {
        var me = this;
        
        if (me.listening) {
            delete me.listening;
            Ext.EventManager.un(window, 'message',  me.onMessage, me);
        }
    }
});
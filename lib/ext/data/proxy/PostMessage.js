/**
 * @author Bruno Tavares
 *
 * PostMessageProxy makes use of the new HTML5 postMessage API. It allows two different windows/frames to communicate
 * between each other.
 *
 */
Ext.define('Ext.data.proxy.PostMessage', {
    extend: 'Ext.data.proxy.Server',
    alias: 'proxy.postmessage',
    requires: ['Ext.data.PostMessage'],
    
    defaultWriterType: 'base',
    
    config: {
        
        /**
         * @cfg {String} receiver
         * Reference to the other page that will receive the messages. Default to window.top.
         */
        receiver: null,
        
        /**
         * @cfg {String} key
         * Different pages can send multiple messages to each other. Each message posted 
         * will be signed with this key, so the other page is able to execute the proper callback.
         */
        key: '',
        
        /**
         * @cfg {String} domain
         * According to window.postMessage API, you can restrict which domain's message to
         * listen for. Default value is '*', any domain.
         */
        domain: '*',
        
        /**
         * @cfg {String} dataFormat
         * A function to transform the raw data before it goes to the Store. Usefull when the data
         * requested is from other domain that you don't have control over.
         */        
        dataFormat: null
    },
    
    // inherit docs
    constructor: function(config) {
        this.initConfig(config);
        this.callParent(arguments);
    },
    
    // inherit docs
    doRequest: function(operation, callback, scope) {
        //generate the unique IDs for this request
        var me      = this,
            writer  = me.getWriter(),
            request = me.buildRequest(operation),
            params = request.params;

        if (operation.allowWrite()) {
            request = writer.write(request);
        }

        // apply PostMessage proxy-specific attributes to the Request
        Ext.apply(request, {
            receiver: me.getReceiver()||window.top,
            key: me.getKey(),
            domain: me.getDomain(),
            timeout: me.timeout,
            scope: me,
            callback: me.createRequestCallback(request, operation, callback, scope)
        });

        // prevent doubling up
        if (me.autoAppendParams) {
            request.params = {};
        }

        request.postmessage = Ext.data.PostMessage.request(request);
        // restore on the request
        request.params = params;
        operation.setStarted();
        me.lastRequest = request;

        return request;
    },
    
    
    /**
     * @private
     * Creates and returns the function that is called when the request has completed. The returned function
     * should accept a Response object, which contains the response to be read by the configured Reader.
     * The third argument is the callback that should be called after the request has been completed and the Reader has decoded
     * the response. This callback will typically be the callback passed by a store, e.g. in proxy.read(operation, theCallback, scope)
     * theCallback refers to the callback argument received by this function.
     * See {@link #doRequest} for details.
     * @param {Ext.data.Request} request The Request object
     * @param {Ext.data.Operation} operation The Operation being executed
     * @param {Function} callback The callback function to be called when the request completes. This is usually the callback
     * passed to doRequest
     * @param {Object} scope The scope in which to execute the callback function
     * @return {Function} The callback function
     */
    createRequestCallback: function(request, operation, callback, scope) {
        var me = this;

        return function(success, response, errorType) {
            delete me.lastRequest;
            me.processResponse(success, operation, request, response, callback, scope);
        };
    },    

    // inherit docs
    setException: function(operation, response) {
        operation.setException(operation.request.postmessage.errorType);
    },    

    // inherit docs
    buildUrl: function() {
        return this.getKey();
    },
    
    //inherit docs
    destroy: function() {
        this.abort();
        this.callParent(arguments);
    },
    
    /**
     * Aborts the current server request if one is currently running
     */
    abort: function() {
        var lastRequest = this.lastRequest;
        if (lastRequest) {
            Ext.data.PostMessage.abort(lastRequest.postmessage);
        }
    },        
    
    // inherit docs
    extractResponseData: function(response) {
        var me          = this,
            dataFormat  = me.getDataFormat();
        
        if (dataFormat) {
            response = dataFormat.call(me, response);
        }
        
        return me.callParent(arguments);
    }
});
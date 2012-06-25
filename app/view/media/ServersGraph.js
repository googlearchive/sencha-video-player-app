/**
 * Displays the servers in an animated graph UI, so the user can discover servers
 * and also select one for browsing.
 */
Ext.define('VP.view.media.ServersGraph',{
    extend: 'Ext.Container',
    xtype: 'mediaserversgraph',
    cls: 'vp-mediaserversgraph',
    autoScroll: true,
    items: {
        xtype: 'container',
        itemId: 'body',
        cls: 'container-body',
        defaultType: 'button',
        items: [{
            cls: 'main-button',
            itemId: 'main-button',
            iconCls: 'ico-loading',
            text: 'Discovering Servers...'
        }]
    },
    
    /**
     * This method takes each server item and applies the fan-out animation
     */
    fanOut:  function() {
        this.getComponent('body').items.each(this.fanOutItem, this);
    },
    
    //@private
    fanOutItem: function(item, index, len) {
        var angle, rad, sin, cos, x, y, style, difCenter,
            arc             = 180,
            distance        = 260;
        
        //ignore main button
        if (index === 0) {
            return;
        }
        index--;
        len--;
        
        //calculate angle using items count
        if (len === 1) {
            angle = 0;
        }
        else {
            angle = (arc/(len-1)) * index;
        }
        
        //transform angle to rad
        rad = angle * Math.PI/180;
        
        //calculate cos and sin
        cos = Math.cos(rad);
        sin = Math.sin(rad);
        
        //find x,y using distance
        x = Math.ceil(distance * cos);
        y = Math.ceil(distance * sin * -1);

        //move x,y to the center, considering that mainbutton with 136px and small buttons 72px
        difCenter = (136/2) - (72/2);
        x += difCenter;
        y += difCenter;
        
        style = {
            '-webkit-transition-delay': (30 * index) + 'ms',
            '-webkit-transform': 'translate3d('+x+'px, '+y+'px, 0)'
        };
        
        if (!item.rendered) {
            item.style = style;
        }
        else {
            item.el.applyStyles(style);
        }
    } 
});
Ext.define('PathMenu',{
    extend: 'Ext.Container',
    xtype: 'pathmenu',
    config: {
        defaultType: 'button',
        baseCls: Ext.baseCSSPrefix + 'pathmenu',
        bottom: 10,
        left: 10,
        defaults: {
            baseCls: Ext.baseCSSPrefix + 'path-item',
            showAnimation: 'pathmenu',
            hidden: true
        }
    },
    
    initialize: function() {
        var btn,
            me = this;
        
        btn = Ext.create('Ext.Button', {
            baseCls: Ext.baseCSSPrefix + 'path-btn',
            text: '+',
            scope: me,
            handler: me.onMainBtnTap,
            left: 4,
            bottom: 4
        });
        
        me.insert(0, btn);
        me.on('painted', me.showItems, me, {single: true});
        me.callParent(arguments);
    },
    
    onMainBtnTap: function(btn) {
        var pressedCls = Ext.baseCSSPrefix + 'button-pressed';

        if (btn.pressed) {
            btn.pressed = false;
            btn.removeCls(pressedCls);
        }
        else {
            btn.pressed = true;
            btn.addCls(pressedCls);
        }
    },
    
    showItems: function() {
        var items = this.getInnerItems();
        
        Ext.each(items, function(item) {
            item.show();            
        });
    }
    
});

Ext.define('Ext.fx.animation.PathMenu', {
    extend: 'Ext.fx.animation.Abstract',
    alias: 'animation.pathmenu',

    config: {
        
        
        arc: 90,
        distance: 100,
        
        /**
         * @cfg {Boolean} out True if you want to make this animation pop out, instead of pop in.
         * @accessor
         */
        out: false,
        duration: 2000,
        before: {
            display: null
        },
        after: {
            opacity: null
        }
    },

    getData: function() {
        var angle, rad, sin, cos, x, y,
            me              = this,
            to              = me.getTo(),
            from            = me.getFrom(),
            out             = me.getOut(),
            after           = me.getAfter(),
            el              = me.getElement().dom,
            arc             = me.getArc(),
            distance        = me.getDistance(),
            els             = Array.prototype.slice.call(el.parentNode.childNodes),
            len             = els.length -1,
            index           = Ext.Array.indexOf(els, el) - 1,
            disappearDelay  = 50;
        
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
        
        console.log('index=%d | angle=%dº or %drad | [x,y]=[%d,%d]', index, angle, rad, x, y);
        
        if (out) {
            from.set('opacity', 1);
            from.setTransform({
                scale: 1
            });

            to.set('opacity', 0);
            to.setTransform({
                scale: 0
            });
        }
        else {
            from.setTransform({
                translateX: 0,
                translateY: 0
            });

            to.setTransform({
                translateX: x,
                translateY: y
            });
            
            after.setTransform({
                translateX: x,
                translateY: y
            });
        }

        return this.callParent(arguments);
    }
});
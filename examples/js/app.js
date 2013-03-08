var app = {

    loggedIn                        : false,

    /**
     * Initializes app
     */
    init : function(){

        var self                    = this;

        $('#start-turbine-button').click(function(){

            /* Load workflow queries based on option selected in page */
            var querySet                        = $('input[name=loginBefore]:checked').val();
            turbineInit.workflow.queries        = queries[querySet];

            window.turbine                      = new Turbine(turbineInit);

            self.bindUIHandlers();
            self.addTurbineListeners();

            $('#workflow-options').slideUp(function(){
                $('#example').slideDown(function(){
                    turbine.api.start();
                });
            });
        });
    },

    /**
     * Binds handlers to UI elements
     */
    bindUIHandlers : function(){

        $('.add-to-cart').click(function(){

            var guid                = ('' + Math.random() + new Date().getTime()).substr(10);
            var itemType            = $(this).attr('data-item');

            cart.add(itemType, guid);

            $(turbine).trigger('Cart|item|added');
        });

        $('#login-button').click(function(){
            app.logIn();
        });

        $('#logout-button').click(function(){
            app.logOut();
        });

        $('#checkout-button').click(function(){

            $(this).addClass('disabled').html('Processing ...');

            turbine.setResponse('isCheckoutStarted',true);

            $(turbine).trigger('Cart|checkout|started');
        });
    },

    /**
     * Adds listeners for messages published by Turbine
     */
    addTurbineListeners : function(){

        $(turbine).bind('TurbineExample|issue|detected',function(event,payload){

            if (payload.content){
                $('#checkout-alert .msg').html(content[payload.content]);
            }

            if (payload.emptyCart === true){
                cart.emptyCart();
            }

            $('#checkout-alert').show().delay(3000).fadeOut('fast');
        });

        $(turbine).bind('TurbineExample|checkout|complete',function(event,payload){

            if (payload.content){
                $('#checkout-success .msg').html(content[payload.content]);
            }

            $('#checkout-button').removeClass('disabled').html('Checkout');
            $('#checkout-success').show().delay(3000).fadeOut('fast');

            cart.emptyCart()
        });

        $(turbine).bind('TurbineExample|specialOffer|granted',function(event,payload){

            if (payload.content){
                $('#checkout-info .msg').html(content[payload.content]);
            }

            if (payload.discount){
                cart.applyDiscount('nba2k',payload.discount);
            }

            turbine.setResponse('gotSpecialOffer',true);

            $('#checkout-info').show().delay(3000).fadeOut('fast');
        });

        $(turbine).bind('TurbineExample|item|missing',function(event,payload){

            if (payload.content){
                $('#checkout-info .msg').html(content[payload.content]);
            }

            $('#checkout-info').show().delay(3000).fadeOut('fast');
        });
    },

    /**
     * Simulates log in
     */
    logIn : function(){

        this.loggedIn              = true;

        $('#login-button').hide();
        $('#logout-button').show();
    },

    /**
     * Simulates log out
     */
    logOut : function(){

        this.loggedIn              = false;

        $('#login-button').show();
        $('#logout-button').hide();
    },

    /**
     * Checks whether user is logged in
     *
     * @return {Boolean}
     */
    isLoggedIn : function(){
        return this.loggedIn === true;
    }
};
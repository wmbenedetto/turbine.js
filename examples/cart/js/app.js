var app = {

    loggedIn                        : false,

    /**
     * Initializes app
     */
    init : function(){

        var self                    = this;

        $('#start-turbine-button').click(function(){

            $('#signup-login').show();

            /* Load workflow based on option selected in page */
            var querySet                        = $('input[name=loginBefore]:checked').val();
            cartInit.workflow                   = workflows[querySet];

            window.cartTurbine                  = new Turbine(cartInit);

            self.bindCartUIHandlers();
            self.addCartTurbineListeners();

            $('#workflow-options').slideUp(function(){
                $('#example').slideDown(function(){
                    cartTurbine.start();
                });
            });
        });
    },

    /**
     * Binds handlers to UI elements
     */
    bindCartUIHandlers : function(){

        $('.add-to-cart').click(function(){

            var guid                = ('' + Math.random() + new Date().getTime()).substr(10);
            var itemType            = $(this).attr('data-item');

            cart.add(itemType, guid);

            $(cartTurbine).trigger('Cart|item|added');
        });

        $('#login-button').click(function(){
            app.logIn();
        });

        $('#logout-button').click(function(){
            app.logOut();
        });

        $('#signup-button').click(function(){
            app.showSignup();
        });

        $('#checkout-button').click(function(){

            $(this).addClass('disabled').html('Processing ...');

            cartTurbine.setResponse('isCheckoutStarted',true);

            $(cartTurbine).trigger('Cart|checkout|started');
        });
    },

    /**
     * Adds listeners for messages published by cart's Turbine
     */
    addCartTurbineListeners : function(){

        var self                = this;

        $(cartTurbine).bind('CartExample|issue|detected',function(event,payload){

            if (payload.content){
                $('#checkout-alert .msg').html(content[payload.content]);
            }

            if (payload.emptyCart === true){
                cart.emptyCart();
            }

            if (payload.forceSignup === true){

                alert('You must sign up now');
                self.showSignup();
            }

            $('#checkout-button').removeClass('disabled').html('Checkout');
            $('#checkout-alert').show().delay(3000).fadeOut('fast');
        });

        $(cartTurbine).bind('CartExample|checkout|completed',function(event,payload){

            if (payload.content){
                $('#checkout-success .msg').html(content[payload.content]);
            }

            $('#checkout-button').removeClass('disabled').html('Checkout');
            $('#checkout-success').show().delay(3000).fadeOut('fast');

            cart.emptyCart()
        });

        $(cartTurbine).bind('CartExample|specialOffer|granted',function(event,payload){

            if (payload.content){
                $('#checkout-info .msg').html(content[payload.content]);
            }

            if (payload.discount){
                cart.applyDiscount('nba2k',payload.discount);
            }

            cartTurbine.setResponse('gotSpecialOffer',true);

            $('#checkout-info').show().delay(3000).fadeOut('fast');
        });

        $(cartTurbine).bind('CartExample|item|missing',function(event,payload){

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

        $('#signup-button').hide();
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
    },

    showSignup : function(){

        $('#example').animate({
            marginLeft: -980
        });

        this.startSignup();
    },

    hideSignup : function(){

        $('#example').animate({
            marginLeft: 0
        });
    },
    
    startSignup : function(){
        
        window.signupTurbine                     = new Turbine(signupInit);
        signupTurbine.start();

        this.bindSignupUIHandlers();
        this.addSignupTurbineListeners();
    },

    bindSignupUIHandlers : function(){

        var self                                = this;

        $('#gender').change(function(){
            signupTurbine.setResponse('whichGender',$(this).val());
            $(signupTurbine).trigger('Signup|gender|selected');
        });

        $('body').on('change','#favorite', function(){
            signupTurbine.setResponse('likes',$(this).val());
            $(signupTurbine).trigger('Signup|favorite|selected');
        });
    },

    addSignupTurbineListeners : function(){

        $(signupTurbine).bind('SignupExample|step|advance|2',function(event,payload){

            $('.signup-step.step-1').fadeOut(function(){

                var $stepTwo                    = $('.signup-step.step-2');
                var html                        = $stepTwo.html();

                html                            = html.replace('{{thing}}',payload.thing);
                $stepTwo.html(html);

                for (var i=0;i<payload.options.length;i++){
                    $('#favorite').append('<option value="'+payload.options[i].toLowerCase()+'">'+payload.options[i]+'</option>');
                }

                $stepTwo.fadeIn();
            });
        });

        $(signupTurbine).bind('SignupExample|step|advance|3',function(event,payload){

            $('.signup-step.step-2').fadeOut(function(){

                $('.signup-step.step-3').fadeIn(function(){

                    $('#done-signup').click(function(){
                        app.completeSignup();
                    });
                });
            });
        });

        $(signupTurbine).bind('SignupExample|signup|completed',function(event,payload){
            app.completeSignup(payload.showThanks);
        });
    },

    completeSignup : function(showThanks){

        if (showThanks){
            alert('Thanks for signing up!');
        } else {
            alert('Congrats! You get '+cartTurbine.getVar('signupOfferPoints')+' SuperShopper points!');
        }

        app.logIn();
        app.hideSignup();

        $(cartTurbine).trigger('Signup|signup|completed');
    }
};
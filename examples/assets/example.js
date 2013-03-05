var cart = {

    items                               : {},
    totalItems                          : 0,
    totalPrice                          : 0,
    loggedIn                            : false,

    /**
     * Adds item to cart
     * 
     * @param itemType The type of item to add
     * @param guid The item's unique id
     */
    add : function(itemType,guid){

        this.items[itemType]          = this.items[itemType] || 0;
        this.items[itemType]         += 1;
        this.totalItems              += 1;

        this.appendRowToCart(itemType,guid);
        this.updateTotal();

        $('#remove-'+guid).click(function(){
            cart.remove(itemType,guid);
        });
    },

    /**
     * Removes item from cart
     * 
     * @param itemType The type of item to remove
     * @param guid The item's unique id
     */
    remove : function(itemType,guid){

        cart.items[itemType]         -= 1;
        this.totalItems              -= 1;

        $('#guid-' + guid).remove();
        this.updateTotal();

        if (this.totalItems === 0){
            this.showEmptyCartMsg();
        }
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
    },

    /**
     * Checks whether cart is empty
     *
     * @return {Boolean}
     */
    isCartEmpty : function(){
        return this.totalItems === 0;
    },

    /**
     * Checks to see if user qualifies for special offer
     *
     * @return {Boolean}
     */
    getsSpecialOffer : function(){
        return (typeof this.items.ps3 === 'number' && this.items.ps3 > 0) &&
               (typeof this.items.nba2k === 'number' && this.items.nba2k > 0);
    },

    /**
     * Appends row to cart
     *
     * @param itemType The type of item being added
     * @param guid The item's unique id
     */
    appendRowToCart : function(itemType,guid){

        $('#empty-cart').hide();

        var itemName                = $('#' + itemType + ' .item').html();
        var itemPrice               = $('#' + itemType + ' .price').html();

        var cartRow                 = '<tr id="guid-' + guid + '">';
        cartRow                    += '<td class="item">' + itemName + '</td>';
        cartRow                    += '<td class="' + itemType + ' price" data-price="'+itemPrice+'">' + itemPrice + '</td>';
        cartRow                    += '<td><a id="remove-' + guid + '" class="remove-from-cart">Remove</a></td>';
        cartRow                    += '</tr>';

        $('#cart').append(cartRow);
    },

    /**
     * Updates total price of items in cart
     */
    updateTotal : function(){

        var totalPrice              = 0;

        $('#cart td.price').each(function(i,el){

            var priceString         = $(el).attr('data-price');

            totalPrice             += parseFloat(priceString.substr(1));
            totalPrice              = Math.round(totalPrice * 100) / 100;
        });

        $('#total').html(totalPrice.toFixed(2));

        this.totalPrice             = totalPrice;
    },

    /**
     * Applies discount to item
     *
     * @param itemType The type of item being added
     * @param discount The percentage by which to discount the price
     */
    applyDiscount : function(itemType,discount){

        var $price                  = $('#cart .'+itemType+'.price');
        var priceString             = $price.attr('data-price');
        var priceNum                = parseFloat(priceString.substr(1));
        var newPrice                = priceNum * (100-discount)/100;

        $price.html('<span class="orig-price">'+priceString+'</span> <span class="new-price">$'+newPrice.toFixed(2)+'</span>');

        this.updateTotal();
    },

    /**
     * Shows message when cart is empty
     */
    showEmptyCartMsg : function(){
        $('#empty-cart').show();
    }
};

var webapi = {

    getSpecialOfferDiscount : function(){
        return 10;
    }
};

var workflow = {

    name                            : 'TurbineExample',
    logLevel                        : 'INFO',

    queries : {

        isCartEmpty                 : cart.isCartEmpty.bind(cart),
        isLoggedIn                  : cart.isLoggedIn.bind(cart),
        getsSpecialOffer            : cart.getsSpecialOffer.bind(cart)
    },

    resets : {

    },

    responses : {

    },

    workflow : {

         config : {

            shortcuts : {
            },

            variables : {

            },

            always : {

                timeout : {
                    after                           : 300000,
                    publish : {
                        message                     : "WORKFLOW_GLOBAL_TIMEOUT"
                    },
                    then                            : "stop."
                },

                waitFor : [
                    {
                        "waitFor"                   : "Cart|item|added",
                        "then"                      : "getsSpecialOffer"
                    }
                ]
            }
        },

        queries : {

            isLoggedIn : {

                yes : {
                    then                            : 'isCartEmpty'
                },
                no : {
                    publish : {
                        message                     : 'Cart|issue|detected',
                        using : {
                            content                 : 'loginRequired'
                        }
                    },
                    then                            : 'stop.'
                }
            },

            isCartEmpty : {
                yes : {
                    publish : {
                        message                     : 'Cart|issue|detected',
                        using : {
                            content                 : 'emptyCart'
                        }
                    },
                    then                            : 'stop.'
                },
                no                                  : '+checkoutComplete'
            },

            getsSpecialOffer : {
                yes : {
                    publish : {
                        message                     : 'Cart|console|added',
                        using : {
                            content                 : 'specialOffer',
                            discount                : webapi.getSpecialOfferDiscount()
                        }
                    },
                    then                            : 'stop.'
                },
                no : {
                    "waitFor"                       : "Cart|item|added",
                    "then"                          : "getsSpecialOffer"
                }
            }
        },

        mixins : {

            '+checkoutComplete' : {
                publish : {
                    message                         : 'Cart|checkout|complete',
                    using : {
                        content                     : 'success'
                    }
                },
                then                                : 'stop.'
            }
        }
    }
};

var content = {

    emptyCart           : 'You must add items to your cart before checking out',
    loginRequired       : 'You must be logged in before you can check out. Please click the Log In button above.',
    success             : 'Your purchase is complete',
    specialOffer        : 'You qualify for a special offer!'

};

var app = {

    init : function(){

        window.turbine = new Turbine(workflow);

        $(turbine).bind('Cart|issue|detected',function(event,payload){

            if (payload.content){
                $('#checkout-alert .msg').html(content[payload.content]);
            }

            $('#checkout-alert').show().delay(3000).fadeOut('fast');
        });

        $(turbine).bind('Cart|checkout|complete',function(event,payload){

            if (payload.content){
                $('#checkout-success .msg').html(content[payload.content]);
            }

            $('#checkout-success').show().delay(3000).fadeOut('fast');
        });

        $(turbine).bind('Cart|console|added',function(event,payload){

            if (payload.content){
                $('#checkout-info .msg').html(content[payload.content]);
            }

            if (payload.discount){
                cart.applyDiscount('nba2k',payload.discount);
            }

            $('#checkout-info').show().delay(3000).fadeOut('fast');
        });
    }
};


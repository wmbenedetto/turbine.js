var cart = {

    items                           : {},
    totalItems                      : 0,
    totalPrice                      : 0,
    lastItem                        : null,

    /**
     * Adds item to cart
     *
     * @param itemType The type of item to add
     * @param guid The item's unique id
     */
    add : function(itemType,guid){

        this.items[itemType]        = this.items[itemType] || 0;
        this.items[itemType]       += 1;
        this.totalItems            += 1;
        this.lastItem               = itemType;

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

        this.items[itemType]         -= 1;
        this.totalItems              -= 1;

        $('#guid-' + guid).remove();
        this.updateTotal();

        if (this.totalItems === 0){
            this.showEmptyCartMsg();
        }
    },

    /**
     * Empties cart of all items
     */
    emptyCart : function(){

        $('#cart tr.cart-item').remove();

        this.items                  = {};
        this.totalItems             = 0;
        this.totalPrice             = 0;
        this.lastItem               = null;

        this.showEmptyCartMsg();
        this.updateTotal();
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
     * Checks whether user's cart is missing a suggested item based on
     * other items in their cart
     *
     * @return {*}
     */
    getMissingItem : function(){

        if (this.lastItem === 'ps3' && !this.items.dualshock){
            return 'dualshock'
        } else if (this.lastItem === 'dualshock' && !this.items.charger){
            return 'charger'
        } else {
            return null;
        }
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

        var cartRow                 = '<tr class="cart-item" id="guid-' + guid + '">';
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
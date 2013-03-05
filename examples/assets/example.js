var cart = {

    items                               : {},
    totalItems                          : 0,
    totalPrice                          : 0,

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


        console.log(cart.items);
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

        console.log(cart.items);
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
        cartRow                    += '<td class="price">' + itemPrice + '</td>';
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

            var priceString         = $(el).html();

            totalPrice             += parseFloat(priceString.substr(1));
            totalPrice              = Math.round(totalPrice * 100) / 100;
        });

        $('#total').html(totalPrice.toFixed(2));

        this.totalPrice             = totalPrice;
    },

    /**
     * Shows message when cart is empty
     */
    showEmptyCartMsg : function(){
        $('#empty-cart').show();
    }
};

$(document).ready(function(){

    $('.add-to-cart').click(function(){

        var guid                    = ('' + Math.random() + new Date().getTime()).substr(10);
        var itemType                  = $(this).attr('data-item');

        cart.add(itemType, guid);
    });


});
var tour = {

    turbine : null,

    /**
     * Initializes the tour
     *
     * @param tourInit Turbine init object
     */
    init : function(tourInit){

        this.turbine            = new Turbine(tourInit);

        this.bindUIHandlers();
        this.bindTurbineListeners();
    },

    /**
     * Binds handlers to UI elements
     */
    bindUIHandlers : function(){

        var self                = this;

        $('#start-tour-button').click(function(){
            self.turbine.start();
        });

        $('.next-button').click(function(){
            $(self.turbine).trigger('Tour|button|clicked|NEXT');
        });
    },

    /**
     * Binds listeners for messages published by Turbine.
     *
     * Turbine uses jQuery's event system by default, so the listeners are
     * bound to the Turbine instance using jQuery.bind()
     */
    bindTurbineListeners : function(){

        $(this.turbine).bind('Tour|tour|started',function(event,payload){
            $('#tour-intro').hide();
        });

        $(this.turbine).bind('Tour|step|show',function(event,payload){

            $('.tour-step').hide();

            /* The "using" object from the workflow is sent as the payload */
            $('#tour-step-' + payload.step).show();

            if (payload.step == 3){
                $('#repeat-counter').html(payload.turbineRepeatCounter + 1);
            }
        });
    }
};
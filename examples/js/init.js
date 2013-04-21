var cartInit = {

    name                                        : 'CartExample',
    logLevel                                    : 'TRACE',

    queries : {

        isCartEmpty                             : cart.isCartEmpty.bind(cart),
        isLoggedIn                              : app.isLoggedIn.bind(app),
        getsSpecialOffer                        : cart.getsSpecialOffer.bind(cart),
        whichItemMissing                        : cart.getMissingItem.bind(cart)
    },

    resets : {

        /* A reset can be a function ... */
        isCartStarted : function(){
            return true;
        },

        /* ... or just a default value */
        isCheckoutStarted                       : false
    },

    responses : {
        isCartStarted                           : true,
        isCheckoutStarted                       : false
    },

    shortcuts : {
        start                                   : 'isCartStarted'
    },

    variables : {
        specialOfferDiscount                    : 10,
        signupOfferPoints                       : 100
    },

    always : {

        timeout : {
            after                               : 300000,
            publish : {
                message                         : "CartExample|issue|detected|WORKFLOW_GLOBAL_TIMEOUT"
            },
            then                                : "stop."
        },

        waitFor : [
            {
                waitFor                         : 'Cart|checkout|started',
                then                            : 'isCheckoutStarted'
            }
        ]
    },

    mixins : {

        isCartEmpty : {
            yes : {
                publish                         : '+EMPTY_CART',
                then                            : '@start'
            },
            no : {
                delay : {
                    for                         : 2500,
                    publish : {
                        message                 : 'CartExample|checkout|completed',
                        using : {
                            content             : 'success'
                        }
                    },
                    then                        : '@start'
                }
            }
        },

        APPLIED_DISCOUNT : {
            handle                              : 'APPLIED_DISCOUNT',
            description                         : '$specialOfferDiscount% discount applied',
            discount                            : '$specialOfferDiscount'
        },

        EMPTY_CART : {
            message                             : 'CartExample|issue|detected',
            using : {
                content                         : 'emptyCart'
            }
        }
    },

    /**
     * Queries are typically defined here. However, in this example, we're showing
     * how to toggle between two different query sets. Therefore, the queries are
     * contained in a separate object below. Which query set we'll use is defined
     * at runtime in app.init();
     */
    workflow : null
};

var queries = {

    /**
     * This query set contains a workflow which requires the user to log in
     * before adding an item to the cart
     */
    loginBeforeCart : {

        isCartStarted : {
            yes : {
                waitFor                         : 'Cart|item|added',
                then                            : 'isLoggedIn'
            },
            no : {
                then                            : 'stop.'
            }
        },

        isCheckoutStarted : {
            yes : {
                then                            : 'isCartEmpty'
            },
            no : {
                then                            : '@start'
            }
        },

        isLoggedIn : {

            yes : {
                then                            : 'getsSpecialOffer'
            },
            no : {
                publish : {
                    message                     : 'CartExample|issue|detected',
                    using : {
                        content                 : 'loginRequiredBeforeCart',
                        emptyCart               : true
                    }
                },
                waitFor                         : 'Cart|item|added',
                repeat : {
                    limit                       : 3,
                    publish : {
                        message                 : 'CartExample|issue|detected',
                        using : {
                            content             : 'loginRequiredBeforeCart',
                            emptyCart           : true,
                            forceSignup         : true
                        }
                    },
                    waitFor                     : 'Signup|signup|completed',
                    then                        : '@start'
                }
            }
        },

        isCartEmpty                             : '+isCartEmpty',

        getsSpecialOffer : {
            yes : {
                publish : {
                    message : [
                        'CartExample|console|added',
                        'CartExample|specialOffer|granted'
                    ],
                    using : {
                        content                 : 'specialOffer',
                        discount                : '$specialOfferDiscount'
                    }
                },
                report                          : '+APPLIED_DISCOUNT',
                then                            : 'isCheckoutStarted'
            },
            no : {
                "then"                          : "@start"
            }
        }
    },

    /**
     * This query set contains a workflow which requires the user to log in
     * before checking out.
     */
    loginBeforeCheckout : {

        isCartStarted : {
            yes : {
                waitFor                         : 'Cart|item|added',
                then                            : 'gotSpecialOffer'
            },
            no : {
                then                            : 'stop'
            }
        },

        gotSpecialOffer : {
            yes : {
                then                            : 'whichItemMissing'
            },
            no : {
                then                            : 'getsSpecialOffer'
            }
        },

        getsSpecialOffer : {
            yes : {
                publish : {
                    message : [
                        'CartExample|console|added',
                        'CartExample|specialOffer|granted'
                    ],
                    using : {
                        content                 : 'specialOffer',
                        discount                : '$specialOfferDiscount'
                    }
                },
                report                          : '+APPLIED_DISCOUNT',
                then                            : '@start'
            },
            no : {
                "then"                          : "whichItemMissing"
            }
        },

        whichItemMissing : {

            dualshock : {
                waitFor : [
                    'Cart|item|added',
                    'Cart|checkout|started'
                ],
                timeout : {
                    after                       : 2000,
                    publish : {
                        message                 : 'CartExample|item|missing',
                        using : {
                            content             : 'addDualshock'
                        }
                    },
                    then                        : '@start'
                },
                then                            : 'gotSpecialOffer'
            },
            charger : {
                waitFor : [
                    'Cart|item|added',
                    'Cart|checkout|started'
                ],
                timeout : {
                    after                       : 2000,
                    publish : {
                        message                 : 'CartExample|item|missing',
                        using : {
                            content             : 'addCharger'
                        }
                    },
                    then                        : '@start'
                },
                then                            : 'gotSpecialOffer'
            },
            default : {
                "then"                          : "@start"
            }
        },

        isCheckoutStarted : {
            yes : {
                then                            : 'isLoggedIn'
            },
            no : {
                then                            : 'gotSpecialOffer'
            }
        },

        isLoggedIn : {

            yes : {
                then                            : 'isCartEmpty'
            },
            no : {
                publish : {
                    message                     : 'CartExample|issue|detected',
                    using : {
                        content                 : 'loginRequired'
                    }
                },
                then                            : '@start'
            }
        },

        isCartEmpty                             : '+isCartEmpty'
    }
};


var signupInit = {

    name                                        : 'SignupExample',
    logLevel                                    : 'DEBUG',

    queries : {

    },

    resets : {
        isSignupStarted                         : true
    },

    responses : {
        isSignupStarted                         : true
    },

    mixins : {

        advanceToStep3 : {
            publish : {
                message                         : 'SignupExample|step|advance|3'
            },
            then                                : 'stop.'
        }
    },

    workflow : {

        isSignupStarted : {
            yes : {
                waitFor                     : 'Signup|gender|selected',
                then                        : 'whichGender'
            },
            no : {
                then                        : 'stop.'
            }
        },

        whichGender : {
            male : {
                publish : {
                    message                 : 'SignupExample|step|advance|2',
                    using : {
                        thing               : 'sport',
                        options : [
                            'Baseball',
                            'Football',
                            'Basketball',
                            'Hockey'
                        ]
                    }
                },
                waitFor                     : 'Signup|favorite|selected',
                then                        : 'likes'
            },
            female : {
                publish : {
                    message                 : 'SignupExample|step|advance|2',
                    using : {
                        thing               : 'animal',
                        options : [
                            'Cat',
                            'Dog',
                            'Bird',
                            'Horse'
                        ]
                    }
                },
                waitFor                     : 'Signup|favorite|selected',
                then                        : 'likes'
            },
            other : {
                publish : {
                    message                 : 'SignupExample|step|advance|2',
                    using : {
                        thing               : 'breakfast',
                        options : [
                            'Pancakes',
                            'Bacon',
                            'Waffles',
                            'Eggs'
                        ]
                    }
                },
                waitFor                     : 'Signup|favorite|selected',
                then                        : 'likes'
            }
        },

        likes : {
            basketball                      : '+advanceToStep3',
            dog                             : '+advanceToStep3',
            eggs                            : '+advanceToStep3',
            default : {
                publish : {
                    message                 : 'SignupExample|signup|completed',
                    using : {
                        showThanks          : true
                    }
                },
                then                        : 'stop.'
            }
        }
    }
};
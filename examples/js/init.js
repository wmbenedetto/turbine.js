var turbineInit = {

    name                            : 'TurbineExample',
    logLevel                        : 'DEBUG',

    queries : {

        isCartEmpty                 : cart.isCartEmpty.bind(cart),
        isLoggedIn                  : app.isLoggedIn.bind(app),
        getsSpecialOffer            : cart.getsSpecialOffer.bind(cart),
        whichItemMissing            : cart.getMissingItem.bind(cart)
    },

    resets : {

        /* A reset can be a function ... */
        isTurbineStarted : function(){
            return true;
        },

        /* ... or just a default value */
        isCheckoutStarted           : false
    },

    responses : {
        isTurbineStarted            : true,
        isCheckoutStarted           : false
    },

    workflow : {

         config : {

            shortcuts : {
                '@start'                            : 'isTurbineStarted'
            },

            variables : {
                '$specialOfferDiscount'             : webapi.getSpecialOfferDiscount()
            },

            always : {

                timeout : {
                    after                           : 300000,
                    publish : {
                        message                     : "Workflow|issue|detected|WORKFLOW_GLOBAL_TIMEOUT"
                    },
                    then                            : "stop."
                },

                waitFor : [
                    {
                        waitFor                     : 'Cart|checkout|started',
                        then                        : 'isCheckoutStarted'
                    }
                ]
            }
        },

        /**
         * Queries are typically defined here. However, in this example, we're showing
         * how to toggle between two different query sets. Therefore, the queries are
         * contained in a separate object below. Which query set we'll use is defined
         * at runtime in app.init();
         */
        queries : null,

        mixins : {

            '+checkoutComplete' : {
                publish : {
                    message                         : 'TurbineExample|checkout|complete',
                    using : {
                        content                     : 'success'
                    }
                },
                then                                : '@start'
            }
        }
    }
};

var queries = {

    /**
     * This query set contains a workflow which requires the user to log in
     * before adding an item to the cart
     */
    loginBeforeCart : {

        isTurbineStarted : {
            yes : {
                waitFor                         : 'Cart|item|added',
                then                            : 'isLoggedIn'
            },
            no : {
                then                            : 'stop'
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
                    message                     : 'TurbineExample|issue|detected',
                    using : {
                        content                 : 'loginRequiredBeforeCart',
                        emptyCart               : true
                    }
                },
                then                            : '@start'
            }
        },

        isCartEmpty : {
            yes : {
                publish : {
                    message                     : 'TurbineExample|issue|detected',
                    using : {
                        content                 : 'emptyCart'
                    }
                },
                then                            : '@start'
            },
            no                                  : '+checkoutComplete'
        },

        getsSpecialOffer : {
            yes : {
                publish : {
                    message : [
                        'TurbineExample|console|added',
                        'TurbineExample|specialOffer|granted'
                    ],
                    using : {
                        content                 : 'specialOffer',
                        discount                : '$specialOfferDiscount'
                    }
                },
                report : {
                    handle                      : 'APPLIED_DISCOUNT',
                    description                 : 'A discount was applied',
                    using : {
                        discount                : '$specialOfferDiscount'
                    }
                },
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

        isTurbineStarted : {
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
                        'TurbineExample|console|added',
                        'TurbineExample|specialOffer|granted'
                    ],
                    using : {
                        content                 : 'specialOffer',
                        discount                : '$specialOfferDiscount'
                    }
                },
                report : {
                    handle                      : 'APPLIED_DISCOUNT',
                    description                 : 'A discount was applied',
                    using : {
                        discount                : '$specialOfferDiscount'
                    }
                },
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
                        message                 : 'TurbineExample|item|missing',
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
                        message                 : 'TurbineExample|item|missing',
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
                    message                     : 'TurbineExample|issue|detected',
                    using : {
                        content                 : 'loginRequired'
                    }
                },
                then                            : '@start'
            }
        },

        isCartEmpty : {
            yes : {
                publish : {
                    message                     : 'TurbineExample|issue|detected',
                    using : {
                        content                 : 'emptyCart'
                    }
                },
                then                            : '@start'
            },
            no                                  : '+checkoutComplete'
        }
    }
};
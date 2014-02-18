/**
 * This example shows many (but not all) of the more advanced features of Turbine. The first part of the
 * file is heavily commented, to call out some of the key concepts. The rest of the file is devoid of comments,
 * so you can see what a workflow looks like without such heavy inline comments.
 */


/* This init object is for the shopping cart. There is a separate init object below for the signup process. */
var cartInit = {

    /* The name is used in console.log output */
    name                                        : 'CartExample',

    /* The logLevel determines how verbose the console.log output should be */
    logLevel                                    : 'DEBUG',

    /* The "queries" property binds Turbine queries to functions in the app. When Turbine encounters
     * these queries in the workflow, it executes the bound function and uses whatever is returned
     * as the response. */
    queries : {

        isCartEmpty                             : cart.isCartEmpty.bind(cart),
        isLoggedIn                              : app.isLoggedIn.bind(app),
        getsSpecialOffer                        : cart.getsSpecialOffer.bind(cart),
        whichItemMissing                        : cart.getMissingItem.bind(cart)
    },

    /* When Turbine rewinds a workflow from a later query to an earlier one, it uses any reset functions
    * or values defined in the "resets" property to reset the query response. */
    resets : {

        /* A reset can be a function ... */
        isCartStarted : function(){
            return true;
        },

        /* ... or just a default value */
        isCheckoutStarted                       : false
    },

    /* If no query function is bound to a query, Turbine will look for a response defined in the
     * "responses" property. Responses are false by default, so if you want a response to be something
     * else by default, here's your chance to do it. */
    responses : {
        isCartStarted                           : true,
        isCheckoutStarted                       : false
    },

    /* The @start shortcut is a special shortcut that tells Turbine which query to start with when
     * Turbine is started. If @start isn't defined, Turbine will use the first query in the workflow. */
    shortcuts : {
        start                                   : 'isCartStarted'
    },

    /* Variables can be used to define any non-scalar value to be used throughout your workflow. If
     * you want to use an object literal value, use a mixin instead. */
    variables : {
        specialOfferDiscount                    : 10,
        signupOfferPoints                       : 100
    },

    /* The "always" property gives you the option to define some properties that will be executed for
     * every action. */
    always : {

        /* By setting a timeout, you can ensure that Turbine has a global timeout that will
         * fire in case your app doesn't publish a message that Turbine is waiting for. */
        timeout : {
            after                               : 300000,
            then : {
                publish : {
                    message                     : "CartExample|issue|detected|WORKFLOW_GLOBAL_TIMEOUT"
                },
                then                            : "stop."
            }
        },

        /* By setting a waitFor property, you can ensure that Turbine is always waiting for a particular
         * message (or messages) from your app. This is good for things that can happen regardless of where
         * in the workflow a user may be, such as errors or system maintenance messages. */
        waitFor : {
            message                             : 'Cart|checkout|started',
            then                                : 'isCheckoutStarted'
        }
    },

    /* Mixins work like variables, except they define object literals. Mixins can be used to define entire
     * query responses, or just parts of actions. They are a great way to encapsulate duplicated functionality
     * in a single location. */
    mixins : {

        /* This mixin defines the entire response object for the isCartEmpty query */
        isCartEmpty : {
            yes : {
                publish                         : '+EMPTY_CART',
                then                            : '@start'
            },
            no : {
                delay : {
                    for                         : 2500,
                    then : {
                        publish : {
                            message             : 'CartExample|checkout|completed',
                            using : {
                                content         : 'success'
                            }
                        },
                        then                    : '@start'
                    }
                }
            }
        },

        /* This mixin defines the body of a report property in the workflow */
        APPLIED_DISCOUNT : {
            handle                              : 'APPLIED_DISCOUNT',
            description                         : '$specialOfferDiscount% discount applied',
            discount                            : '$specialOfferDiscount'
        },

        /* This mixin defines the body of a publish property in the workflow */
        EMPTY_CART : {
            message                             : 'CartExample|issue|detected',
            using : {
                content                         : 'emptyCart'
            }
        }
    },

    /**
     * The workflow is typically defined here. However, in this example, we're showing
     * how to toggle between two different workflows. Therefore, both workflows are
     * contained in a separate "workflows" object below. Which workflow we'll use is
     * defined at runtime in app.init();
     */
    workflow : null
};

var workflows = {

    /**
     * This workflow requires the user to log in before adding an item to the cart
     */
    loginBeforeCart : {

        /* The isCartStarted query is defined as the @start shortcut, and the default
         * response is defined as true. Therefore, Turbine starts here and immediately
         * executes the "yes" response. The action tells Turbine to wait for the
         * Cart|item|added message. When it gets it, Turbine executes the isLoggedIn query. */
        isCartStarted : {
            yes : {
                waitFor : {
                    message                     : 'Cart|item|added',
                    then                        : 'isLoggedIn'
                }
            },
            no : {
                then                            : 'stop.'
            }
        },

        /* In the "always" object defined above, we told Turbine to always wait for the
         * Cart|checkout|started message. If, at any time, the user clicks the Checkout
         * button, Turbine will execute this query. */
        isCheckoutStarted : {

            /* If checkout is already started, then Turbine moves to the isCartEmpty query. */
            yes : {
                then                            : 'isCartEmpty'
            },
            /* If checkout isn't started yet, then Turbine starts at the beginning of the workflow,
             * as defined by the @start shortcut. */
            no : {
                then                            : '@start'
            }
        },

        /* The isLoggedIn query is bound to the app.isLoggedIn() method. That gets executed,
         * and the result determines where Turbine goes next. */
        isLoggedIn : {

            /* If the user is logged in, then we execute the getsSpecialOffer query. Let's
             * assume the user isn't logged in. Therefore, we proceed to the "no" response below. */
            yes : {
                then                            : 'getsSpecialOffer'
            },
            /* If the user isn't logged in, Turbine executes this action. Let's look at each piece ...*/
            no : {

                /* Turbine publishes a message */
                publish : {
                    message                     : 'CartExample|issue|detected',

                    /* The "using" property defines an object that is passed as the payload with
                     * the published message. This tells the app which content to display, in this example. */
                    using : {
                        content                 : 'loginRequiredBeforeCart',
                        emptyCart               : true
                    }
                },

                /* Turbine then waits for the Cart|item|added message. */
                waitFor                         : 'Cart|item|added',

                /* When Turbine gets the message, it will repeat this isLoggedIn query again. If the user
                 * is logged in now, then it will follow the "yes" response. But if the user isn't logged in
                 * yet, we'll end up back here again. */
                repeat : {

                    /* If the user continues trying to add items to the cart without logging in, we'll reach
                     * the limit defined here on the third try. */
                    limit                       : 3,

                    /* Once the limit is reached, the "then" action gets executed. */
                    then : {

                        /* Again, we publish the CartExample|issue|detected message. */
                        publish : {
                            message             : 'CartExample|issue|detected',

                            /* But this time, the "using" object has a forceSignup property defined. This
                             * tells the app to force the user to sign up before continuing. At this point,
                             * the app kicks off an entirely different Turbine workflow to power the signup
                             * process. */
                            using : {
                                content         : 'loginRequiredBeforeCart',
                                emptyCart       : true,
                                forceSignup     : true
                            }
                        },

                        /* When the other signup workflow is complete, the app publishes the Signup|signup|completed
                         * message, for which we're patiently waiting. When we get it, we go back to the start of this
                         * workflow, as defined by the @start shortcut. */
                        waitFor                 : 'Signup|signup|completed',
                        then                    : '@start'
                    }
                }
            }
        },

        /* The isCartEmpty query uses the +isCartEmpty mixin defined above. */
        isCartEmpty                             : '+isCartEmpty',

        /* If the user is logged in, he'll end up here after the isLoggedIn:yes response. Since this query
         * was bound to the cart.getsSpecialOffer() method, that gets executed here. This is a good example
         * of how Turbine only defines the "what" of your application, but not the "how" or "why." We don't
         * care how or why the user gets the special offer. All we care about is what to do next. */
        getsSpecialOffer : {

            /* If the user gets the special offer, then we execute this action. */
            yes : {

                /* In this case, we publish two messages instead of just one. */
                publish : {
                    message : [
                        'CartExample|console|added',
                        'CartExample|specialOffer|granted'
                    ],
                    /* The "using" property is passed as the payload for both messages. */
                    using : {

                        content                 : 'specialOffer',

                        /* Here we're using the $specialOfferDiscount variable. Whatever value was
                         * defined for that variable above is what gets inserted here. */
                        discount                : '$specialOfferDiscount'
                    }
                },

                /* We also use the "report" functionality to report this event. By default, this just
                 * outputs the report to the console. But this can easily be wired up to send a report
                 * to the analytics engine of your choice. Also, notice that the actual object that
                 * gets sent to the report method is defined as a mixin. This allows the same report
                 * object to be used in multiple places throughout the workflow without repeating the
                 * same info in multiple places. */
                report                          : '+APPLIED_DISCOUNT',

                /* Once publishing and reporting is complete, Turbine goes back to the start of the workflow. */
                then                            : '@start'
            },

            /* If the user doesn't get the special offer, we just go right back to the start of the workflow. */
            no : {
                then                            : "@start"
            }
        }
    },


/**
 * Now that you've read through the commented section, try reading through the rest to see if you can
 * follow what's happening in the workflow without comments. Hopefully, you'll be able to understand the
 * entire flow of application logic without needing to opening another file. Good luck! -- Warren
*/

    /**
     * This workflow requires the user to log in before checking out.
     */
    loginBeforeCheckout : {

        isCartStarted : {
            yes : {
                waitFor                         : 'Cart|item|added',
                then                            : 'gotSpecialOffer'
            },
            no : {
                then                            : 'stop.'
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
                then                            : "whichItemMissing"
            }
        },

        whichItemMissing : {

            dualshock : {

                /* Here, we're waiting for two messages. If we get either, then we go to the next
                 * query defined by the "then" property. */
                waitFor : [
                    'Cart|item|added',
                    'Cart|checkout|started'
                ],
                then                            : 'gotSpecialOffer',
                timeout : {
                    after                       : 2000,
                    then : {
                        publish : {
                            message             : 'CartExample|item|missing',
                            using : {
                                content         : 'addDualshock'
                            }
                        },
                        then                    : '@start'
                    }
                }
            },

            charger : {
                waitFor : [
                    'Cart|item|added',
                    'Cart|checkout|started'
                ],
                then                            : 'gotSpecialOffer',
                timeout : {
                    after                       : 2000,
                    then : {
                        publish : {
                            message             : 'CartExample|item|missing',
                            using : {
                                content         : 'addCharger'
                            }
                        },
                        then                    : '@start'
                    }
                }
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

/* This init object defines an entirely different workflow, powering the signup process in the
 * shopping cart example. This signup workflow is executed by a separate Turbine instance in the middle
 * of the shopping cart workflow, demonstrating how multiple workflows can be used simultaneously.  */
var signupInit = {

    name                                        : 'SignupExample',
    logLevel                                    : 'DEBUG',

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
                waitFor                         : 'Signup|gender|selected',
                then                            : 'whichGender'
            },
            no : {
                then                            : 'stop.'
            }
        },

        whichGender : {
            male : {
                publish : {
                    message                     : 'SignupExample|step|advance|2',
                    using : {
                        thing                   : 'sport',
                        options : [
                            'Baseball',
                            'Football',
                            'Basketball',
                            'Hockey'
                        ]
                    }
                },
                waitFor                         : 'Signup|favorite|selected',
                then                            : 'likes'
            },
            female : {
                publish : {
                    message                     : 'SignupExample|step|advance|2',
                    using : {
                        thing                   : 'animal',
                        options : [
                            'Cat',
                            'Dog',
                            'Bird',
                            'Horse'
                        ]
                    }
                },
                waitFor                         : 'Signup|favorite|selected',
                then                            : 'likes'
            },
            other : {
                publish : {
                    message                     : 'SignupExample|step|advance|2',
                    using : {
                        thing                   : 'breakfast',
                        options : [
                            'Pancakes',
                            'Bacon',
                            'Waffles',
                            'Eggs'
                        ]
                    }
                },
                waitFor                         : 'Signup|favorite|selected',
                then                            : 'likes'
            }
        },

        likes : {
            basketball                          : '+advanceToStep3',
            dog                                 : '+advanceToStep3',
            eggs                                : '+advanceToStep3',
            default : {
                publish : {
                    message                     : 'SignupExample|signup|completed',
                    using : {
                        showThanks              : true
                    }
                },
                then                            : 'stop.'
            }
        }
    }
};
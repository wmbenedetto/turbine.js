var tourInit = {

    /* The name is used in console.log output */
    name                            : 'TourExample',

    /* The logLevel determines how verbose the console.log output should be */
    logLevel                        : 'DEBUG',

    /* This workflow is using an array of action objects, which means it's a sequence */
    workflow : [

        /* This action publishes a message, then immediately goes to the next step */
        {
            publish : {
                message             : 'Tour|tour|started'
            },
            then                    : '@next'
        },
        /* This action publishes a message, then waits for the Tour|button|clicked|NEXT message
         * to be published by the app. Once that is published, it moves to the next step. */
        {
            publish : {
                message             : 'Tour|step|show',
                using : {
                    step            : 1
                }
            },
            waitFor                 : 'Tour|button|clicked|NEXT',
            then                    : '@next'
        },
        /* This action publishes a message, then starts a 10-second (10000 millisecond) timer. When
         * the timer expires, it moves to the next step in the sequence. */
        {
            publish : {
                message             : 'Tour|step|show',
                using : {
                    step            : 2
                }
            },
            timeout : {
                after: 10000,
                then : '@next'
            }
        },
        /* This action publishes a message, then waits for the Tour|button|clicked|NEXT message to be
         * published by the app. When it receives that message, the "repeat" property tells Turbine to
         * repeat the same action again. Therefore, the same message is published, and again it waits
         * for Tour|button|clicked|NEXT. When this has been repeated 5 times, Turbine moves to the next
         * step in the sequence. */
        {
            publish : {
                message             : 'Tour|step|show',
                using : {
                    step            : 3
                }
            },
            waitFor                 : 'Tour|button|clicked|NEXT',
            repeat : {
                limit : 5,
                then : '@next'
            }
        },
        /* This action publishes a message, then sends a report using Turbine's default report() function
         * (which just dumps the report to the console). The "then" property is "stop.", which tells Turbine
         * that this workflow is complete. */
        {
            publish : {
                message             : 'Tour|step|show',
                using : {
                    step            : 4
                }
            },
            report : {
                handle              : 'TOUR_EXAMPLE_FINISHED',
                description         : 'This is an example of using "report" in a workflow'
            },
            then                    : 'stop.'
        }
    ]
};
var tourInit = {

    name                            : 'TourExample',
    logLevel                        : 'DEBUG',

    workflow : [
        {
            publish : {
                message             : 'Tour|tour|started'
            },
            then                    : '@next'
        },
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
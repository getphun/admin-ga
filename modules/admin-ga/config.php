<?php
/**
 * admin-ga config file
 * @package admin-ga
 * @version 0.0.1
 * @upgrade true
 */

return [
    '__name' => 'admin-ga',
    '__version' => '0.0.1',
    '__git' => 'https://github.com/getphun/admin-ga',
    '__files' => [
        'modules/admin-ga'          => [ 'install', 'remove', 'update' ],
        'theme/admin/statistic/ga'  => [ 'install', 'remove', 'update' ],
        'theme/admin/static/js/admin-ga-pageview.js'    => [ 'install', 'remove', 'update' ],
        'theme/admin/static/js/admin-ga-realtime.js'    => [ 'install', 'remove', 'update' ],
        'theme/admin/static/css/admin-ga-realtime.css'  => [ 'install', 'remove', 'update' ]
    ],
    '__dependencies' => [
        'admin',
        'api-google',
        'site-param'
    ],
    '_services' => [],
    '_autoload' => [
        'classes' => [
            'AdminGa\\Controller\\StatisticController' => 'modules/admin-ga/controller/StatisticController.php'
        ],
        'files' => []
    ],
    
    '_routes' => [
        'admin' => [
            'adminGAPageview' => [
                'rule' => '/statistic/pageview',
                'handler' => 'AdminGa\\Controller\\Statistic::pageview'
            ],
            'adminGARealtime' => [
                'rule' => '/statistic/realtime',
                'handler' => 'AdminGa\\Controller\\Statistic::realtime'
            ]
        ]
    ],
    
    'admin' => [
        'menu' => [
            'statistic' => [
                'label'     => 'Statistic',
                'order'     => 2000,
                'icon'      => 'line-chart',
                'submenu'   => [
                    'pageview'   => [
                        'label'     => 'Pageview',
                        'perms'     => 'read_ga_pageview',
                        'target'    => 'adminGAPageview',
                        'order'     => 20
                    ],
                    'realtime'   => [
                        'label'     => 'Realtime',
                        'perms'     => 'read_ga_realtime',
                        'target'    => 'adminGARealtime',
                        'order'     => 30
                    ]
                ]
            ]
        ]
    ],
    
    'form' => [
        'admin-ga-pageview' => [
            'time-start' => [
                'type'      => 'date',
                'label'     => 'Time Start',
                'nolabel'   => true,
                'rules'     => []
            ],
            'time-end' => [
                'type'      => 'date',
                'label'     => 'Time End',
                'nolabel'   => true,
                'rules'     => []
            ],
            'type' => [
                'type'      => 'select',
                'nolabel'   => true,
                'label'     => 'Type',
                'options'   => [
                    'pageview'  => 'Pageview',
                    'gender'    => 'Gender',
                    'age'       => 'Age',
                    'country'   => 'Country'
                ],
                'rules'     => []
            ],
            'group' => [
                'type'      => 'select',
                'nolabel'   => true,
                'label'     => 'Group Per',
                'options'   => [
                    'hourly'    => 'Hourly',
                    'daily'     => 'Daily',
                    'monthly'   => 'Monthly',
                    'yearly'    => 'Yearly'
                ],
                'rules'     => []
            ]
        ]
    ]
];
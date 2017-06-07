INSERT IGNORE INTO `user_perms` ( `name`, `group`, `role`, `about` ) VALUES
    ( 'read_ga_pageview', 'GA Statistic', 'Management', 'Allow user to view site pageview statistic' ),
    ( 'read_ga_realtime', 'GA Statistic', 'Management', 'Allow user to view site realtime statistic' );

INSERT IGNORE INTO `site_param` ( `name`, `type`, `group`, `value` ) VALUES
    ( 'google_analytics_view', 1, 'Code', '' );
DELETE FROM `user_perms_chain` WHERE `user_perms` IN (
    SELECT `id` FROM `user_perms` WHERE `group` = 'GA Statistic'
);

DELETE FROM `user_perms` WHERE `group` = 'GA Statistic';
DELETE FROM `site_param` WHERE `name` = 'google_analytics_view';
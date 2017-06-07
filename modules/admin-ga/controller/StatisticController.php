<?php
/**
 * GA Statistic controller
 * @package admin-ga
 * @version 0.0.1
 * @upgrade true
 */

namespace AdminGa\Controller;

class StatisticController extends \AdminController
{
    private function _defaultParams(){
        return [
            'title'             => 'Pageview',
            'nav_title'         => 'Statistic',
            'active_menu'       => 'statistic',
            'active_submenu'    => 'pageview',
            'error'             => false
        ];
    }
    
    private function makeView($type){
        if(!$this->user->login)
            return $this->loginFirst('adminLogin');
        
        $perms = 'read_ga_' . $type;
        if(!$this->can_i->$perms)
            return $this->show404();
        
        $params = $this->_defaultParams();
        $params['active_submenu'] = $type;
        $params['title'] = ucfirst($type);
        
        if(!module_exists('api-google'))
            $params['error'] = 'Module <code>api-google</code> is not installed.';
        else{
            $token = $this->google->forRAnalytics()->getAccessToken();
            $params['token'] = $token['access_token'];
            $params['ga_view'] = $this->setting->google_analytics_view;
            $params['jses'] = [
                'js/admin-ga-' . $type . '.js',
                'https://apis.google.com/js/client.js?onload=gaInit'
            ];
            if($type == 'realtime')
                $params['csses'] = ['css/admin-ga-realtime.css'];
        }
        
        return $this->respond('statistic/ga/'.$type, $params);
    }
    
    public function pageviewAction(){
        $this->form->setForm('admin-ga-pageview');
        $this->form->setObject((object)[
            'time-start' => date('Y-m-d'),
            'time-end'   => date('Y-m-d'),
            'group'      => 'hourly'
        ]);
        $this->makeView('pageview');
    }
    
    public function realtimeAction(){
        $this->makeView('realtime');
    }
}
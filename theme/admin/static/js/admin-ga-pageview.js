window.D = {
    _isLoading: false,
    
    colors: [
        '#99b433',
        '#00a300',
        '#1e7145',
        '#ff0097',
        '#9f00a7',
        '#7e3878',
        '#603cba',
        '#00aba9',
        '#2d89ef',
        '#2b5797',
        '#ffc40d',
        '#e3a21a',
        '#da532c',
        '#ee1111',
        '#b91d47'
    ],
    
    current: {
        end     : null,
        start   : null,
        timly   : null,
        type    : null
    },
    
    dimentions: {
        hourly  : [{ name: 'ga:year' }, { name: 'ga:month' }, { name: 'ga:day' }, { name: 'ga:hour' }],
        daily   : [{ name: 'ga:year' }, { name: 'ga:month' }, { name: 'ga:day' }],
        monthly : [{ name: 'ga:year' }, { name: 'ga:month' }],
        yearly  : [{ name: 'ga:year' }]
    },
    
    dimentionsByType: {
        pageview: undefined,
        age     : { name: 'ga:userAgeBracket' },
        country : { name: 'ga:country' },
        gender  : { name: 'ga:userGender' }
    },
    
    el: {},
    
    labels: {
        'ga:pageviews'  : 'Pageviews',
        'ga:sessions'   : 'Sessions',
        'ga:users'      : 'Users',
        
        'pageview'      : 'Pageview',
        'gender'        : 'Gender',
        'age'           : 'Age',
        'country'       : 'Country'
    },
    
    metrics: [
        { expression: 'ga:pageviews' },
        { expression: 'ga:sessions' },
        { expression: 'ga:users' }
    ],
    
    
    alert: function(title, message){
        bootbox.alert({
            title: title,
            message: message
        });
        
        return false;
    },
    
    fetch: function(){
        if(D._isLoading)
            return D.alert('In Progress...', 'Please wait until current process finish');
        
        var config,
            dimentions,
            query;
        
        D.current.end   = D.el.fTimeEnd.val();
        D.current.start = D.el.fTimeStart.val();
        D.current.type  = D.el.fType.val();
        D.current.timly = D.el.fGroup.val();
        
        config = {
            path    : 'https://analyticsreporting.googleapis.com/v4/reports:batchGet',
            method  : 'POST',
            body    : {
                reportRequests: []
            }
        };
        
        dimentions = JSON.parse(JSON.stringify(D.dimentions[D.current.timly]));
        if(D.dimentionsByType[D.current.type])
            dimentions.push(D.dimentionsByType[D.current.type]);
        
        query = {
            viewId      : MyGA.view,
            metrics     : D.metrics,
            dimensions  : dimentions,
            dateRanges  : [{
                startDate   : D.current.start,
                endDate     : D.current.end
            }]
        };
        
        config.body.reportRequests.push(query);
        
        D.loading(true);
        D.el.rResult.addClass('hidden');
        gapi.client.request(config).execute(function(res){
            D.loading(false);
            
            if(res.error)
                return D.alert('Error', res.error.message);
            
            D.genResult(res);
        });
        
        return false;
    },
    
    genCanvas: function(){
        var width  = D.el.rGraph.width();
        var height = 250;
        var canvas = $('<canvas/>', { width: width, height: height });
        
        D.el.rGraph.append(canvas);
        
        return canvas;
    },
    
    genGraph: function(reports){
        
    },
    
    genResult: function(result){
        var reports = result.reports[0];
        D.genResume(reports);
        D.genGraph(reports);
        
    },
    
    genResume: function(reports){
        D.el.rResultInfo.text(D.labels[D.current.type]);
        var data    = reports.data;
        var rows    = data.rows;
        var rcount  = data.rowCount;
        
        var trows   = {};
        
        for(var i=0; i<rows.length; i++){
            var row = rows[i];
            var metrics = row.metrics[0].values;
            var diment  = row.dimensions[row.dimensions.length-1];
            
            if(D.current.type == 'pageview')
                diment = '';
            
            if(!trows[diment])
                trows[diment] = [[0,0,0], [0,0,0]];
            
            for(var j=0; j<metrics.length; j++)
                trows[diment][0][j]+= parseInt(metrics[j]);
        }
        
        for(var k in trows){
            for(var i=0; i<trows[k][0].length; i++)
                trows[k][1][i] = Math.ceil( trows[k][0][i] / rcount );
        }
        
        var trowsSortable = [];
        for(var k in trows)
            trowsSortable.push({label: k,data : trows[k]});
        
        trowsSortable.sort(function(a,b){
            return b.data[0][0] - a.data[0][0];
        });
        
        D.el.rResultItems.html('');
        for(var i=0; i<trowsSortable.length; i++){
            var row = trowsSortable[i];
            var label = row.label;
            var data = row.data;
            
            var tr = $('<tr/>').appendTo(D.el.rResultItems);
            $('<td/>').html(label).appendTo(tr);
            
            for(var j=0; j<data[0].length; j++){
                $('<td/>',{class:'text-right', html: data[0][j].toLocaleString()}).appendTo(tr);
                $('<td/>',{class:'text-right', html: data[1][j].toLocaleString()}).appendTo(tr);
            }
        }
        
        D.el.rResult.removeClass('hidden');
    },
    
    init: function(){
        if(!window.gapi || !window.MyGA || !window.MyGA.token)
            return;
        if(!window.MyGA.view)
            return D.alert('Whoops', 'Please fill site setting <code>google_analytics_view</code> to continue.');
        
        gapi.auth.setToken({access_token: MyGA.token});
        
        // get all our elements
        D.el.form           = $('#ga-filter');
        D.el.fTimeStart     = $('#field-time-start');
        D.el.fTimeEnd       = $('#field-time-end');
        D.el.fType          = $('#field-type');
        D.el.fGroup         = $('#field-group');
        
        D.el.rGraph         = $('#graph');
        D.el.rResult        = $('#resume');
        D.el.rResultInfo    = $('#resume-info');
        D.el.rResultItems   = $('#resume-items');
        
        D.el.fTimeStart.parent().on('dp.change', D.onFTimeChange );
        D.el.fTimeEnd.parent().on('dp.change', D.onFTimeChange );
        D.el.fType.change(D.onFTypeChange);
        
        D.onFTypeChange();
        
        D.el.form.submit(D.fetch);
        D.el.form.submit();
    },
    
    loading: function(show){
        D._isLoading = show;
        
        show
            ? D.el.rGraph.html(
                '<div class="progress">' +
                    '<div class="progress-bar progress-bar-striped active" role="progressbar" style="width: 100%">' +
                        'Fetching data...' +
                    '</div>' +
                '</div>')
            : D.el.rGraph.html('');
    },
    
    onFTypeChange: function(){
        var opts = [['daily', 'Daily'], ['monthly', 'Monthly'], ['yearly', 'Yearly']];
        if(D.el.fType.val() == 'pageview')
            opts.unshift(['hourly', 'Hourly']);
        var ov = D.el.fGroup.val();
        D.el.fGroup.html('');
        
        for(var i=0; i<opts.length; i++){
            var attr = {value: opts[i][0], text: opts[i][1]};
            if(opts[i][0] == ov)
                attr.selected = 'selected';
            D.el.fGroup.append($('<option/>', attr));
        }
        
        D.el.fGroup.selectpicker('refresh');
    },
    
    onFTimeChange: function(){
        var start = new Date(D.el.fTimeStart.val());
        var end   = new Date(D.el.fTimeEnd.val());
        
        if(start.getFullYear() != end.getFullYear())
            return D.el.fGroup.selectpicker('val', 'yearly');
        
        if(start.getMonth() != end.getMonth())
            return D.el.fGroup.selectpicker('val', 'monthly');
        
        if(start.getDate() != end.getDate())
            return D.el.fGroup.selectpicker('val', 'daily');
        
        return D.el.fGroup.selectpicker('val', 'hourly');
    }
};

function gaInit(){
    D.init();
}
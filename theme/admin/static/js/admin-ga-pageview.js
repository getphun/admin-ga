window.D = {
    _isLoading: false,
    
    alert: function(title, message){
        bootbox.alert({
            title: title,
            message: message
        });
    },
    
    colors: [
        '#FF6384',
        '#FFCD56',
        '#36A2EB'
    ],
    
    el: {},
    
    labels: {
        'ga:pageviews': 'Pageviews',
        'ga:sessions' : 'Sessions',
        'ga:users'    : 'Users'
    },
    
    months: {
        '01': 'Jan',
        '02': 'Feb',
        '03': 'Mar',
        '04': 'Apr',
        '05': 'May',
        '06': 'Jun',
        '07': 'Jul',
        '08': 'Aug',
        '09': 'Sep',
        '10': 'Oct',
        '11': 'Nov',
        '12': 'Dec'
    },
    
    init: function(){
        if(!window.gapi || !window.MyGA || !window.MyGA.token)
            return;
        
        gapi.auth.setToken({access_token: MyGA.token});
        
        D.el.form    = $('#ga-filter');
        D.el.fGroup  = $('#field-group');
        D.el.fTStart = $('#field-time-start');
        D.el.fTEnd   = $('#field-time-end');
        D.el.graph   = $('#graph');
        D.el.resume  = $('#resume');
        
        D.el.fTStart.parent().on('dp.change', D.timeChange );
        D.el.fTEnd.parent().on('dp.change', D.timeChange );
        
        D.el.form.submit( D.fetch );
        D.el.form.submit();
    },
    
    fetch: function(){
        if(D._isLoading)
            return D.alert('Whoops', 'Please wait until current process finish');
        D.loading(true);
        D._isLoading = true;
        
        var timely = D.el.fGroup.val();
        var config = {
                path: 'https://analyticsreporting.googleapis.com/v4/reports:batchGet',
                method: 'POST',
                body: {reportRequests:[]}
            };
        var query = {
                viewId: MyGA.view,
                metrics: [
                    { expression: 'ga:pageviews' },
                    { expression: 'ga:sessions' },
                    { expression: 'ga:users' }
                ],
                dateRanges: [{
                    startDate: D.el.fTStart.val(),
                    endDate  : D.el.fTEnd.val()
                }]
            };
        
        switch(timely){
            case 'hourly':
                query.dimensions = [{ name: 'ga:year' }, { name: 'ga:month' }, { name: 'ga:day' }, { name: 'ga:hour' }];
                break;
            case 'daily':
                query.dimensions = [{ name: 'ga:year' }, { name: 'ga:month' }, { name: 'ga:day' }];
                break;
            case 'monthly':
                query.dimensions = [{ name: 'ga:year' }, { name: 'ga:month' }];
                break;
            case 'yearly':
                query.dimensions = [{ name: 'ga:year' }];
                break;
        }
        
        config.body.reportRequests.push(query);
        
        gapi.client.request(config).execute(function(res){
            D._isLoading = false;
            D.loading(false);
            
            if(res.error)
                return D.alert('Google Analytics Error', res.error.message);
            
            D.genResult(res);
        });
        
        return false;
    },
    
    formatRows: function(res){
        var result = {};
        
        if(!res.data.rows)
            return result;
        
        var rows   = res.data.rows;
        var dims   = res.columnHeader.dimensions;
        var matrix = res.columnHeader.metricHeader.metricHeaderEntries;
        
        for(var i=0; i<rows.length; i++){
            var row = rows[i];
            var key = row.dimensions.join('');
            
            var rowDims = {};
            for(var j=0; j<dims.length; j++)
                rowDims[dims[j]] = row.dimensions[j];
            
            var rowMatr = {};
            for(var j=0; j<matrix.length; j++)
                rowMatr[matrix[j].name] = row.metrics[0].values[j];
            
            result[key] = {
                dimensions: rowDims,
                matrix: rowMatr
            }
        }
        
        return result;
    },
    
    genCanvas: function(){
        var canvas = $('<canvas></canvas>');
        var width  = D.el.graph.width();
        var height = Math.round((width/16)*9);
        
        canvas.attr({ width: width, height: height });
        D.el.graph.append(canvas);
        
        return canvas;
    },
    
    genGraph: function(res){
        var canvas = D.genCanvas();
        var ctx    = canvas.get(0).getContext('2d');
        var frows  = D.formatRows(res);
        
        var config = {
                type: 'line',
                data: {
                    labels  : D.genGraphLabel(frows, res),
                    datasets: D.genGraphDataset(frows, res)
                },
                options: {
                    responsive: true,
                    scales: {
                        xAxes: [{
                            display: true
                        }],
                        yAxes: [{
                            display: false
                        }]
                    }
                }
            };
        
        // the very last one
        new Chart(ctx, config);
    },
    
    genGraphLabel: function(rows, res){
        var vals = {};
        
        for(var k in rows){
            var row    = rows[k];
            var dims   = row.dimensions;
            
            for(var l in dims){
                if(!vals[l])
                    vals[l] = [];
                if(!~vals[l].indexOf(dims[l]))
                    vals[l].push(dims[l]);
            }
        }
        
        var usedVals = [];
        for(var k in vals){
            if(vals[k].length > 1)
                usedVals.push(k);
        }
        
        var rowsId = Object.keys(rows);
        rowsId = rowsId.sort();
        
        var labels = [];
        
        var isYear = ~usedVals.indexOf('ga:year');
        var isDay  = ~usedVals.indexOf('ga:day');
        var isMonth= ~usedVals.indexOf('ga:month') || isDay;
        var isHour = ~usedVals.indexOf('ga:hour');
        var hourOnly = !isDay && !isMonth && !isYear;
        
        for(var i=0; i<rowsId.length; i++){
            var row = rows[rowsId[i]];
            var dims= row.dimensions;
            
            var label = '';
            
            if(isMonth)
                label+= D.months[dims['ga:month']];
            
            if(isDay){
                if(isMonth)
                    label+= ' ';
                label+= dims['ga:day'];
            }
            
            if(isYear){
                if(isDay)
                    label+= ', ';
                else if(isMonth)
                    label+= ' ';
                label+= dims['ga:year'];
            }
            
            if(isHour){
                if(!hourOnly)
                    label+= ' ';
                label+= dims['ga:hour'] + ':00';
            }
            
            labels.push(label);
        }
        
        return labels;
    },
    
    genGraphDataset: function(rows, res){
        var datasets = [];
        
        var matrix = res.columnHeader.metricHeader.metricHeaderEntries;
        
        for(var i=0; i<matrix.length; i++){
            var matr = matrix[i];
            
            datasets.push({
                label: D.labels[matr.name],
                backgroundColor: D.colors[i],
                borderColor: D.colors[i],
                data: [],
                fill: false
            });
        }
        
        var rowsId = Object.keys(rows);
        rowsId = rowsId.sort();
        
        for(var i=0; i<rowsId.length; i++){
            var row = rows[rowsId[i]];
            var rowMatrix = row.matrix;
            
            for(var j=0; j<matrix.length; j++){
                var matr = matrix[j];
                datasets[j].data.push( rowMatrix[matr.name] );
            }
        }
        
        return datasets;
    },
    
    genResult: function(res){
        var reports = res.reports[0];
        
        D.genResume(reports);
        D.genGraph(reports);
    },
    
    genResume: function(res){
        D.el.resume.html('');
        
        var rows = res.data.totals[0].values;
        var mats = res.columnHeader.metricHeader.metricHeaderEntries;
        
        for(var i=0; i<rows.length; i++){
            var tr = $('<tr></tr>');
            tr.appendTo(D.el.resume);
            
            var th = $('<th></th>');
            th.text( D.labels[ mats[i].name ] );
            th.appendTo(tr);
            
            var td = $('<td class="text-right"></td>');
            td.html( parseInt(rows[i]).toLocaleString() );
            td.appendTo(tr);
        }
    },
    
    loading: function(s){
        s
        ? D.el.graph.html('<div class="progress"><div class="progress-bar progress-bar-striped active" role="progressbar" style="width: 100%">Fetching data...</div></div>')
        : D.el.graph.html('');
    },
    
    timeChange: function(){
        var start = new Date(D.el.fTStart.val());
        var end   = new Date(D.el.fTEnd.val());
        
        if(start.getFullYear() != end.getFullYear())
            return D.el.fGroup.selectpicker('val', 'yearly');
        if(start.getMonth() != end.getMonth())
            return D.el.fGroup.selectpicker('val', 'monthly');
        if(start.getDate() != end.getDate())
            return D.el.fGroup.selectpicker('val', 'daily');
        return D.el.fGroup.selectpicker('val', 'hourly');
    }
}

function gaInit(){
    D.init();
}
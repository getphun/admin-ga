window.D = {
    _deviceChart: null,
    _realtimeChart: null,
    _realtimeChartTime: null,
    _realtimeChartTotal: 0,
    
    el: {},
    
    colors: [
        '#4BC0C0',
        '#FF6384',
        '#FFCD56',
        '#36A2EB',
        '#FF9F40'
    ],
    
    bgColors: [],
    
    alert: function(title, message){
        bootbox.alert({
            title: title,
            message: message
        });
    },
    
    init: function(){
        gapi.auth.setToken({access_token: MyGA.token});
        
        D.el.graphDevices = $('#graph-device');
        D.el.totalRealtime= $('#total-realtime');
        D.el.pagesList    = $('#list-pages');
        D.el.keywordsList = $('#list-keywords');
        D.el.sourcesList  = $('#list-sources');
        D.el.referralsList= $('#list-referrals');
        D.el.realtimeChart= $('#realtime-chart');
        
        D.el.graphDevices.attr({
            width: D.el.graphDevices.parent().width(),
            height: D.el.graphDevices.parent().width()
        });
        
        D.el.realtimeChart.attr({
            width: D.el.realtimeChart.parent().width(),
            height: 250
        });
        
        for(var i=0; i<D.colors.length; i++)
            D.bgColors.push(Chart.helpers.color(D.colors[i]).alpha(0.3).rgbString());
        
        D.genRealtime(0);
        D.fetch();
    },
    
    fetch: function(){
        var config = {
                path: 'https://www.googleapis.com/analytics/v3/data/realtime',
                method: 'GET',
                params: {
                    ids: 'ga:' + MyGA.view,
                    metrics: 'rt:activeUsers',
                    dimensions: 'rt:pagePath,rt:pageTitle,rt:deviceCategory,rt:keyword,rt:source,rt:referralPath'
                }
            };
        
        gapi.client.request(config).execute(function(res){
            $('#loader').remove();
            if(res.error)
                return D.alert('Google Analytics Error', res.error.message);
            
            D.genResult(res);
            setTimeout(D.fetch, 5000);
        });
    },
    
    genDevices: function(devices){
        
        if(!D._deviceChart){
            var ctx = D.el.graphDevices.get(0).getContext('2d');
            var config = {
                type: 'pie',
                data: {
                    datasets: [{
                        data: [],
                        backgroundColor: [],
                        label: 'Devies'
                    }],
                    labels: []
                },
                options: {
                    legend: {
                        display: false
                    }
                }
            }
            
            D._deviceChart = new Chart(ctx, config);
        }
        
        var types = Object.keys(devices);
        
        for(var i=0; i<types.length; i++){
            var type = types[i];
            var indexOf = D._deviceChart.data.labels.indexOf(type);
            
            if( indexOf == -1 ){
                var color = 
                        type == 'MOBILE' ? D.colors[0] :
                        type == 'DEKSTOP'? D.colors[1] :
                        type == 'TABLET' ? D.colors[2] : D.colors[3];
                
                D._deviceChart.data.labels.push(type);
                D._deviceChart.data.datasets[0].backgroundColor.push(color);
                D._deviceChart.data.datasets[0].data.push(devices[type]);
                
            }else{
                D._deviceChart.data.datasets[0].data[indexOf] = devices[type];
            }
        }
        
        D._deviceChart.update();
    },
    
    genKeywords: function(keywords){
        D.el.keywordsList.html('');
        var xkeywords = [];
        
        for(var k in keywords)
            xkeywords.push({total: keywords[k], label: k});
        
        xkeywords.sort(function(a,b){
            if(a.total != b.total)
                return b.total - a.total;
            return a.label < b.label ? -1 : 1;
        });
        
        for(var k in xkeywords){
            var key = xkeywords[k];
            
            var tr = $('<tr></tr>');
            D.el.keywordsList.append(tr);
            
            var td = $('<td></td>');
            td.appendTo(tr);
            
            var a = $('<a></a>');
            a.appendTo(td);
            a.attr({
                href: 'https://www.google.com/search?q='+key.label,
                target: '_blank',
                title: key.label
            });
            a.text(key.label);
            
            var td = $('<td></td>');
            td.appendTo(tr);
            td.text(key.total);
        }
    },
    
    genPages: function(pages){
        D.el.pagesList.html('');
        var xpages = [];
        for(var k in pages){
            var page = pages[k];
            page.url = k;
            xpages.push(page);
        }
        
        xpages.sort(function(a,b){
            if(b.total != a.total)
                return b.total - a.total;
            return a.url < b.url ? -1 : 1;
        });
        
        for(var i=0; i<xpages.length; i++){
            var page = xpages[i];
            
            var tr = $('<tr></tr>');
            tr.appendTo(D.el.pagesList);
            
            var td = $('<td></td>');
            td.appendTo(tr);
            var a = $('<a></a>');
            a.attr({ title: page.title, href: page.url, target: '_blank' });
            a.text(page.url||'(not set)');
            a.appendTo(td);
            
            var td = $('<td class="text-right"></td>');
            td.appendTo(tr);
            td.text(page.total);
        }
    },
    
    genRealtime: function(total){
        total = parseInt(total);
        
        D.el.totalRealtime.html( total );
        
        var label = Math.round((new Date).getTime() / 1000) - D._realtimeChartTime;
        if(label > 60){
            var lsec = label % 60;
            label = Math.floor(label/60)+':'+lsec;
        }
        
        if(!D._realtimeChart){
            if(total){
                var ctx = D.el.realtimeChart.get(0).getContext('2d');
                
                var preVal = [];
                var preDiff = [];
                var preLabel= [];
                
                for(var i=30; i>0; i--){
                    preVal.push(total);
                    preDiff.push(0);
                    preLabel.push('-'+i);
                }
                
                var config = {
                        type: 'line',
                        data: {
                            labels: preLabel,
                            datasets: [
                                {
                                    label: 'Realtime',
                                    backgroundColor: D.bgColors[0],
                                    borderColor: D.colors[0],
                                    data: preVal,
                                    fill: 'start',
                                    yAxisID: "y-axis-1"
                                },
                                {
                                    label: 'Increase',
                                    backgroundColor: D.bgColors[1],
                                    borderColor: D.colors[1],
                                    data: preDiff,
                                    fill: false,
                                    yAxisID: "y-axis-2"
                                }
                            ]
                        },
                        options: {
                            scales: {
                                xAxes: [
                                    {
                                        display: false
                                    },
                                    {
                                        ticks: {
                                            fontSize: 9
                                        }
                                    }
                                ],
                                yAxes: [
                                    {
                                        type: "linear",
                                        display: true,
                                        position: "left",
                                        id: "y-axis-1",
                                        ticks: {
                                            fontSize: 10,
                                            suggestedMin: (total-10),
                                            suggestedMax: (total+10)
                                        }
                                    },
                                    {
                                        type: "linear",
                                        display: true,
                                        position: "right",
                                        id: "y-axis-2",
                                        ticks: {
                                            fontSize: 10,
                                            suggestedMin: -5,
                                            suggestedMax: 5
                                        }
                                    }
                                ]
                            }
                        }
                    };
                
                D._realtimeChart = new Chart(ctx, config);
                D._realtimeChartTime = Math.round((new Date).getTime() / 1000);
                
            }
        }else{
            D._realtimeChart.data.labels.push( label );
            
            var diff = total - D._realtimeChartTotal;
            
            D._realtimeChart.data.datasets[1].data.push(diff);
            D._realtimeChart.data.datasets[0].data.push(total);
            
            D._realtimeChart.data.labels.shift();
            D._realtimeChart.data.datasets[1].data.shift();
            D._realtimeChart.data.datasets[0].data.shift();
            
            D._realtimeChart.update();
        }
        
        D._realtimeChartTotal = total;
    },
    
    genReferrals: function(refs){
        D.el.referralsList.html('');
        var xrefs = [];
        
        for(var k in refs)
            xrefs.push({total: refs[k], label: k});
        
        xrefs.sort(function(a,b){
            if(a.total != b.total)
                return b.total - a.total;
            return a.label < b.label ? -1 : 1;
        });
        
        for(var k in xrefs){
            var key = xrefs[k];
            
            var tr = $('<tr></tr>');
            D.el.referralsList.append(tr);
            
            var td = $('<td></td>');
            td.appendTo(tr);
            td.text(key.label);
            
            var td = $('<td></td>');
            td.appendTo(tr);
            td.text(key.total);
        }
    },
    
    genResult: function(res){
        var result = {
                pages: {},
                devices: {},
                keywords: {},
                sources: {},
                referrals: {}
            };
        
        if(!res.rows)
            return;
        
        for(var i=0; i<res.rows.length; i++){
            var row = res.rows[i];
            row[6] = parseInt(row[6]);
            
            if(!result.pages[row[0]])
                result.pages[row[0]] = { title: '', total: 0 };
            if(!result.pages[row[0]].title && '(not set)' != row[1])
                result.pages[row[0]].title = row[1];
            result.pages[row[0]].total+= row[6];
            
            if(!result.devices[row[2]])
                result.devices[row[2]] = 0;
            result.devices[row[2]]+= row[6];
            
            if(row[3] && '(not provided)' != row[3] && '(not set)' != row[3]){
                if(!result.keywords[row[3]])
                    result.keywords[row[3]] = 0;
                result.keywords[row[3]]+= row[6];
            }
            
            if(row[4] && '(direct)' != row[4]){
                if(!result.sources[row[4]])
                    result.sources[row[4]] = 0;
                result.sources[row[4]]+= row[6];
            }
            
            if(row[5] && '(not set)' != row[5]){
                if(!result.referrals[row[5]])
                    result.referrals[row[5]] = 0;
                result.referrals[row[5]]+= row[6];
            }
        }
        
        D.genPages(result.pages);
        D.genDevices(result.devices);
        D.genKeywords(result.keywords);
        D.genSources(result.sources);
        D.genReferrals(result.referrals);
        D.genRealtime(res.totalsForAllResults['rt:activeUsers']);
    },
    
    genSources: function(sources){
        D.el.sourcesList.html('');
        var xsources = [];
        
        for(var k in sources)
            xsources.push({total: sources[k], label: k});
        
        xsources.sort(function(a,b){
            if(a.total != b.total)
                return b.total - a.total;
            return a.label < b.label ? -1 : 1;
        });
        
        for(var k in xsources){
            var key = xsources[k];
            
            var tr = $('<tr></tr>');
            D.el.sourcesList.append(tr);
            
            var td = $('<td></td>');
            td.appendTo(tr);
            td.text(key.label);
            
            var td = $('<td></td>');
            td.appendTo(tr);
            td.text(key.total);
        }
    }
}

function gaInit(){
    D.init();
}
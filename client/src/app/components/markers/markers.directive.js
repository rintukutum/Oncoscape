(function( $, undefined ) {

$.widget("ui.dragslider", $.ui.slider, {
    
    options: $.extend({},$.ui.slider.prototype.options,{rangeDrag:false}),
    
    _create: function() {
      $.ui.slider.prototype._create.apply(this,arguments);
      this._rangeCapture = false;
    },
    
    _mouseCapture: function( event ) { 
      var o = this.options;

      if ( o.disabled ) return false;
    
      if(event.target == this.range.get(0) && o.rangeDrag == true && o.range == true) {
        this._rangeCapture = true;
        this._rangeStart = null;
      }
      else {
        this._rangeCapture = false;
      }
      
      $.ui.slider.prototype._mouseCapture.apply(this,arguments);

      if(this._rangeCapture == true) {  
          this.handles.removeClass("ui-state-active").blur();   
      }
      
      return true;
    },
    
    _mouseStop: function( event ) {
      this._rangeStart = null;
      return $.ui.slider.prototype._mouseStop.apply(this,arguments);
    },
    
    _slide: function( event, index, newVal ) {
      if(!this._rangeCapture) { 
        return $.ui.slider.prototype._slide.apply(this,arguments);
      }
      
      if(this._rangeStart == null) {
        this._rangeStart = newVal;
      }
      
      var oldValLeft = this.options.values[0],
          oldValRight = this.options.values[1],
          slideDist = newVal - this._rangeStart,
          newValueLeft = oldValLeft + slideDist,
          newValueRight = oldValRight + slideDist,
          allowed;
      
      if ( this.options.values && this.options.values.length ) {
        if(newValueRight > this._valueMax() && slideDist > 0) {
          slideDist -= (newValueRight-this._valueMax());
          newValueLeft = oldValLeft + slideDist;
          newValueRight = oldValRight + slideDist;
        }
        
        if(newValueLeft < this._valueMin()) {
          slideDist += (this._valueMin()-newValueLeft);
          newValueLeft = oldValLeft + slideDist;
          newValueRight = oldValRight + slideDist;
        }

        if ( slideDist != 0 ) {
          newValues = this.values();
          newValues[ 0 ] = newValueLeft;
          newValues[ 1 ] = newValueRight;
          
          // A slide can be canceled by returning false from the slide callback
          allowed = this._trigger( "slide", event, {
            handle: this.handles[ index ],
            value: slideDist,
            values: newValues
          } );
          
          if ( allowed !== false ) {
            this.values( 0, newValueLeft, true );
            this.values( 1, newValueRight, true );
          }
          this._rangeStart = newVal;
        }
      }
      
      
     
    },
    
    
    /*
    //only for testing purpose
    value: function(input) {
        console.log("this is working!");
        $.ui.slider.prototype.value.apply(this,arguments);
    }
    */
});

})(jQuery);
(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osMarkers', markers);

    /** @ngInject */
    function markers() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/markers/markers.html',
            scope: {},
            controller: MarkersController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function MarkersController(osApi, $state, $timeout, $scope, $stateParams, cytoscape, signals, $window, _) {

            if (angular.isUndefined($stateParams.datasource)){
                $state.go("datasource");
                return;
            }

            // Elements
            var cyChart;
            var elChart = angular.element(".markers-chart");
            var cohortPatient = osApi.getCohortPatient();
            var cohortGene = osApi.getCohortGene();

            // Initialize View Model
            var vm = initializeViewModel(this, $stateParams);

            vm.resize = function(){
                var width = $window.innerWidth
                if (angular.element(".tray").attr("locked")=="true") width -= 300;
                elChart.width( width );
                elChart.height($window.innerHeight - 90);
                if (cyChart) cyChart.resize();
            }

            // Listen For Resize
            angular.element($window).bind('resize', 
                _.debounce(vm.resize, 300)
            );
       
            // Load Data
            osApi.setBusy(true);
            loadData(osApi, vm, function(data){

                // Resize
                vm.resize();

                // Initalize Styles
                var styles = initializeStyles();

                // Initialize Chart
                cyChart = initializeChart(data, styles, cytoscape, angular.element("#markers-chart"));

                // Initialize Cohorts
                initializeCohort(cyChart, vm, osApi, cohortPatient, cohortGene, $scope);

                // Initialize Layouts
                initializeLayouts(cyChart, vm, $scope);

                // Initialize Node Colors
                initializeNodeColors(cyChart, vm, $scope, osApi);

                // Initialize Edge Colors
                initializeEdgeColors(cyChart, vm, $scope, $timeout);

                // Initialize Events
                initializeEvents(cyChart, vm, $scope, $timeout, osApi, signals);

                // Initalize Search
                initializeSearch(cyChart, vm, $scope)

                // Initialize Zoom
                initializeZoom(cyChart, _);
                
                // Ready
                osApi.setBusy(false);
            });
        }

        function initializeSearch(chart, vm, $scope){

            // Search Gene Textbox
            $scope.$watch("vm.searchGene", function(){
                if (angular.isUndefined(vm.searchGene)){
                    vm.geneSearchResult = "";
                    return;
                } 
                chart.startBatch();
                var matches = {found:0};
                chart.nodes('node[nodeType="gene"]')
                    .forEach(function(ele){
                        if (vm.searchGene=="") { ele.deselect(); return; }
                        if (ele.data().name.toLowerCase().indexOf(vm.searchGene.toLowerCase())==0){
                            ele.select(); 
                            this.found += 1;
                        }else{
                            ele.deselect();
                        }
                    }, matches);
                chart.endBatch();
                if (vm.searchGene=="") vm.searchGeneResult = "";
                else vm.searchGeneResult = "("+matches.found +" Matches)"
            });

            // Search Patient Textbox
            $scope.$watch("vm.searchPatient", function(){
                if (angular.isUndefined(vm.searchPatient)) return;
                chart.startBatch();
                var matches = {found:0};
                chart.nodes('node[nodeType="patient"]')
                    .forEach(function(ele){
                        if (vm.searchPatient=="") { ele.deselect(); return; }
                        if (ele.data().id.toLowerCase().indexOf(vm.searchPatient.toLowerCase())==0){
                            ele.select()
                            this.found += 1;
                        }else{
                            ele.deselect();
                        }
                }, matches);
                chart.endBatch();
                if (vm.searchPatient=="") vm.searchPatientResult = "";
                else vm.searchPatientResult = "("+matches.found +" Matches)"
            });
        }
            
        function initializeViewModel(vm, $stateParams){
            vm.datasource = $stateParams.datasource;
            vm.optInteractiveModes;
            vm.optInteractiveMode;
            vm.optPatientLayouts;
            vm.optPatientLayout;
            vm.optNodeColors;
            vm.optNodeColor;
            vm.optEdgeColors;
            vm.legandNodes;
            vm.legandPatient;
            vm.legandChromosomes;
            vm.searchGene;
            vm.searchGeneResult = "";
            vm.searchPatient;
            vm.searchPatientResult = "";
            vm.optCohortModes;
            vm.optCohortMode = "";
            vm.optCohortPatients;
            vm.optCohortPatient;
            vm.optCohortGenes;
            vm.optCohortGene;
            vm.frame;
            return vm;
        }

        function initializeCohort(chart, vm, osApi, cohortPatient, cohortGene, $scope){
            vm.optCohortModes = [{name:"Highlight Cohort"},{name:"Subset Cohort"}];
            vm.optCohortMode = vm.optCohortModes[0];
            vm.optCohortPatients = cohortPatient.get();
            vm.optCohortPatient = vm.optCohortPatients[0];
            vm.optCohortGenes = cohortGene.get();
            vm.optCohortGene = vm.optCohortGenes[0];

            vm.addCohortGene = function(e){
                var cohortName = "P+M " + moment().format('- H:mm - M/D/YY');
                var cohortIds = chart.$('node[nodeType="gene"]:selected').map(function(ele){ return ele.data().id.toUpperCase() });
                var cohort = {name:cohortName, ids:cohortIds};
                vm.optCohortGenes.push(cohort);
                vm.optCohortGene = cohort;
            }
            vm.addCohortPatient = function(e){
                var cohortName = "P+M " + moment().format('- H:mm - M/D/YY');
                var cohortIds = chart.$('node[nodeType="patient"]:selected').map(function(ele){ return ele.data().id.toUpperCase() });
                var cohort = {name:cohortName, ids:cohortIds};
                vm.optCohortPatients.push(cohort);
                vm.optCohortPatient = cohort;
            }

            var drawPatients = function(){
                var degmap = {};
                var highlight = (vm.optCohortMode.name=="Highlight Cohort");
                chart.startBatch();

                if (vm.optCohortPatient.ids=="*"){
                    chart.$('node[nodeType="patient"]:selected')
                        .forEach( function(ele){
                            ele.deselect();
                            degmap[ele.id()] = {display:'element'};
                        }, degmap);
                }else{
                    chart.$('node[nodeType="patient"]')
                        .forEach( function(ele){
                            if (this.ids.indexOf(ele.id())>=0){
                                ele.select();
                                this.degmap[ele.id()] = {display:'element'};
                            }else{
                                ele.deselect();
                                this.degmap[ele.id()] = {display: (highlight) ? 'element' : 'none' };
                            }
                        }, {degmap:degmap, ids:vm.optCohortPatient.ids} );
                }
                chart.batchData(degmap);
                chart.endBatch();
            };
            var drawGenes = function(){
                var degmap = {};
                var highlight = (vm.optCohortMode.name=="Highlight Cohort");
                chart.startBatch();

                if (vm.optCohortGene.ids=="*"){
                    chart.$('node[nodeType="gene"]:selected')
                        .forEach( function(ele){
                            ele.deselect();
                            degmap[ele.id()] = {display:'element'};
                        }, degmap);
                }
                else{
                    chart.$('node[nodeType="gene"]')
                        .forEach( function(ele){
                            if (this.ids.indexOf(ele.id())>=0){
                                ele.select()
                                this.degmap[ele.id()] = {display:'element'};
                            }else{
                                ele.deselect();
                                this.degmap[ele.id()] = {display: (highlight) ? 'element' : 'none' }
                            }
                        }, {degmap:degmap, ids:vm.optCohortGene.ids} );
                }
                chart.batchData(degmap);
                chart.endBatch();
            };

            var drawMode = function(){
                drawPatients();
                drawGenes();
            }

            // What Scope To Initialize Behaviors
            $scope.$watch("vm.optCohortPatient", drawPatients );
            $scope.$watch("vm.optCohortGene", drawGenes );
            $scope.$watch("vm.optCohortMode", drawMode );

        }

        function initializeChart(data, styles, cytoscape, el){
            // Initalize Cytoscape Chart
            // If performance becomes an issue set *Viewport attributes to true
            return cytoscape({
                container: el,
                elements: data,
                style: styles,
                hideEdgesOnViewport: false,
                hideLabelsOnViewport: false,
                textureOnViewport: false,
                motionBlur: true,
                minZoom: 0.0001,
                maxZoom: 40,
                layout: {
                    name: "preset",
                    fit: true
                }
            });
        }

        function initializeStyles(){
            // Unlike CSS order of operations is determined by order
            // Play specific attention to use of data() + mapdata() values they are dynamic
            // Care should be taken not to update styles directly in code, but to use underlying data model
            // Cytoscape Dynamic Style Properties Include
            /*
                display
                color
                sizeEle
                sizeLbl
                posX
                posY
                hobo
                patient
            */
            return [
            {
                selector: 'node',
                style: {
                    'display': "data(display)",
                    'height': "mapData(sizeEle, 0, 50, 10, 100)",
                    'width': "mapData(sizeEle, 0, 50, 10, 100)",
                    'font-size': 'data(sizeLbl)',
                    'text-valign': 'center'
                }
            }, {
                selector: 'node[nodeType="patient"]',
                style: {
                    'background-color': 'data(color)',
                    'text-halign': 'center',
                    'border-width': 'data(sizeBdr)',
                    'border-color': 'data(color)'
                }
            }, {
                selector: 'node[nodeType="patient"]:selected',
                style: {
                    'border-color': "#FF0000"
                }
            }, {
                selector: 'node[nodeType="gene"]',
                style: {
                    'background-color': "#FFFFFF",
                    'border-color': "#38347b",
                    'text-halign': "right",
                    'label': "data(id)",
                    'border-width': 'data(sizeBdr)'
                }
            }, {
                selector: 'node[nodeType="gene"]:selected',
                style: {
                    'border-color': "#FF0000"
                }
            },{
                selector: 'node[nodeType="centromere"]',
                style:{
                    'font-size': '24px',
                    'text-halign': 'center',
                    'background-color': "#3993fa",
                    'color':"#FFFFFF",
                    'border-color': 'rgb(19, 150, 222)',
                    'height': '40px',
                    'width': '120px',
                    'shape': 'roundrectangle',
                    'label': "  data(id)"
                }
            },{
                selector: 'edge',
                style:{
                    'display': "data(display)",
                    'line-color': "data(color)",
                    'width': "data(sizeEle)"
                }
            }];
        }

        function initializeEvents(chart, vm, $scope, $timeout, osApi, signals){

            // Create Signals
            var events = (function(signals) {
                var geneOver = new signals.Signal();
                var geneOut = new signals.Signal();
                var geneClick = new signals.Signal();
                var patientOver = new signals.Signal();
                var patientOut = new signals.Signal();
                var patientClick = new signals.Signal();
                var removeAll = function() {
                    geneOver.removeAll();
                    geneOut.removeAll();
                    patientOver.removeAll();
                    patientOut.removeAll();
                    geneClick.removeAll();
                    patientClick.removeAll();
                }
                var over = function(e) {
                    geneOver.add(e);
                    patientOver.add(e);
                };
                var out = function(e) {
                    geneOut.add(e);
                    patientOut.add(e);
                }
                var click = function(e) {
                    geneClick.add(e);
                    patientClick.add(e);
                }
                return {
                    geneOver: geneOver,
                    geneOut: geneOut,
                    geneClick: geneClick,
                    patientOver: patientOver,
                    patientOut: patientOut,
                    patientClick: patientClick,
                    over: over,
                    out: out,
                    click: click,
                    removeAll: removeAll
                };
            })(signals);

            // Attach Event Signals To Real Events
            chart
                .on('click', 'node[nodeType="gene"]', events.geneClick.dispatch)
                .on('click', 'node[nodeType="patient"]', events.patientClick.dispatch)
                .on('mouseover', 'node[nodeType="gene"]', events.geneOver.dispatch)
                .on('mouseover', 'node[nodeType="patient"]', events.patientOver.dispatch)
                .on('mouseout', 'node[nodeType="gene"]', events.geneOut.dispatch)
                .on('mouseout', 'node[nodeType="patient"]', events.patientOut.dispatch);

            // Cache Hide All Edges Structure
            var hidePatientEdges = {};
            chart.$('edge[edgeType!="chromosome"]')
                .forEach(function(node){ this[node.id()] = { display: 'none' };}, hidePatientEdges);
                    
            // Define Behaviors
            var behaviors = {
                showPatientInfo: function(e){
                    if (e.cyTarget.data().nodeType == 'patient') {
                        $scope.$apply(function() {
                            vm.patient = e.cyTarget.attr('patient');
                            vm.patientChromosomes = e.cyTarget.neighborhood("node")
                                .map(function(item) { return item.data().id });
                        });
                    }
                    return this;
                },
                hidePatientInfo: function(){
                    $scope.$apply(function() {
                        vm.patient = vm.patientChromosomes = null;
                    });
                    return this;
                },
                showDegreeOne: function(e){
                    var degmap = {};
                    e.cyTarget.neighborhood('edge')
                        .forEach(function(item){
                            this[item.id()] = {display:'element'};
                        }, degmap);
                    chart.batchData(degmap);
                },
                hideDegreeOne: function(e){
                    var degmap = {};
                    e.cyTarget.neighborhood('edge')
                        .forEach(function(item){
                            this[item.id()] = {display:'none'};
                        }, degmap);
                    chart.batchData(degmap);
                },
                showDegreeTwo: function(e){
                    var degmap = {};
                    e.cyTarget.neighborhood('node')
                        .forEach(function(node){
                            node.neighborhood('edge')
                                .forEach(function(item){
                                    this[item.id()] = {display:'element'};
                            }, this);
                        }, degmap);
                    chart.batchData(degmap);
                },
                hideDegreeTwo: function(e){
                    var degmap = {};
                    e.cyTarget.neighborhood('node')
                        .forEach(function(node){
                            node.neighborhood('edge')
                                .forEach(function(item){
                                    this[item.id()] = {display:'none'};
                            }, this);
                        }, degmap);
                    chart.batchData(degmap);
                },
                showOncoPrint: function(){
                    /*
                    var ds = vm.datasource;
                    if (ds=="DEMOdz") return;
                    if (ds.indexOf("TCGA" == 0)) {
                        var cbioDsName = ds.substr(4) + "_tcga";
                        var genes = e.cyTarget.neighborhood('node').map(function(n) {
                            return n.data().name;
                        }).join("+");
                        var url = "http://www.cbioportal.org/ln?cancer_study_id=" + cbioDsName + "&q=" + genes;
                        $scope.$apply(function() {
                            $window.open(url);
                        });
                    }
                    */
                }
            }

            // Use States To Associate Events + Behaviors
            var states = [{
                name: 'Hide All',
                register: function() {
                    events.click(function(e) {
                        behaviors
                            .showOncoPrint(e)
                    });
                    events.over(function(e) {
                        behaviors
                            .showPatientInfo(e)
                    });
                    events.out(function(e) {
                        behaviors
                            .hidePatientInfo(e)
                    });
                },
                unregister: function() {
                    events.removeAll();
                }
            }, {
                name: 'Show All',
                register: function() {
                    events.click(function(e) {
                        behaviors
                            .showOncoPrint(e)
                    });
                    events.over(function(e) {
                        behaviors
                            .showPatientInfo(e)
                    });
                    events.out(function(e) {
                        behaviors
                            .hidePatientInfo(e)
                    });

                    // Show all Edges
                    var degmap = {};
                    chart.$('edge[edgeType!="chromosome"]')
                        .forEach(function(node){
                            this[node.id()] = { display: 'element' };
                        }, degmap);
                    chart.batchData(degmap);
                },
                unregister: function() {
                    events.removeAll();

                    // Hide All Edges
                    chart.batchData(hidePatientEdges);
                }
            },{
                name: '1° When Selected',
                register: function(){

                    var degmap = {};
                    chart.$('node[nodeType="patient"]:selected')
                        .forEach(function(node) {
                            node.neighborhood('edge').forEach( function(edge) {
                                this[edge.id()] = { display: 'element' };
                            }, degmap)
                        }, degmap);
                    chart.batchData(degmap);


                    chart.on('select', 'node', function(e){
                        behaviors.showDegreeOne(e);
                    });
                    chart.on('unselect','node',function(e){
                        behaviors.hideDegreeOne(e);
                    });
                },
                unregister: function(){

                    // Hide All Edges
                    chart.batchData(hidePatientEdges);
                    chart.off('select', 'node');
                    chart.off('unselect', 'node');
                }

            },{
                name: '2° When Selected',
                register: function(){
                    var degmap = {};
                    chart.$('node[nodeType="patient"]:selected')
                        .forEach(function(node){
                            node.neighborhood('node')
                                .forEach(function(node){
                                    node.neighborhood('edge')
                                        .forEach(function(item){
                                            this[item.id()] = {display:'element'};
                                        }, this)
                                }, this)
                        }, degmap);
                    chart.batchData(degmap);
                    
                    chart.on('select', 'node', function(e){
                        behaviors.showDegreeTwo(e);
                    });
                    chart.on('unselect','node',function(e){
                        behaviors.hideDegreeTwo(e);
                    });
                },
                unregister: function(){

                    // Hide All Edges
                    chart.batchData(hidePatientEdges);
                    chart.off('select', 'node');
                    chart.off('unselect', 'node');
                }

            },{
                name: '1° On Mouse Over',
                register: function() {
                    events.click(function(e) {
                        behaviors
                            .showOncoPrint(e)
                    });
                    events.over(function(e) {
                        behaviors
                            .showPatientInfo(e)
                            .showDegreeOne(e)
                        
                    });
                    events.out(function(e) {
                        behaviors
                            .hidePatientInfo(e)
                            .hideDegreeOne(e)
                    });
                },
                unregister: function() {
                    events.removeAll();
                }
            }, {
                name: '2° On Mouse Over',
                register: function() {
                    events.click(function(e) {
                        behaviors
                            .showOncoPrint(e)
                    });
                    events.over(function(e) {
                        behaviors
                            .showPatientInfo(e)
                            .showDegreeTwo(e)
                    });
                    events.out(function(e) {
                        behaviors
                            .hidePatientInfo(e)
                            .hideDegreeTwo(e)                           
                    });
                },
                unregister: function() {
                    events.removeAll();
                }
            }];

            vm.optInteractiveModes = states;
            vm.optInteractiveMode = vm.optInteractiveModes[0];

            // What Scope To Initialize Behaviors
            $scope.$watch("vm.optInteractiveMode", function(next, prev) {
                if (angular.isDefined(prev)) prev.unregister();
                if (angular.isDefined(next)) next.register();
            });
        }

        function initializeEdgeColors(chart, vm, $scope, $timeout){

            // Set Edge Options
            var colors = [{ 
                    name: 'mutation',
                    class: 'edgeMutation',
                    color: '#004358',
                    state: 'Highlight'
                }, {
                    name: 'cnGain.1',
                    class: 'edgeCnGain1',
                    color: '#1F8A70',
                    state: 'Highlight'
                }, {
                    name: 'cnLoss.1',
                    class: 'edgeCnLoss1',
                    color: '#BEDB39',
                    state: 'Highlight'
                }, {
                    name: 'cnGain.2',
                    class: 'edgeCnGain2',
                    color: '#FFE11A',
                    state: 'Highlight'

                }, {
                    name: 'cnLoss.2',
                    class: 'edgeCnLoss2',
                    color: '#FD7400',
                    state: 'Highlight'
                }];
            var colorMap = {
                'mutation' : colors[0],
                'cnGain.1' : colors[1],
                'cnLoss.1' : colors[2],
                'cnGain.2' : colors[3],
                'cnLoss.2' : colors[4]
            };

            // Default colors
            $timeout(function(){
                colors.forEach(function(item){
                    angular.element("." + item.class).css("border-color", item.color);
                });
                var degmap = {};
                chart.edges('edge[edgeType!="chromosome"]')
                    .forEach(function(edge){
                        this[edge.id()] = {color:colorMap[edge.data("edgeType")].color};
                    }, degmap);
                chart.batchData(degmap);
            });

            vm.optEdgeColors = colors;

            // Update Edge Callback
            vm.updateEdge = function(item){
                var color, state;
                switch (item.state){
                    case "Highlight":
                        item.state = "Show";
                        color = '#3993fa';
                        state = {color:color};
                        break;
                    case "Show":
                        item.state = "Hide";
                        color = '#EEEEEE';
                        state = {color:'#FFF'};
                        break;
                    default:
                        item.state = "Highlight";
                        color = item.color;
                        state = {color:color};
                        break;
                }

                // Set Legand color
                angular.element("." + item.class).css("border-color", color );

                // update Degree Map
                var degmap = {};
                chart.edges('edge[edgeType="'+item.name+'"]')
                    .forEach(function(edge){
                        this.degmap[edge.id()] = this.state;
                    }, {degmap:degmap, state:state});
                chart.batchData(degmap);

            }
        }

        function initializeZoom(chart, _){
            chart.on('pan', _.debounce(function(e) {
                var zoom = Math.max(e.cy.zoom(), 1);
                var degmap = {};
                var font = Math.ceil(Math.max(12/zoom, 1));
                var sizeBdr = Math.ceil(Math.max(5/zoom, .5));
                chart.nodes().forEach(function(node){
                    this.degmap[node.id()] = {
                        sizeEle: (node.degree()/this.zoom),
                        sizeLbl: font,
                        sizeBdr:sizeBdr
                    };
                }, { degmap:degmap, zoom:zoom, font:font, sizeBdr:sizeBdr });
                chart.batchData(degmap);
            }, 300));
        }

        function initializeNodeColors(chart, vm, $scope, osApi){
            
            osApi.getSampleCategorizationNames().then(function(response) {
                var optNodeColors =  [{name: 'Hobo'},{name: 'Gender'},{name: 'Age At Diagnosis'}];
                if (angular.isDefined(response.payload.length)){
                    optNodeColors.concat( response.payload
                        .map(function(item) { return {'name': item} }));

                }
                vm.optNodeColors = optNodeColors;
                vm.optNodeColor = vm.optNodeColors[0];

                $scope.$watch("vm.optNodeColor", function(){
                    var degmap = {};
                    switch(vm.optNodeColor.name){
                        case "Hobo":
                            vm.legandNodes = [{name:'Patients', color:'#3993fa'}];
                            chart.$('node[nodeType="patient"]')
                                .forEach(function(node){
                                    degmap[node.id()] = {color:'#3993fa'};
                                });
                            break;
                        case "Gender":
                            vm.legandNodes = [{name:'Male', color:'blue'}, {name:'Female', color:'pink'}];
                            chart.$('node[nodeType="patient"]')
                                .forEach(function(node){
                                    try{
                                        var gender = node.data("patient")[0][2];
                                        degmap[node.id()] = {color: (gender==='male') ? 'rgb(5, 108, 225)' :  'pink' };
                                    }catch(e){
                                        degmap[node.id()] = {color: '#EEEEEE'};
                                    }
                                });
                            break;
                        case "Age At Diagnosis":
                            vm.legandNodes = [{name:'Young', color:'green'}, {name:'Old', color:'red'}];
                            chart.$('node[nodeType="patient"]')
                                .forEach(function(node){
                                    try{
                                        var age = Number(node.data("patient")[0][4]);
                                        degmap[node.id()] = {color: 'rgb(' + ((255 * age) / 100) + ',' + ((255 * (100 - age)) / 100) + ',0)' };
                                    }catch(e){
                                        degmap[node.id()] = {color: '#000000'};
                                    }
                                });
                            break;
                        default:
                            osApi.getSampleCategorization(vm.optNodeColor.name).then(function(response) {
                                vm.legandNodes = response.payload.tbl
                                    .map(function(e) {return e[0] + "|" + e[1]; })
                                    .filter(function(v, i, s) { return s.indexOf(v) === i; })
                                    .map(function(e) { var p = e.split("|");
                                        return { 'name': p[0], 'color': p[1] } });

                                    var rows = response.payload.rownames;
                                    var tbl = response.payload.tbl;
                                    var degmap = {};
                                    var nodes = chart.$('node[nodeType="patient"]');
                                    // Revisit This.  Would be faster to not loop.
                                    for (var i=0; i<nodes.length; i++){
                                        var id = nodes[i].id();
                                        degmap[id] = {color:'#DDDDDD'}
                                        for (var ii=0; ii<rows.length; ii++){
                                            if (id==rows[ii]){
                                                degmap[id] = {color:tbl[ii][1]}
                                                break;
                                            }
                                        }
                                    }
                                });
                            break;
                        }
                        chart.batchData(degmap);
                    });

            });
        }

        function initializeLayouts(chart, vm, $scope){
            vm.optPatientLayouts = [{name: 'Hobo'},{name: 'Age At Diagnosis'},{name: 'Gender'}];
            vm.optPatientLayout = vm.optPatientLayouts[0];
            $scope.$watch('vm.optPatientLayout', function(layout){                
                var nodes = chart.nodes('node[nodeType="patient"]');
                chart.startBatch();
                switch (layout.name){

                    // Hobo Chart Positions Are Sent From Server In Initial Dataset + Cached Load
                    case "Hobo":
                        nodes.forEach(function(node){ 
                            node.position(node.data("hobo")); 
                        });
                        break;

                    // Age At Dx Comes From Patient Table
                    case "Age At Diagnosis":
                        nodes.forEach(function(node){
                            try{
                                var age = Number(node.data("patient")[0][4]);
                                age = age.map(0, 100, -3000, 3000);
                                node.position({
                                    y: age, 
                                    x: (Math.pow(age, 2) / 5000) - 200
                                });
                            }catch(e){
                                node.position({x:100,y:0});
                            }
                        });
                        break;

                    // Gender Comes From Patient Table
                    case "Gender":
                        nodes
                            .filter(function(index, node){
                                try{ return (node.data("patient")[0][2].toLowerCase()=='male')}
                                catch(e){ return false; }
                            })
                            .forEach(function(node, index){
                                var a = 400;
                                var b = 400;
                                var angle = 0.1 * (index+1);
                                var x = -1000 + (a+b * angle) * Math.cos(angle);
                                var y = -1200 + (a+b * angle) * Math.sin(angle);
                                node.position({
                                    x: x,
                                    y: y
                                });
                            });
                        nodes
                            .filter(function(index, node){
                                return angular.isUndefined(node.data("patient")[0])
                            })
                            .forEach(function(node, index){
                                var a = 400;
                                var b = 400;
                                var angle = 0.1 * (index+1);
                                var x = -2500 + (a+b * angle) * Math.cos(angle);
                                var y = 0 + (a+b * angle) * Math.sin(angle);
                                node.position({
                                    x: x,
                                    y: y
                                });
                            });
                        nodes
                            .filter(function(index, node){
                                try{ return (node.data("patient")[0][2].toLowerCase()=='female')}
                                catch(e){ return false; }
                            })
                            .forEach(function(node, index){
                                var a = 400;
                                var b = 400;
                                var angle = 0.1 * (index+1);
                                var x = -1000 + (a+b * angle) * Math.cos(angle);
                                var y = 1200 + (a+b * angle) * Math.sin(angle);
                                node.position({
                                    x: x,
                                    y: y
                                });
                            });
                        break;
                }
                chart.endBatch();
            });
        }

        function loadData(osApi, vm, cb){
            // Today multiple nested data calls are nessisary to obtain all the data to render the chart
            // Future server refactor should be done to limit number of calls and preformat data
            osApi.setDataset(vm.datasource).then(function() {

                // Patient Data
                osApi.getPatientHistoryTable(vm.datasource).then(function(response) {
                    var dataPatients = response.payload.tbl;

                    // Marker Data
                    osApi.getMarkersNetwork(response.payload).then(function(response) {
                        var dataMarkers = angular.fromJson(response.payload).elements;

                        // Process Patient Nodes (Save Hobo Positions + Patient History Info + Color + SizeEle + SizeLbl)
                        dataMarkers.nodes
                            .filter(function(item) { return item.data.nodeType === 'patient'; })
                            .map(function(value) {
                                var data = value.data;
                                data.display = "element";
                                data.color = "rgb(19, 150, 222)";
                                data.sizeEle = data.degree;
                                data.sizeLbl = 12;
                                data.sizeBdr = 5;
                                data.hobo = {x: value.position.x, y: value.position.y};
                                data.patient = this.filter(function(item){ return item[0]===value.data.id });
                            }, dataPatients);

                        // Process Non Patient Nodes
                        dataMarkers.nodes
                            .filter(function(item) {  return  item.data.nodeType != 'patient'; })
                            .map(function(value){
                                var data = value.data;
                                data.display = "element";
                                data.color = "rgb(19, 150, 222)";
                                data.sizeEle = data.degree;
                                data.sizeLbl = 12;
                                data.sizeBdr = 5;
                                value.locked = true;
                                value.selectable = true;
                                value.grabbable = false;
                                return value;
                            });

                        // Process Edges
                        dataMarkers.edges
                            .map(function(value){
                                var data = value.data;
                                data.display = (data.edgeType=="chromosome") ? "element" : "none";
                                data.color = "rgb(19, 150, 222)";
                                data.sizeEle = 3;
                                data.sizeLbl = 12;
                                value.locked = true;
                                value.selectable = false;
                                value.grabbable = false;
                                return value;
                            });

                        // Call Back
                        cb(dataMarkers);
                    });
                });
            });
        }
    }
})();

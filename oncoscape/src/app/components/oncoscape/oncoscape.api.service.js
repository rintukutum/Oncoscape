(function() {
    'use strict';

    angular
        .module('oncoscape')
        .service('osApi', oncoscape);

    /** @ngInject */
    function oncoscape(osSocket, $http) {

        // Functions to move during refactor
        this.setBusy = setBusy;
        this.setBusyMessage = setBusyMessage;
        this.login = login;
        this.setDataset = setDataset;

        // Valid functions
        this.getDomains = getDomains;
        this.getDataSetNames = getDataSetNames;
        this.getDataManifest = getDataManifest;
        this.getPatientHistoryTable = getPatientHistoryTable;
        this.getPatientHistoryDxAndSurvivalMinMax = getPatientHistoryDxAndSurvivalMinMax;
        this.getSampleDataFrame = getSampleDataFrame;
        this.getGeneSetNames = getGeneSetNames;
        this.getSampleCategorizationNames = getSampleCategorizationNames;
        this.getSampleCategorization = getSampleCategorization;
        this.getMarkersNetwork = getMarkersNetwork;
        this.getPathway = getPathway;
        this.getDrugGeneInteractions = getDrugGeneInteractions;
        this.getCanonicalizePatientIDsInDataset = getCanonicalizePatientIDsInDataset;
        this.getGeneSetGenes = getGeneSetGenes;
        this.getOncoprintDataSelection = getOncoprintDataSelection;
        this.getPCA = getPCA;
        this.getCalculatedPCA = getCalculatedPCA;
        this.getPLSR = getPLSR;
        this.getCalculatedPLSR = getCalculatedPLSR;
        this.getSummarizedPLSRPatientAttributes = getSummarizedPLSRPatientAttributes;
        this.getCalculatedSurvivalCurves = getCalculatedSurvivalCurves;
        this.getTimelines = getTimelines;
        this.getCalculatedTimelines = getCalculatedTimelines;

        function login(user) {
            var req = {
                method: 'POST',
                url: 'http://localhost/login/',
                data: {username:user.name, password:user.password, domain:user.domain.name}
            };
            return $http(req).then(function(res){
                if (res.data.success){
                    user.authenticated = true;
                    user.token = res.data.token;
                }else{
                    user.authenticated = false;
                    user.token = null;
                }
            });
        }
        
        function setBusy(value){

            if (value){
                $(".loader-modal").show();
            }else{
                $(".loader-modal").hide();
            }
            return setBusyMessage;
        }
        function setBusyMessage(value){
            //console.log(value);
        }

        function getDomains() {
            return [
                {"name": "Guest"},
                {"name": "FHCRC"},
                {"name": "SCCA"}
            ];
        }
        function setDataset(dataset){
            return osSocket.request({cmd: "specifyCurrentDataset", payload: dataset });
        }
        function getDataSetNames() {
            return osSocket.request({cmd: "getDataSetNames"});
        }
        function getDataManifest(dataset) {
            return osSocket.request({cmd: "getDataManifest", payload:dataset});
        }
        function getPatientHistoryTable(dataset) {
            return osSocket.request({cmd: "getPatientHistoryTable", payload:{datasetName: dataset, durationFormat: "byYear"}});
        }

        function getPatientHistoryDxAndSurvivalMinMax() {}

        function getSampleDataFrame() {}

        function getGeneSetNames() {
            return osSocket.request({cmd:"getGeneSetNames"});
        }

        function getSampleCategorizationNames() {}

        function getSampleCategorization() {}

        function getMarkersNetwork() {}

        function getPathway() {}

        function getDrugGeneInteractions() {}

        function getCanonicalizePatientIDsInDataset() {}

        function getGeneSetGenes() {}

        function getOncoprintDataSelection() {}

        function getPCA() {}

        function getCalculatedPCA() {}

        function getPLSR(dataPackage, matrixName) {
            var payload = {
                dataPackage: "DEMOdz", 
                matrixName: "mtx.mrna.bc"
            };
            return osSocket.request({cmd: "createPLSR", payload: payload});
        }

        function getCalculatedPLSR(geneSet, factors) {
            var payload = {
                genes: geneSet, 
                factorCount: factors.length, 
                factors: factors
            };
            return osSocket.request({cmd: "calculatePLSR", payload: payload});
        }

        function getSummarizedPLSRPatientAttributes(attrs) {
            attrs = attrs || ['AgeDx','Survival'];
            return osSocket.request({cmd:'summarizePLSRPatientAttributes', payload: ["AgeDx", "Survival"]});
        }

        function getCalculatedSurvivalCurves() {}

        function getTimelines() {}

        function getCalculatedTimelines() {}

       
    }
})();

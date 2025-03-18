/* Copyright start
    MIT License
    Copyright (c) 2025 Fortinet Inc
Copyright end */
'use strict';

(function () {
    angular
        .module('cybersponse')
        .factory('cyberThreatWorldMapService', cyberThreatWorldMapService);

    cyberThreatWorldMapService.$inject = ['$q', '$http', 'Query', 'API', 'ALL_RECORDS_SIZE', '$resource', 'connectorService'];

    function cyberThreatWorldMapService($q, $http, Query, API, ALL_RECORDS_SIZE, $resource, connectorService) {
        var service;
        service = {
            executeAction: executeAction
        };

        //execute connection action
        function executeAction(connector_name, connector_action, payload) {
            return $resource(API.INTEGRATIONS + 'connectors/?name=' + connector_name)
                .get()
                .$promise
                .then(function (connectorMetaDataForVersion) {
                    let defaultConfig = connectorMetaDataForVersion.data[0].configuration.filter(item => item.default);
                    if (defaultConfig) {
                        var config_id = defaultConfig[0]['config_id'];
                    }
                    else {
                        toaster.error({ body: 'Default configuration not present.' });
                    }
                    return connectorService.executeConnectorAction(connector_name, connectorMetaDataForVersion.data[0].version, connector_action, config_id, payload);
                })
                .catch(function (error) {
                    console.error('Error:', error);
                    throw error; // Rethrow the error to be handled by the caller
                });
        }

        return service;
    }
})();

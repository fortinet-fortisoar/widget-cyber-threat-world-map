/* Copyright start
    MIT License
    Copyright (c) 2024 Fortinet Inc
Copyright end */
'use strict';
(function () {
  angular
    .module('cybersponse')
    .controller('editCyberThreatWorldMap100Ctrl', editCyberThreatWorldMap100Ctrl);

  editCyberThreatWorldMap100Ctrl.$inject = ['$scope', '$uibModalInstance', 'config', 'widgetUtilityService', '$timeout', 'modelMetadatasService', 'Entity'];

  function editCyberThreatWorldMap100Ctrl($scope, $uibModalInstance, config, widgetUtilityService, $timeout, modelMetadatasService, Entity) {
    $scope.cancel = cancel;
    $scope.save = save;
    $scope.config = config;
    $scope.loadModuleFields = loadModuleFields;


    function _handleTranslations() {
      let widgetNameVersion = widgetUtilityService.getWidgetNameVersion($scope.$resolve.widget, $scope.$resolve.widgetBasePath);

      if (widgetNameVersion) {
        widgetUtilityService.checkTranslationMode(widgetNameVersion).then(function () {
          $scope.viewWidgetVars = {
            // Create your translating static string variables here
          };
        });
      } else {
        $timeout(function () {
          $scope.cancel();
        });
      }
    }

    function init() {
      // To handle backward compatibility for widget
      _handleTranslations();
      loadModules();
      if (config.worldMapModule) {
        loadModuleFields();
      }
    }
    function loadModules() {
      modelMetadatasService.getModuleList().then(function (modules) {
        $scope.worldMapModule = modules;
      });
    }
    init();

    function cancel() {
      $uibModalInstance.dismiss('cancel');
    }

    function save() {
      $uibModalInstance.close($scope.config);
    }

    function loadModuleFields() {
      $scope.moduleFieldByPicklistType = [];
      var entity = new Entity(config.worldMapModule);
      entity.loadFields().then(function () {
        const sortedKeys = Object.keys(entity.fields).sort();
        const sortedObj = {};
        const filteredFieldsByPicklist = {};
        for (const key of sortedKeys) {
          sortedObj[key] = entity.fields[key];
        }
        $scope.countryField = sortedObj;

        for (const key of Object.keys(sortedObj)) {
          if (sortedObj[key].type === "picklist") {
            filteredFieldsByPicklist[key] = sortedObj[key];
          }
        }
        $scope.moduleFieldByPicklistType = filteredFieldsByPicklist;
      });
    }
  }
})();

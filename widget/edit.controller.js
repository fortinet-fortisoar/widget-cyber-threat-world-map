/* Copyright start
    MIT License
    Copyright (c) 2025 Fortinet Inc
Copyright end */
'use strict';
(function () {
  angular
    .module('cybersponse')
    .controller('editCyberThreatWorldMap100Ctrl', editCyberThreatWorldMap100Ctrl);

  editCyberThreatWorldMap100Ctrl.$inject = ['$scope', '$uibModalInstance', 'config', 'widgetUtilityService', '$timeout', 'modelMetadatasService', 'Entity', 'appModulesService'];

  function editCyberThreatWorldMap100Ctrl($scope, $uibModalInstance, config, widgetUtilityService, $timeout, modelMetadatasService, Entity, appModulesService) {
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
            HEADER_ADD_MAP: widgetUtilityService.translate('cyberThreatWorldMap.HEADER_ADD_MAP'),
            HEADER_EDIT_MAP: widgetUtilityService.translate('cyberThreatWorldMap.HEADER_EDIT_MAP'),
            LABEL_VIEW_FIELD: widgetUtilityService.translate('cyberThreatWorldMap.LABEL_VIEW_FIELD'),
            LABEL_COUNTRY_FIELD: widgetUtilityService.translate('cyberThreatWorldMap.LABEL_COUNTRY_FIELD'),
          };
          $scope.header = $scope.config.title ? $scope.viewWidgetVars.HEADER_EDIT_MAP : $scope.viewWidgetVars.HEADER_ADD_MAP;
        });
      } else {
        $timeout(function () {
          cancel();
        },100);
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
      appModulesService.load(true).then(function (modules) {
        $scope.modules = modules;
        //Create a list of modules with atleast one JSON field
        $scope.modules.forEach((module) => {
          var moduleMetaData = modelMetadatasService.getMetadataByModuleType(module.type);
          for (let fieldIndex = 0; fieldIndex < moduleMetaData.attributes.length; fieldIndex++) {
            //Check If JSON field is present in the module
            if (moduleMetaData.attributes[fieldIndex].type === "object") {
              $scope.worldMapModule.push(module);
              break;
            }
          }
        });
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

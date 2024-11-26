/* Copyright start
    MIT License
    Copyright (c) 2024 Fortinet Inc
Copyright end */
'use strict';
(function () {
  angular
    .module('cybersponse')
    .controller('cyberThreatWorldMap100Ctrl', cyberThreatWorldMap100Ctrl);

  cyberThreatWorldMap100Ctrl.$inject = ['$scope', 'PagedCollection', 'config', 'ALL_RECORDS_SIZE', 'widgetUtilityService', '$filter'];

  function cyberThreatWorldMap100Ctrl($scope, PagedCollection, config, ALL_RECORDS_SIZE, widgetUtilityService, $filter) {

    function _handleTranslations() {
      widgetUtilityService.checkTranslationMode($scope.$parent.model.type).then(function () {
        $scope.viewWidgetVars = {
          // Create your translating static string variables here
        };
      });
    }

    function init() {
      // To handle backward compatibility for widget
      $scope.config = config;
      _handleTranslations();
      if ($scope.config.embedded) {
        setTimeout(() => {
          populateMap();
        }, 10);
      }
      else {
        loadWorldMap();
      }
    }

    $scope.$on('$destroy', function () {
      document.getElementById(`world-map-${config.wid ? config.wid : 'embedded'}`).remove();
    });

    function loadWorldMap() {
      let currModule = config.worldMapModule;
      let moduleField = config.moduleField;
      let countryField = config.countryField;

      let pagedCollection = new PagedCollection(currModule);

      let pageConfig = {
        "query": { "sort": [{ "field": "label", "direction": "ASC" }], "limit": ALL_RECORDS_SIZE, "logic": "AND", "filters": [{ "sort": [], "limit": 30, "logic": "AND", "filters": [] }], "__selectFields": [moduleField, countryField] }
      };

      if (config.filters != null) {
        let configFilter = config.filters.filters;
        for (let f of configFilter) {
          pageConfig.query.filters.push(f);
        }
      }

      pagedCollection.loadByPost(pageConfig).then(function () {
        let recordsData = pagedCollection.data["hydra:member"]
        let modules = [];
        let countries = [];

        if (recordsData.length > 0) {
          for (const obj of recordsData) {
            if (obj[countryField] != null && obj[moduleField] != null) {
              modules.push(obj[moduleField].display);
              countries.push(obj[countryField]);
            }
          }
        }

        const parentDiv = d3.select(`#world-map-${config.wid}`);
        const widthP = parentDiv.node().getBoundingClientRect().width;
        const heightP = parentDiv.node().getBoundingClientRect().height;

        const width = 1100;
        const height = 800;

        const svg = d3.select(`#world-map-${config.wid}`).append("svg")
          .attr("width", widthP)
          .attr("height", height)
          .attr("viewBox", `0 0 ${width} ${height}`)
          .attr("id", "world-map-svg")

        const projection = d3.geoMercator()
          .scale(140)
          .translate([width / 2, height / 2]);

        const path = d3.geoPath().projection(projection);

        const zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed);

        function zoomed(event) {
          svg.selectAll('g')
            .attr('transform', event.transform);
        }

        svg.call(zoom);

        d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(world => {
          const validCountries = new Set(world.features.map(feature => feature.properties.name));

          // Filter out invalid modules and countries
          const filteredData = countries.map((country, index) => ({ country: country, module: modules[index] }))
            .filter(item => validCountries.has(item.country));

          modules = filteredData.map(item => item.module);
          countries = filteredData.map(item => item.country);

          svg.append("g")
            .selectAll("path")
            .data(world.features)
            .enter().append("path")
            .attr("fill", "#b8b8b8")
            .attr("d", path)
            .style("stroke", "white")
            .style("stroke-width", 0.5);

          const countryCoordinates = {};
          world.features.forEach(feature => {
            const countryName = feature.properties.name;
            const countryId = feature.properties.id;
            const coordinates = d3.geoCentroid(feature);
            countryCoordinates[countryName] = coordinates;
          });

          // Group modules by Country
          const groupedModulesByCountry = modules.reduce((acc, module, i) => {
            const country = countries[i];
            if (!acc[country]) acc[country] = [];
            acc[country].push(module);
            return acc;
          }, {});


          const groupedModules = {}

          for (let country of Object.keys(groupedModulesByCountry)) {
            groupedModules[country] = groupedModulesByCountry[country].reduce((acc, str) => {
              acc[str] = (acc[str] || 0) + 1;
              return acc;
            }, {});
          }

          // Create an array of points for plotting
          const points = Object.keys(groupedModules).map(country => ({
            name: groupedModules[country],
            count: Object.values(groupedModules[country]).reduce((acc, val) => acc + val, 0),
            coordinates: countryCoordinates[country],
            country: country
          }));

          svg.append("g")
            .selectAll("circle")
            .data(points)
            .enter().append("circle")
            .attr("cx", d => {
              const coord = projection(d.coordinates);
              if (!coord) {
                console.error(`Projection failed for coordinates: ${d.coordinates}`);
                return 0;
              }
              return coord[0];
            })
            .attr("cy", d => {
              const coord = projection(d.coordinates);
              if (!coord) {
                console.error(`Projection failed for coordinates: ${d.coordinates}`);
                return 0;
              }
              return coord[1];
            })
            .attr("r", 5)
            .attr("fill", "red")
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .on("mouseover", function (event, d) {
              //let names = Object.entries(d.name).map(([key, value]) => `${key}: ${value}`).join('<br>');
              let htmlContent = `Country: ${d.country}<br>Total ${currModule}: ${d.count}<br>` //+ names;
              const tempDiv = document.createElement('div');

              // Set the text with <br> tags
              tempDiv.innerHTML = htmlContent;

              // Apply styles to the div
              tempDiv.style.fontSize = `16px`;
              tempDiv.style.lineHeight = 'normal'; // You can adjust this if needed
              tempDiv.style.visibility = 'hidden'; // Hide it from view
              tempDiv.style.position = 'absolute'; // Remove it from the normal document flow
              tempDiv.style.whiteSpace = 'nowrap'; // Make sure it doesn't wrap
              tempDiv.style.width = 'auto'; // Allow width to expand with content
              tempDiv.style.height = 'auto'; // Allow height to expand with content

              // Append the div to the body
              document.body.appendChild(tempDiv);

              // Get the dimensions of the div
              const width = tempDiv.offsetWidth + 15;
              const height = tempDiv.offsetHeight + 25;
              document.body.removeChild(tempDiv);

              const transform = d3.zoomTransform(svg.node());
              // Apply the transform to the coordinates
              const transformedCoordinates = transform.apply(projection(d.coordinates));


              d3.select(this).transition()
                .duration(300)
                .attr("r", 7)
                .attr("fill", "orange");
              svg.append("foreignObject")
                .attr("id", "map-tooltip")
                // .attr("x", projection(d.coordinates)[0] + 10)
                // .attr("y", projection(d.coordinates)[1] - 40)
                .attr("x", transformedCoordinates[0] + 10)
                .attr("y", transformedCoordinates[1] - 40)
                .attr("width", width)
                .attr("height", height)
                // .attr("styles", {"background-color": "black",
                //   "color": "#fff",
                //   "overflow":"visible",
                //   "z-index": "10",
                //   "padding": "5px",
                //   "border-radius": "6px"})
                .html(htmlContent);
            })
            .on("mouseout", function () {
              d3.select(this).transition()
                .duration(300)
                .attr("r", 5)
                .attr("fill", "red");

              svg.select("#map-tooltip").remove();
            })
            .on('click', function (event, d) {
              const host = window.location.host;
              let _query = { "sort": [{ "field": "modifyDate", "direction": "DESC" }], "limit": 30, "logic": "AND", "filters": [{ "field": countryField, "operator": "eq", "_operator": "eq", "value": d.country, "type": "primitive" }] }
              let query = encodeURIComponent(JSON.stringify(_query))
              const fullUrl = `https://${host}/modules/${currModule}?query=${query}`;
              window.open(fullUrl, '_blank');
            });
        });
      });

    };

    //embed world map
    function populateMap() {
      let countries = [];
      const parentDiv = d3.select(`#world-map-embedded`);
      const widthP = parentDiv.node().getBoundingClientRect().width;
      const heightP = parentDiv.node().getBoundingClientRect().height;

      const width = 1100;
      const height = 500;

      const svg = d3.select(`#world-map-embedded`).append("svg")
        .attr("width", widthP)
        .attr("height", height)
        .attr("viewBox", `0 -130 ${width} ${height}`)
        .attr("id", "world-map-svg")

      const projection = d3.geoMercator()
        .scale(140)
        .translate([width / 2, height / 2]);

      const path = d3.geoPath().projection(projection);

      const zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed);

      function zoomed(event) {
        svg.selectAll('g')
          .attr('transform', event.transform);
      }

      //svg.call(zoom);

      d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(world => {
        const validCountries = new Set(world.features.map(feature => feature.properties.name));

        countries = $scope.config.data;

        // Filter out invalid modules and countries
        //const filteredData = countries.filter(item => validCountries.has(item));
        const filteredData = countries.filter(item => validCountries.has(item.country));

        svg.append("g")
          .selectAll("path")
          .data(world.features)
          .enter().append("path")
          .attr("fill", "#b8b8b8")
          .attr("d", path)
          .style("stroke", "white")
          .style("stroke-width", 0.5);

        const countryCoordinates = {};
        world.features.forEach(feature => {
          const countryName = feature.properties.name;
          const countryId = feature.properties.id;
          const coordinates = d3.geoCentroid(feature);
          countryCoordinates[countryName] = coordinates;
        });

        if (filteredData && filteredData.length > 0) {
          // Create an array of points for plotting
          const points = filteredData.map((element, index) => ({
            name: element['country'],
            count: element['visit_count'],
            coordinates: countryCoordinates[element['country']],
            country: element['country'],
            iso: element['iso'].toLowerCase(),
          }));

          svg.append("g")
            .selectAll("circle")
            .data(points)
            .enter().append("circle") //to draw co-ordinates
            .attr("cx", d => {
              const coord = projection(d.coordinates);
              if (!coord) {
                console.error(`Projection failed for coordinates: ${d.coordinates}`);
                return 0;
              }
              return coord[0];
            })
            .attr("cy", d => {
              const coord = projection(d.coordinates);
              if (!coord) {
                console.error(`Projection failed for coordinates: ${d.coordinates}`);
                return 0;
              }
              return coord[1];
            })
            .attr("r", 5)
            .attr("fill", "red")
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .on("mouseover", function (d) { //to show tooltip 
              let htmlContent = `<img src="https://flagcdn.com/48x36/${d.iso}.png" alt="Flag of ${d.country}" title="${d.country}" class="flag padding-top-4 float-left" /> <span class="countrySVG">${d.country} </br> ${d.count}<span>`//+ names;
              const tempDiv = document.createElement('div');

              // Set the text with <br> tags
              tempDiv.innerHTML = htmlContent;

              // Apply styles to the div
              tempDiv.style.fontSize = `16px`;
              tempDiv.style.lineHeight = 'normal'; // You can adjust this if needed
              tempDiv.style.visibility = 'hidden'; // Hide it from view
              tempDiv.style.position = 'absolute'; // Remove it from the normal document flow
              tempDiv.style.whiteSpace = 'nowrap'; // Make sure it doesn't wrap
              tempDiv.style.width = 'auto'; // Allow width to expand with content
              tempDiv.style.height = 'auto'; // Allow height to expand with content

              // Append the div to the body
              document.body.appendChild(tempDiv);

              // Get the dimensions of the div
              const width = tempDiv.offsetWidth + 15;
              const height = tempDiv.offsetHeight + 25;
              document.body.removeChild(tempDiv);

              const transform = d3.zoomTransform(svg.node());
              // Apply the transform to the coordinates
              const transformedCoordinates = transform.apply(projection(d.coordinates));

              d3.select(this).transition()
                .duration(300)
                .attr("r", 7)
                .attr("fill", "orange");
              svg.append("foreignObject")
                .attr("id", "map-tooltip")
                .attr("x", transformedCoordinates[0] + 10)
                .attr("y", transformedCoordinates[1] - 40)
                .attr("width", width)
                .attr("height", height)
                .html(htmlContent);
            })
        }
      });
    }

    init();
  }
})();
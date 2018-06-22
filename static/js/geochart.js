/*
SHAPEFILE
1. Retrieved Cartographic Boundary File from here:
https://www12.statcan.gc.ca/census-recensement/2011/geo/bound-limit/bound-limit-2011-eng.cfm
2. Dropped contents into www.mapshaper.com and exported GeoJSON



*/

//Width and height
var margin = {top: 20, right: 80, bottom: 50, left: 60};
var w = 580 - margin.left - margin.right;
var h = 480 - margin.top - margin.bottom;

var svgContainer = d3.select("#geochart");
var svg = svgContainer
    .append("svg")
    .attr("width", w + margin.left + margin.right)
    .attr("height", h + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

d3.csv("/static/data/NutritionByRegion_Master.csv", function (d) {
    return {
        nutrient: d['Nutrient/Item (unit)'],
        year: +d['Year'],
        sex: d['Sex'],
        mean: +d['Mean'],
        mean_se: +d['SE_Mean'],
        region: d['Reg_Prov'],
        age: d['Age (years)']
    };
}).then(function (data) {
    data = d3.nest()
        .key(function (d) {
            return d.year
        })
        .key(function (d) {
            return d.sex
        })
        .key(function (d) {
            return d.nutrient
        })
        .object(data);

    console.log(data);

    // Dropdown menus
    var yearDropdown = d3.select("#yearDropdown");
    var sexDropdown = d3.select("#sexDropdown");
    var nutrientDropdown = d3.select("#nutrientDropdown");

    // Grab values from the main data object to populate options from the select dropdown
    var yearList = Object.keys(data);
    var sexList = ['Both', 'Female', 'Male'];
    var nutrientList = Object.keys(data['2015']['Male']);


    // Setup dropdown menus
    yearDropdown.append("select")
        .attr("class", "select form-control")
        .attr("id", "yearDropdownSelector")
        .style("width", "100%")
        .on("change", update_data)
        .selectAll("option")
        .data(yearList)
        .enter()
        .append("option")
        .text(function (d) {
            return d
        });

    // Setup dropdown menus
    sexDropdown.append("select")
        .attr("class", "select form-control")
        .attr("id", "sexDropdownSelector")
        .style("width", "100%")
        .on("change", update_data)
        .selectAll("option")
        .data(sexList)
        .enter()
        .append("option")
        .text(function (d) {
            return d
        });

    nutrientDropdown.append("select")
        .attr("class", "select form-control")
        .attr("id", "nutrientDropdownSelector")
        .style("width", "100%")
        .on("change", update_data)
        .selectAll("option")
        .data(nutrientList)
        .enter()
        .append("option")
        .text(function (d) {
            return d
        });

    // Filter the data according to dropdown menu selections
    var year = $("#yearDropdownSelector option:selected").text();
    var sex = $("#sexDropdownSelector option:selected").text();
    var nutrient = $("#nutrientDropdownSelector option:selected").text();
    data = data[year][sex][nutrient];

    // Modified a color scale from https://bl.ocks.org/mbostock/5577023
    var color = d3.scaleQuantize()
        .range(["#d0d1e6", "#a6bddb", "#74a9cf", "#3690c0", "#0570b0", "#045a8d", "#023858", "#022643"]);

    color.domain([
        d3.min(data, function (d) {
            return d.mean;
        }),
        d3.max(data, function (d) {
            return d.mean;
        })
    ]);

    d3.json("/static/data/gpr_000b11a_e.json").then(function (json) {
            // Need to merge the nutrition data and the geoJSON.... yikes
            for (var i = 0; i < data.length; i++) {
                // Grab region name
                var dataRegion = data[i].region;

                // Grab mean data value
                var dataValue = data[i].mean;

                // Find corresponding region in geoJSON
                for (var j = 0; j < json.features.length; j++) {
                    var jsonRegion = json.features[j].properties.PRENAME;

                    if (dataRegion === jsonRegion) {
                        json.features[j].properties.mean = dataValue;

                        // Found it, exit geoJSON loop
                        break;
                    }
                }
            }
            console.log(json);


            var projection = d3.geoAzimuthalEqualArea()
                .rotate([100, -45])
                .center([5, 20])
                .scale([650])
                .translate([w / 2, h / 2]);

            var path = d3.geoPath().projection(projection);

            svg.append("g").attr("class", "regions")
                .selectAll("path")
                .data(json.features)
                .enter()
                .append("path")
                .attr("d", path)
                .attr("class", "region-borders")
                .style("fill", function (d) {
                    // Grab mean value
                    var mean = d.properties.mean;
                    if (mean) {
                        return color(mean);
                    }
                    else {
                        return "#ccc";
                    }
                });

        }
    );

    // TODO: Make this do something
    function update_data(d) {
        return d;
    }

});
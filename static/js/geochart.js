/*
SHAPEFILE
1. Retrieved Cartographic Boundary File from here:
https://www12.statcan.gc.ca/census-recensement/2011/geo/bound-limit/bound-limit-2011-eng.cfm
2. Dropped contents into www.mapshaper.com and exported GeoJSON



*/

//Width and height
var margin = {top: 40, right: 40, bottom: 0, left: 40};
var w = 580 - margin.left - margin.right;
var h = 580 - margin.top - margin.bottom;

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
    var master_data = d3.nest()
        .key(function (d) {
            return d.year
        })
        .key(function (d) {
            return d.sex
        })
        .key(function (d) {
            return d.age
        })
        .key(function (d) {
            return d.nutrient
        })
        .object(data);

    console.log(master_data);

    // Dropdown menus
    var yearDropdown = d3.select("#yearDropdown");
    var sexDropdown = d3.select("#sexDropdown");
    var ageDropdown = d3.select("#ageDropdown");
    var nutrientDropdown = d3.select("#nutrientDropdown");

    // Grab values from the main data object to populate options from the select dropdown
    var yearList = ['2004', '2015'];
    // var sexList = ['Both', 'Female', 'Male'];
    var sexList = ['Female', 'Male'];
    // var ageList = ['1-3', '4-8', '9-13', '14-18', '19-30', '31-50', '51-70', '19 years and over', '71 years and over'];
    var ageList = ['9-13', '14-18', '19-30', '31-50', '51-70', '19 years and over', '71 years and over'];
    var nutrientList = Object.keys(master_data['2015']['Male']['14-18']);

    d3.json("/static/data/gpr_000b11a_e.json").then(function (json) {
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

            ageDropdown.append("select")
                .attr("class", "select form-control")
                .attr("id", "ageDropdownSelector")
                .style("width", "100%")
                .on("change", update_data)
                .selectAll("option")
                .data(ageList)
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
            var age = $("#ageDropdownSelector option:selected").text();
            var nutrient = $("#nutrientDropdownSelector option:selected").text();
            data = master_data[year][sex][age][nutrient];

            // Modified a color scale from https://bl.ocks.org/mbostock/5577023
            var color = d3.scaleQuantize()
                .range(["#f7f4f9", "#e7e1ef", "#d4b9da", "#c994c7", "#df65b0", "#e7298a", "#ce1256", "#980043", "#67001f"]);
            // .range(["#d0d1e6", "#a6bddb", "#74a9cf", "#3690c0", "#0570b0", "#045a8d", "#023858", "#022643"]);

            color.domain([
                d3.min(data, function (d) {
                    return d.mean;
                }),
                d3.max(data, function (d) {
                    return d.mean;
                })
            ]);

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

            var projection = d3.geoAzimuthalEqualArea()
                .rotate([100, -45])
                .center([5, 20])
                .scale([650])
                .translate([w / 2, h / 2]);

            var path = d3.geoPath().projection(projection);

            // Legend setup
            var svgContainer = d3.select("#geolegend");
            var key = svgContainer
                .append("svg")
                .attr("width", (w / 1.5) + 40)
                .attr("height", (h / 12) + 20)
                .append("g")
                .attr("transform",
                    "translate(" + 10 + "," + 10 + ")");

            var legend = key.append("defs")
                .append("svg:linearGradient")
                .attr("id", "gradient")
                .attr("x1", "0%")
                .attr("y1", "100%")
                .attr("x2", "100%")
                .attr("y2", "100%")
                .attr("spreadMethod", "pad");

            update_data();

            function update_data() {
                // Reset data with new dropdown selections
                var year = $("#yearDropdownSelector option:selected").text();
                var sex = $("#sexDropdownSelector option:selected").text();
                var age = $("#ageDropdownSelector option:selected").text();
                var nutrient = $("#nutrientDropdownSelector option:selected").text();
                data = master_data[year][sex][age][nutrient];
                console.log(data);

                // Reset color scale
                color.domain([
                    d3.min(data, function (d) {
                        return d.mean;
                    }),
                    d3.max(data, function (d) {
                        return d.mean;
                    })
                ]);

                // Merge new data with geoJSON
                for (var i = 0; i < data.length; i++) {
                    // Grab region name
                    var dataRegion = data[i].region;

                    // Grab mean data value
                    var geoMean = data[i].mean;
                    var geoMean_se = data[i].mean_se;
                    var geoSex = data[i].sex;
                    var geoNutrient = data[i].nutrient;
                    var geoRegion = data[i].region;

                    // Find corresponding region in geoJSON
                    for (var j = 0; j < json.features.length; j++) {
                        var jsonRegion = json.features[j].properties.PRENAME;

                        if (dataRegion === jsonRegion) {
                            json.features[j].properties.mean = geoMean;
                            json.features[j].properties.mean_se = geoMean_se;
                            json.features[j].properties.sex = geoSex;
                            json.features[j].properties.nutrient = geoNutrient;
                            json.features[j].properties.region = geoRegion;

                            // Found it, exit geoJSON loop
                            break;
                        }
                    }
                }

                // Texture for hovering
                var texture = textures.lines().size(8).strokeWidth(2).background("white");
                svg.call(texture);

                // Cleanup
                svg.selectAll(".regions").remove();

                svg.append("g").attr("class", "regions")
                    .selectAll("path")
                    .data(json.features)
                    .enter()
                    .append("path")
                    .attr("d", path)
                    .attr("class", "region-borders")
                    .style('pointer-events', 'all')  // enable mouseover and mouseout
                    .style("fill", function (d) {
                        if (d.properties.mean) {
                            return color(d.properties.mean);
                        }
                        else {
                            return "#ccc";
                        }
                    })
                    .on("mouseover", function (d) {
                        // Darker shade for bar
                        // d3.select(this).style("fill", d3.rgb(color(d.properties.mean)).darker(2));
                        d3.select(this).style("fill", texture.url());

                        // Update tooltip box
                        d3.select("#tooltip-box")
                            .html(
                                function () {
                                    if (typeof d.properties.mean === "undefined") {
                                        return "<strong>Mean: </strong>N/A" + "<br><strong>Region: </strong>"
                                            + d.properties.PRENAME
                                    }
                                    else {
                                        return "<strong>Mean: </strong>" + d.properties.mean + " (±" + d.properties.mean_se + ")" +
                                            "<br><strong>Region: </strong>" + d.properties.region
                                    }
                                }
                            )
                    })
                    .on("mouseout", function (d) {
                        // Restore original colors
                        if (typeof d.properties.mean === "undefined") {
                            d3.select(this).style("fill", "#ccc");
                        }
                        else {
                            d3.select(this).style("fill", color(d.properties.mean));
                        }
                    });

                // Iterate through data to find min/max mean values for dataset
                var meanValues = [];
                Object.keys(data).forEach(
                    function (key) {
                        for (var i = 0; i < data.length; i++) {
                            meanValues.push(data[key].mean)
                        }
                    }
                );
                var maxValueY = d3.max(meanValues);
                var minValueY = d3.min(meanValues);

                //Update legend (Source: https://bl.ocks.org/duspviz-mit/9b6dce37101c30ab80d0bf378fe5e583)

                key.select("rect").remove();

                legend.append("stop")
                    .attr("offset", "0%")
                    .attr("stop-color", color(minValueY))
                    .attr("stop-opacity", 1);
                legend.append("stop")
                    .attr("offset", "50%")
                    .attr("stop-color", color((maxValueY + minValueY) / 2))
                    .attr("stop-opacity", 1);
                legend.append("stop")
                    .attr("offset", "100%")
                    .attr("stop-color", color(maxValueY))
                    .attr("stop-opacity", 1);
                key.append("rect")
                    .attr("width", (w / 1.5))
                    .attr("height", (h / 12) - 25)
                    .style("fill", "url(#gradient)")
                    .attr("transform", "translate(0,10)");

                var y = d3.scaleLinear()
                    .domain([maxValueY, minValueY])
                    .range([w / 1.5, 0]);
                var yAxis = d3.axisBottom()
                    .scale(y)
                    .ticks(6);

                key.select(".y.axis").remove();

                key.append("g")
                    .attr("class", "y axis")
                    .attr("transform", "translate(0,30)")
                    .transition()
                    .call(yAxis)

            }


        }
    );


});


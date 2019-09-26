/*
SHAPEFILE
1. Retrieved Cartographic Boundary File from here:
https://www12.statcan.gc.ca/census-recensement/2011/geo/bound-limit/bound-limit-2011-eng.cfm
2. Dropped contents into www.mapshaper.com and exported to GeoJSON
3. D3.js magiks
*/

//Width and height
var margin = {top: 0, right: 40, bottom: 0, left: 40};
var w = 580 - margin.left - margin.right;
var h = 580 - margin.top - margin.bottom;

var svgContainer = d3.select("#geochart");
var boxplotTooltip = d3.select("body").append("div").attr("class", "boxplot-tooltip").style("display", "none");

var svg = svgContainer
    .append("svg")
    .style("display", "block")
    .attr("width", w + margin.left + margin.right)
    .attr("height", h + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// Global variable to track which region is currently being hovered over by user
var hovered_region = null;

d3.csv("/static/data/NutritionByRegion_June2019.csv", function (d) {
    return {
        nutrient: d['Nutrient/Item (unit)'],
        year: d['Year'],
        sex: d['Sex'],
        mean: +d['Mean'],
        mean_se: +d['SE_Mean'],
        region: d['Reg_Prov'],
        age: d['Age (years)'],
        median: +d['P50'],
        q1: +d['P25'],
        q1_se: +d['P25_SE'],
        q3: +d['P75'],
        q3_se: +d['P75_SE']
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

    // Initialize data to pass to the boxplot
    var boxplot_data = d3.nest()
        .key(function (d) {
            return d.sex
        })
        .key(function (d) {
            return d.age
        })
        .key(function (d) {
            return d.nutrient
        })
        .key(function (d) {
            return d.region
        })
        .object(data);
    var boxplot_data_subset = null;

    // Dropdown menus
    var yearDropdown = d3.select("#yearDropdown");
    var sexDropdown = d3.select("#sexDropdown");
    var ageDropdown = d3.select("#ageDropdown");
    var nutrientDropdown = d3.select("#nutrientDropdown");

    // Grab values from the main data object to populate options from the select dropdown
    var yearList = ['2004', '2015'];
    var sexList = ['Female', 'Male'];
    var ageList = ['9-13', '14-18', '19-30', '31-50', '51-70', '19 years and over', '71 years and over'];
    // var nutrientList = Object.keys(master_data['2015']['Male']['14-18']);  // Verify this category has all nutrients
    var nutrientList = [
        'Magnesium (mg/d)',
        'Linolenic fatty acid (g/d)',
        'Folate (DFE/d)',
        'Riboflavin (mg/d)',
        'Vitamin C (mg/d)',
        'Niacin (NE/d)',
        'Caffeine (mg/d)',
        'Total monounsaturated fats (g/d)',
        'Potassium (mg/d)',
        'Calcium (mg/d)',
        'Percentage of total energy intake from fat',
        'Percentage of total energy intake from monounsaturated fats',
        'Percentage of total energy intake from sugars',
        'Total energy intake (kcal/d)',
        'Phosphorus (mg/d)',
        'Percentage of total energy intake from carbohydrates',
        'Percentage of total energy intake from linolenic fatty',
        'Moisture (g/d)',
        'Vitamin A (RAE/d)',
        'Vitamin B6 (mg/d)',
        'Linoleic fatty acid (g/d)',
        'Sodium (mg/d)',
        'Total polyunsaturated fats (g/d)',
        'Protein (g/d)',
        'Naturally occurring folate (mcg/d)',
        'Iron(mg/d)',
        'Total saturated fats (g/d)',
        'Sugar (g/d)',
        'Vitamin D (mcg/d)',
        'Total fats (g/d)',
        'Thiamin (mg/d)',
        'Percentage of total energy intake from linoleic fatty',
        'Cholesterol (mg/d)',
        'Folacin (mcg/d)',
        'Percentage of total energy intake from polyunsaturated fats',
        'Vitamin B12 (mcg/d)',
        'Total carbohydrates (g/d)',
        'Percentage of total energy intake from saturated fats',
        'Zinc (mg/d)',
        'Total dietary fibre (g/d)'
    ].sort();

    /*
    Note that the 'Both' sex category is not included in this visualization. Accordingly, this means that age groups
    1-3 and 4-8 are not available. This is because the complete nutrient set is not available for this group.

    var sexList = ['Both', 'Female', 'Male'];
    var ageList = ['1-3', '4-8', '9-13', '14-18', '19-30', '31-50', '51-70', '19 years and over', '71 years and over'];
     */

    // Read in the map data
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
                .data(nutrientList.sort())
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

            // Modified color scale from https://bl.ocks.org/mbostock/5577023
            // scaleLinear interpolates between values, so I think it's a better choice for this viz than scaleQuantize
            // var color = d3.scaleQuantize()
            //     .range(["#f7f4f9", "#e7e1ef", "#d4b9da", "#c994c7", "#df65b0",
            //         "#e7298a", "#ce1256", "#980043", "#67001f"]);
            var color = d3.scaleLinear()
                .range(["#f7f4f9", "#ce1256"]);

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
                .scale([680])
                .translate([w / 2, h / 2]);

            var path = d3.geoPath().projection(projection);

            // Legend setup
            var svgContainer = d3.select("#geolegend");
            var key = svgContainer
                .append("svg")
                .style("display", "block")
                .attr("width", (w / 1.5) + 40)
                .attr("height", (h / 12) + 40)
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

                // Cleanup the boxplot
                d3.select("#boxplot").remove();
                // d3.select("#linechart").remove();

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

                // Texture settings for hovering over regions with textures.js
                var texture = textures.lines().size(8).strokeWidth(2).background("white");
                svg.call(texture);

                // Cleanup
                svg.selectAll(".regions").remove();

                // Draw map
                svg.append("g").attr("class", "regions")
                    .selectAll("path")
                    .data(json.features)
                    .enter()
                    .append("path")
                    .attr("d", path)
                    .attr("class", "region-borders")
                    .style('pointer-events', 'all')  // required to enable mouseover and mouseout on svg
                    .style("fill", function (d) {
                        if (d.properties.mean) {
                            return color(d.properties.mean);
                        } else {
                            return "#ccc";
                        }
                    })
                    .on("mouseover", function (d) {
                        // Apply texture to region
                        d3.select(this).style("fill", texture.url());

                        // Grab the region and store it the global variable
                        hovered_region = d.properties.region;

                        // Grab the relevant data for the boxplot (array with 2004, 2015 data objects)
                        boxplot_data_subset = boxplot_data[sex][age][nutrient][hovered_region];

                        // Update tooltip box + append new boxplot
                        d3.select("#tooltip-text")
                            .html(
                                function () {
                                    if (typeof d.properties.mean === "undefined") {
                                        return "<strong>Mean: </strong>N/A" + "<br><strong>Region: </strong>" +
                                            d.properties.PRENAME + "<br>"
                                    } else {
                                        return "<strong>Mean: </strong>" + d.properties.mean +
                                            " (±" + d.properties.mean_se + ")" +
                                            "<br><strong>Region: </strong>" + hovered_region + "<br>"
                                    }
                                }
                            );

                        // // Delete old linechart
                        // d3.select("#linechart").remove();
                        //
                        // // Create new linechart
                        // d3.select("#tooltip-chart")
                        //     .append("svg")
                        //     .attr("id", "linechart");

                        // Delete old boxplot
                        d3.select("#boxplot").remove();

                        // Create new boxplot
                        d3.select("#tooltip-chart")
                            .append("svg")
                            .attr("id", "boxplot");

                        // Update line chart
                        // Remove any remnants of the line chart if the user hovers over a territory
                        if (d.properties.PRENAME === "Nunavut" ||
                            d.properties.PRENAME === "Yukon" ||
                            d.properties.PRENAME === "Northwest Territories") {
                            // d3.select("#linechart").remove();
                            d3.select("#boxplot").remove();
                            d3.select("#legend-tick").remove();  // Remove legend tick

                        } else {
                            // line_chart(d.properties.PRENAME, maxValueY, d.properties.nutrient);
                            // box_plot(d.properties.PRENAME, d.properties.nutrient);
                            draw_boxplot();
                            draw_legend(minValueY, maxValueY, nutrient, d.properties.mean);
                        }
                    })
                    .on("mouseout", function (d) {
                        // Set territories by default to original grey
                        if (typeof d.properties.mean === "undefined") {
                            d3.select(this).style("fill", "#ccc");
                        }
                        // Restore original colors to regions
                        else {
                            d3.select(this).style("fill", color(d.properties.mean));
                        }
                    });

                // Draw the legend - pass null into hovered mean
                draw_legend(minValueY, maxValueY, nutrient, null);

                // Update boxplot if the user changes an item in the dropdown
                // This will fail by default on the first attempt since nothing is being hovered over
                try {
                    if (hovered_region === "Nunavut" ||
                        hovered_region === "Yukon" ||
                        hovered_region === "Northwest Territories") {
                        // d3.select("#linechart").remove();  // Remove linechart for territories
                        d3.select("#boxplot").remove();  // Remove boxplot for territories
                    } else {
                        // line_chart(hovered_region, maxValueY, nutrient);
                        boxplot_data_subset = boxplot_data[sex][age][nutrient][hovered_region];
                        draw_boxplot();
                    }
                } catch (err) {
                    d3.select("#tooltip-text")
                        .html("<i>Hover over a region with your cursor to see additional data.</i>")
                }
            }


            function draw_legend(minValueY, maxValueY, selected_nutrient, hovered_mean) {
                //Update legend (Derived from https://bl.ocks.org/duspviz-mit/9b6dce37101c30ab80d0bf378fe5e583)
                key.selectAll("rect").remove();
                key.select("#legend-label").remove();

                // Adjust min and max values slightly so the legend looks nicer
                maxValueY = maxValueY * 1.03;
                minValueY = minValueY * 0.97;

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
                    .attr("height", (h / 12) - 28)
                    .style("fill", "url(#gradient)")
                    .attr("transform", "translate(0,10)");

                var x = d3.scaleLinear()
                    .domain([maxValueY, minValueY])
                    .range([w / 1.5, 0]);
                var xAxis = d3.axisBottom()
                    .scale(x)
                    .ticks(4);

                key.select(".x.axis").remove();

                key.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0,30)")
                    .call(xAxis);

                key.append("text")
                    .attr("id", "legend-label")
                    .attr("transform",
                        "translate(" + (w / 3) + " ," +
                        (h / 12 + 25) + ")")
                    .style("text-anchor", "middle")
                    .text(function () {
                        var shortened_label = selected_nutrient.replace("Percentage", "%");
                        return "Mean " + shortened_label
                    });

                // Draw a tick on the legend with hovered_mean
                if (hovered_mean === null) {
                } else {
                    key.append("rect")
                        .attr("id", "legend-tick")
                        .attr("x", x(hovered_mean))
                        .attr("y", 0)
                        .attr("width", 2)
                        .attr("height", 20)
                }
            }

            function draw_boxplot() {
                margin = {top: 20, right: 20, bottom: 20, left: 45};
                var line_w = ($("#tooltip-chart").parent().width()) - margin.left - margin.right;
                var line_h = 120 - margin.top - margin.bottom;
                var barWidth = 30;

                for (var i = 0; i < boxplot_data_subset.length; i++) {
                    boxplot_data_subset[i].q1 = parseFloat(boxplot_data_subset[i].q1) || 0;
                    boxplot_data_subset[i].q1_se = parseFloat(boxplot_data_subset[i].q1_se) || 0;
                    boxplot_data_subset[i].q3 = parseFloat(boxplot_data_subset[i].q3) || 0;
                    boxplot_data_subset[i].q3_se = parseFloat(boxplot_data_subset[i].q3_se) || 0;
                }

                // console.log(boxplot_data_subset);

                // Grab min and max values
                var minmax_vals = [
                    (boxplot_data_subset[0].q1 + boxplot_data_subset[0].q1_se),
                    (boxplot_data_subset[1].q1 + boxplot_data_subset[1].q1_se),
                    (boxplot_data_subset[0].q3 + boxplot_data_subset[0].q3_se),
                    (boxplot_data_subset[1].q3 + boxplot_data_subset[1].q3_se)
                ];
                var maxValueY = d3.max(minmax_vals);

                // Chart
                var boxplot = d3.select("#boxplot")
                    .attr("width", line_w + margin.left + margin.right)
                    .attr("height", line_h + margin.top + margin.bottom)
                    .style("display", "block")
                    .style("margin", "auto");

                var g = boxplot.append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                // xScale
                var xScale = d3.scaleBand()
                    .domain(["2004", "2015"])
                    .rangeRound([0, line_w])
                    .padding(1);

                // yScale
                var yScale = d3.scaleLinear()
                    .domain([0, maxValueY])
                    .range([line_h, 0]);

                // xAxis
                var xAxis = d3.axisBottom().scale(xScale);

                // yAxis
                var yAxis = d3.axisLeft().scale(yScale).ticks(3);

                // Reset the axis
                boxplot.select("y axis").transition().duration(300).call(yAxis);

                // Append x-axis
                g.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + (line_h) + ")")
                    .call(xAxis);

                // Append y-axis
                g.append("g")
                    .attr("class", "y axis")
                    .call(yAxis)
                    .append("text")
                    .attr("id", "y-axis-text")
                    .attr("fill", "#000")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 6)
                    .attr("dy", "0.71em")
                    .attr("text-anchor", "end")
                    .text("Nutrient");

                // Draw the box plot vertical lines
                var verticalLines = g.selectAll(".verticalLines")
                    .data(boxplot_data_subset)
                    .enter()
                    .append("line")
                    .attr("x1", function (data) {
                        return xScale(data.year);
                    })
                    .attr("y1", function (data) {
                        return yScale(data.q1 - data.q1_se);
                    })
                    .attr("x2", function (data) {
                        return xScale(data.year);
                    })
                    .attr("y2", function (data) {
                        return yScale(data.q3 + data.q3_se);
                    })
                    .attr("stroke", "#000")
                    .attr("stroke-width", 1)
                    .attr("fill", "none");

                // Draw the boxes, filled and on top of vertical lines
                var rects = g.selectAll("rect")
                    .data(boxplot_data_subset)
                    .enter()
                    .append("rect")
                    .on("mouseover", function (data) {
                        d3.select(this).attr("fill", "white");
                    })
                    .on("mousemove", function (data) {
                        boxplotTooltip.html("<br><strong>Q3: </strong>" + data.q3 + " (±" + data.q3_se + ")" +
                            "<br><strong>Q1: </strong>" + data.q1 + " (±" + data.q1_se + ")" +
                            "<br><strong>Median: </strong>" + data.median)
                            .style("left", (d3.event.pageX + 20) + "px")
                            .style("top", (d3.event.pageY) - 10 + "px")
                            .style("display", "inline");
                    })
                    .on("mouseout", function (data) {
                        d3.select(this).attr("fill", "lightgrey");
                        boxplotTooltip.style("display", "none");
                    })

                    .attr("width", barWidth)
                    .attr("height", function (data) {
                        return yScale(data.q1) - yScale(data.q3);
                    })
                    .attr("x", function (data) {
                        return xScale(data.year) - (barWidth / 2);
                    })
                    .attr("y", function (data) {
                        return yScale(data.q3);
                    })
                    .attr("fill", "lightgrey")
                    .attr("stroke", "#000")
                    .attr("stroke-width", 1);

                // Draw horizontal lines (median and SE)
                var horizontalLineConfigs = [
                    // Median line
                    {
                        x1: function (data) {
                            return xScale(data.year) - barWidth / 2
                        },
                        y1: function (data) {
                            return yScale(data.median)
                        },
                        x2: function (data) {
                            return xScale(data.year) + barWidth / 2
                        },
                        y2: function (data) {
                            return yScale(data.median)
                        }
                    },
                    // Top line (Q3 SE)
                    {
                        x1: function (data) {
                            return xScale(data.year) - barWidth / 2
                        },
                        y1: function (data) {
                            return yScale(data.q3 + data.q3_se)
                        },
                        x2: function (data) {
                            return xScale(data.year) + barWidth / 2
                        },
                        y2: function (data) {
                            return yScale(data.q3 + data.q3_se)
                        }
                    },
                    // Bottom line
                    {
                        x1: function (data) {
                            return xScale(data.year) - barWidth / 2
                        },
                        y1: function (data) {
                            return yScale(data.q1 - data.q1_se)
                        },
                        x2: function (data) {
                            return xScale(data.year) + barWidth / 2
                        },
                        y2: function (data) {
                            return yScale(data.q1 - data.q1_se)
                        }
                    }
                ];

                for (var i = 0; i < horizontalLineConfigs.length; i++) {
                    var lineConfig = horizontalLineConfigs[i];

                    // Draw the whiskers at the min for this series
                    var horizontalLine = g.selectAll(".whiskers")
                        .data(boxplot_data_subset)
                        .enter()
                        .append("line")
                        .attr("x1", lineConfig.x1)
                        .attr("y1", lineConfig.y1)
                        .attr("x2", lineConfig.x2)
                        .attr("y2", lineConfig.y2)
                        .attr("stroke", "#000")
                        .attr("stroke-width", 1)
                        .attr("fill", "none");
                }
            }

            function line_chart(hovered_region, maxValueY, selected_nutrient) {
                // Setup
                margin = {top: 20, right: 20, bottom: 20, left: 45};
                var line_w = ($("#tooltip-chart").parent().width()) - margin.left - margin.right;
                var line_h = 120 - margin.top - margin.bottom;

                var filtered_line_data = line_data[sex][age][selected_nutrient][hovered_region];
                // console.log(filtered_line_data);

                // Chart
                var linechart = d3.select("#linechart")
                    .attr("width", line_w + margin.left + margin.right)
                    .attr("height", line_h + margin.top + margin.bottom)
                    .style("display", "block")
                    .style("margin", "auto");
                var g = linechart.append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                // xScale
                var xScale = d3.scaleBand()
                    .domain(["2004", "2015"])
                    .rangeRound([0, line_w])
                    .padding(1);

                // yScale
                var yScale = d3.scaleLinear()
                    .domain([0, maxValueY])
                    .range([line_h, 0]);

                // xAxis
                var xAxis = d3.axisBottom().scale(xScale);

                // yAxis
                var yAxis = d3.axisLeft().scale(yScale).ticks(3);

                // Line setup
                var valueline = d3.line()
                    .x(function (d) {
                        return xScale(d.year);
                    })
                    .y(function (d) {
                        return yScale(d.mean);
                    });

                // Reset the axis
                linechart.select("y axis").transition().duration(300).call(yAxis);

                // Update the y-axis text label
                g.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + (line_h) + ")")
                    .call(xAxis);

                g.append("g")
                    .attr("class", "y axis")
                    .call(yAxis)
                    .append("text")
                    .attr("id", "y-axis-text")
                    .attr("fill", "#000")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 6)
                    .attr("dy", "0.71em")
                    .attr("text-anchor", "end")
                    .text("Mean");

                // Draw the line
                g.append("path")
                    .datum(filtered_line_data)
                    .transition()
                    .attr("class", "line")
                    .attr("d", valueline);

                // Add some caps to the ends of the line
                g.selectAll("circle")
                    .data(filtered_line_data)
                    .enter()
                    .append("circle")
                    .attr("class", "circle")
                    .attr("cx", function (d) {
                        return xScale(d.year);
                    })
                    .attr("cy", function (d) {
                        return yScale(d.mean);
                    })
                    .attr("r", 5);
            }


        }
    );


});


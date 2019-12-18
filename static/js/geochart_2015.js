/*
SHAPEFILE
1. Retrieved Cartographic Boundary File from here:
https://www12.statcan.gc.ca/census-recensement/2011/geo/bound-limit/bound-limit-2011-eng.cfm
2. Dropped contents into www.mapshaper.com and exported to GeoJSON
3. D3.js magiks
*/

//Width and height
const margin = {top: 0, right: 40, bottom: 0, left: 40};
const w = 580 - margin.left - margin.right;
const h = 580 - margin.top - margin.bottom;

const svgContainer = d3.select("#geochart");
const boxplotTooltip = d3.select("body").append("div").attr("class", "boxplot-tooltip").style("display", "none");

const svg = svgContainer
    .append("svg")
    .style("display", "block")
    .attr("width", w + margin.left + margin.right)
    .attr("height", h + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// Global variable to track which region is currently being hovered over by user
let hovered_region = null;

d3.csv("../static/data/geographic-dec2015-bi.csv", function (d) {
    return {
        nutrient: d['Nutrient/Item'],
        region: d['Reg_Prov'],
        sex: d['Sex'],
        age: d["Age (years)"],
        n: +d['n'],
        dri_type: d['DRI type'],
        prefix: d['Prefix-EN'],
        percentage: +d['Percentage'],
        percentage_se: +d['SE'],
        ref_value: d['Ref value'],
    };
}).then(function (data) {
    let master_data = d3.nest()
        .key(function (d) {
            return d.sex
        })
        .key(function (d) {
            return d.nutrient
        })
        .object(data);

    // Dropdown menus
    let sexDropdown = d3.select("#sexDropdown");
    let nutrientDropdown = d3.select("#nutrientDropdown");

    // Grab values from the main data object to populate options from the select dropdown
    const sexList = ['Female', 'Male', 'Males and females combined'];

    // Temporarily disabled nutrients with both sexes combined
    const nutrientList = [
        'Calcium',
        // 'Folate',
        // 'Total dietary fibre',
        // 'Iron',
        'Magnesium',
        'Percentage of total energy intake from carbohydrates',
        'Percentage of total energy intake from fat',
        'Percentage of total energy intake from protein',
        'Potassium',
        'Sodium',
        'Vitamin A',
        'Vitamin C',
        'Vitamin D',
        // 'Zinc',
    ].sort();

    // Read in the map data
    d3.json("../static/data/gpr_000b11a_e.json").then(function (json) {

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
                .data(nutrientList.sort())
                .enter()
                .append("option")
                .text(function (d) {
                    return d
                });

            // Filter the data according to dropdown menu selections
            let sex = $("#sexDropdownSelector option:selected").text();
            let nutrient = $("#nutrientDropdownSelector option:selected").text();

            data = master_data[sex][nutrient];
            const colorScale = d3.scaleLinear()
                .range(["#f7f4f9", "#ce1256"]);

            colorScale.domain([
                d3.min(data, function (d) {
                    return d.percentage;
                }),
                d3.max(data, function (d) {
                    return d.percentage;
                })
            ]);

            for (let i = 0; i < data.length; i++) {
                // Grab region name
                let dataRegion = data[i].region;

                // Grab mean data value
                let dataValue = data[i].percentage;

                // Find corresponding region in geoJSON
                for (let j = 0; j < json.features.length; j++) {
                    let jsonRegion = json.features[j].properties.PRENAME;

                    if (dataRegion === jsonRegion) {
                        json.features[j].properties.percentage = dataValue;

                        // Found it, exit geoJSON loop
                        break;
                    }
                }
            }

            let projection = d3.geoAzimuthalEqualArea()
                .rotate([100, -45])
                .center([5, 20])
                .scale([680])
                .translate([w / 2, h / 2]);

            let path = d3.geoPath().projection(projection);

            // Legend setup
            let svgContainer = d3.select("#geolegend");
            let key = svgContainer
                .append("svg")
                .style("display", "block")
                .attr("width", (w / 1.5) + 40)
                .attr("height", (h / 12) + 40)
                .append("g")
                .attr("transform",
                    "translate(" + 10 + "," + 10 + ")");

            let legend = key.append("defs")
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
                let sex = $("#sexDropdownSelector option:selected").text();
                let nutrient = $("#nutrientDropdownSelector option:selected").text();
                data = master_data[sex][nutrient];

                // prepare driObject which will be used to draw info on the DRI/reference value
                let driObject = {
                    'dri_type': data[0]['dri_type'],
                    'ref_value_raw': data[0]['ref_value'],
                    'ref_value': null,
                    'ref_min': null,
                    'ref_max': null,
                    'prefix': data[0]['prefix'],
                    'range': false  // whether or not the ref value is a range
                };

                // Logic to parse the reference value which might be null, a number, or a number range
                if (data[0]['ref_value'].includes("-")) {
                    driObject['ref_min'] = Number(data[0]['ref_value'].split(' - ')[0]);
                    driObject['ref_max'] = Number(data[0]['ref_value'].split(' - ')[1]);
                    driObject['range'] = true;
                } else if (data[0]["ref_value"] !== null && data[0]["ref_value"] !== "") {
                    driObject['ref_value'] = Number(data[0]["ref_value"])
                }
                else {
                    driObject['ref_value_raw'] = 'N/A';
                }

                console.log(driObject);
                d3.select("#tooltip-text").html(`
                
                <div><strong>Reference value:</strong> ${driObject['ref_value_raw']}</div>
                <div><strong>DRI Type:</strong> ${driObject['dri_type']}</div>
                <div><strong>Prefix:</strong> ${driObject['prefix']}</div>
                `);

                // Cleanup the boxplot
                d3.select("#boxplot").remove();
                // d3.select("#linechart").remove();

                // Reset color scale
                colorScale.domain([
                    d3.min(data, function (d) {
                        return d.percentage;
                    }),
                    d3.max(data, function (d) {
                        return d.percentage;
                    })
                ]);

                // Merge new data with geoJSON
                for (let i = 0; i < data.length; i++) {

                    // Grab region name
                    let dataRegion = data[i].region;

                    // Grab mean data value
                    let geoPercentage = data[i].percentage;
                    let geoPercentageSE = data[i].percentage_se;
                    let geoSex = data[i].sex;
                    let geoNutrient = data[i].nutrient;
                    let geoRegion = data[i].region;

                    // Find corresponding region in geoJSON
                    for (let j = 0; j < json.features.length; j++) {
                        let jsonRegion = json.features[j].properties.PRENAME;

                        if (dataRegion === jsonRegion) {
                            json.features[j].properties.percentage = geoPercentage;
                            json.features[j].properties.percentage_se = geoPercentageSE;
                            json.features[j].properties.sex = geoSex;
                            json.features[j].properties.nutrient = geoNutrient;
                            json.features[j].properties.region = geoRegion;

                            // Found it, exit geoJSON loop
                            break;
                        }
                    }
                }

                // Iterate through data to find min/max mean values for dataset
                let meanValues = [];
                Object.keys(data).forEach(
                    function (key) {
                        for (let i = 0; i < data.length; i++) {
                            meanValues.push(data[key].percentage)
                        }
                    }
                );
                let maxValueY = d3.max(meanValues);
                let minValueY = d3.min(meanValues);

                // Texture settings for hovering over regions with textures.js
                let texture = textures.lines().size(8).strokeWidth(2).background("white");
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
                        if (d.properties.percentage) {
                            return colorScale(d.properties.percentage);
                        } else {
                            return "#ccc";
                        }
                    })
                    .on("mouseover", function (d) {
                        // Apply texture to region
                        d3.select(this).style("fill", texture.url());

                        // Grab the region and store it the global variable
                        hovered_region = d.properties.region;

                        if (d.properties.PRENAME === "Nunavut" ||
                            d.properties.PRENAME === "Yukon" ||
                            d.properties.PRENAME === "Northwest Territories") {
                            // d3.select("#linechart").remove();
                            d3.select("#legend-tick").remove();  // Remove legend tick
                        } else {
                            // line_chart(d.properties.PRENAME, maxValueY, d.properties.nutrient);
                            // box_plot(d.properties.PRENAME, d.properties.nutrient);
                            draw_legend(minValueY, maxValueY, nutrient, d.properties.percentage);
                        }
                    })
                    .on("mouseout", function (d) {
                        // Set territories by default to original grey
                        if (typeof d.properties.percentage === "undefined") {
                            d3.select(this).style("fill", "#ccc");
                        }
                        // Restore original colors to regions
                        else {
                            d3.select(this).style("fill", colorScale(d.properties.percentage));
                        }
                    });

                // Draw the legend - pass null into hovered percentage
                draw_legend(minValueY, maxValueY, nutrient, null);
            }


            function draw_legend(minValueY, maxValueY, selectedNutrient, hoveredPercentage, referenceValue, driType) {
                //Update legend (Derived from https://bl.ocks.org/duspviz-mit/9b6dce37101c30ab80d0bf378fe5e583)
                key.selectAll("rect").remove();
                key.select("#legend-label").remove();

                // Adjust min and max values slightly so the legend looks nicer
                maxValueY = maxValueY * 1.03;
                minValueY = minValueY * 0.97;

                legend.append("stop")
                    .attr("offset", "0%")
                    .attr("stop-color", colorScale(minValueY))
                    .attr("stop-opacity", 1);
                legend.append("stop")
                    .attr("offset", "50%")
                    .attr("stop-color", colorScale((maxValueY + minValueY) / 2))
                    .attr("stop-opacity", 1);
                legend.append("stop")
                    .attr("offset", "100%")
                    .attr("stop-color", colorScale(maxValueY))
                    .attr("stop-opacity", 1);
                key.append("rect")
                    .attr("width", (w / 1.5))
                    .attr("height", (h / 12) - 28)
                    .style("fill", "url(#gradient)")
                    .attr("transform", "translate(0,10)");

                let x = d3.scaleLinear()
                    .domain([maxValueY, minValueY])
                    .range([w / 1.5, 0]);
                let xAxis = d3.axisBottom()
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
                        return selectedNutrient
                    });

                // Draw a tick to represent the DRI reference value
                // key.append("rect")
                //     .attr("id", "legend-dri-reference-value")
                //     .attr("x", x(referenceValue))
                //     .attr("y", 0)
                //     .attr("width", 2)
                //     .attr("height", 20);

                // Draw a tick on the legend with hoveredPercentage
                if (hoveredPercentage === null) {
                } else {
                    key.append("rect")
                        .attr("id", "legend-tick")
                        .attr("x", x(hoveredPercentage))
                        .attr("y", 0)
                        .attr("width", 2)
                        .attr("height", 20)
                }
            }

        }
    );


});


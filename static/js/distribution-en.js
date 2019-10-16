/*
- Distribution will only display a certain subset of 'nutrients of interest'
- Distribution values will be provided by Cunye. Using a temporary dataset for now.
 */

//Width and height
const margin = {top: 60, right: 80, bottom: 60, left: 80};
const w = 720 - margin.left - margin.right;
const h = 480 - margin.top - margin.bottom;

// Command to take every 10th row in Python: df.iloc[::10,:]

d3.csv("static/data/distributions-en.csv").then(function (data) {
    // Iterate over every column and cast it to a float if it looks like a number
    data.forEach(function (obj) {
            Object.keys(obj).map(function (a) {
                if (!isNaN(obj[a])) {
                    obj[a] = parseFloat(obj[a]);
                }
            })
        }
    );

    // Nest data by age and then by region
    data = d3.nest()
        .key(function (d) {
            return d['age'];
        })
        .key(function (d) {
            return d['Reg_Prov'];
        })
        .object(data);

    // Hard coded categories for chart labelling
    const yearCategories = [2004, 2015];
    const ageCategories = ['1-3', '4-8', '9-13', '14-18', '19-30', '31-50',
        '51-70', '19 years and over', '71 years and over'
    ];

    const regionList = [
        'Canada excluding territories',
        'Newfoundland and Labrador',
        'Prince Edward Island',
        'Nova Scotia',
        'New Brunswick',
        'Quebec',
        'Ontario',
        'Manitoba',
        'Alberta',
        'Saskatchewan',
        'British Columbia',
        'Atlantic Region',
        'Prairie Region'
    ].sort();

    const nutrientList = [
        'Total energy intake (kcal/d)',
        'Magnesium (mg/d)',
        'Linolenic acid (g/d)',
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
        'Percentage of total energy intake from protein',
        'Phosphorus (mg/d)',
        'Percentage of total energy intake from carbohydrates',
        'Percentage of total energy intake from linolenic acid',
        'Moisture (g/d)',
        'Vitamin A (RAE/d)',
        'Vitamin B6 (mg/d)',
        'Linoleic acid (g/d)',
        'Sodium (mg/d)',
        'Total polyunsaturated fatty acids (g/d)',
        'Protein (g/d)',
        'Naturally occurring folate (mcg/d)',
        'Iron (mg/d)',
        'Total saturated fats (g/d)',
        'Total sugars (g/d)',
        'Vitamin D (mcg/d)',
        'Total fats (g/d)',
        'Thiamin (mg/d)',
        'Percentage of total energy intake from linoleic acid',
        'Cholesterol (mg/d)',
        'Folacin (mcg/d)',
        'Percentage of total energy intake from polyunsaturated fats',
        'Vitamin B12 (mcg/d)',
        'Total carbohydrates (g/d)',
        'Percentage of total energy intake from saturated fats',
        'Zinc (mg/d)',
        'Total dietary fibre (g/d)'
    ].sort();
    const sexCategories = ['Male', 'Female', 'Both'];

    // Filter the data according to dropdown menu selections
    const sexDropdown = d3.select("#sexDropdown");
    const provinceDropdown = d3.select("#provinceDropdown");
    const nutrientDropdown = d3.select("#nutrientDropdown");
    const ageDropdown = d3.select("#ageDropdown");

    // Setup dropdown menus
    sexDropdown.append("select")
        .attr("class", "select form-control")
        .attr("id", "sexDropdownSelector")
        .style("width", "100%")
        .on("change", draw_curves)
        .selectAll("option")
        .data(sexCategories)
        .enter()
        .append("option")
        .text(function (d) {
            return d;
        });

    ageDropdown.append("select")
        .attr("class", "select form-control")
        .attr("id", "sexDropdownSelector")
        .style("width", "100%")
        .on("change", draw_curves)
        .selectAll("option")
        .data(ageCategories)
        .enter()
        .append("option")
        .text(function (d) {
            return d;
        });

    provinceDropdown.append("select")
        .attr("class", "select form-control")
        .attr("id", "provinceDropdownSelector")
        .style("width", "100%")
        .on("change", draw_curves)
        .selectAll("option")
        .data(regionList)
        .enter()
        .append("option")
        .text(function (d) {
            return d;
        });

    // Set default province
    $('select option:contains("Canada excluding territories")').prop('selected', true);

    nutrientDropdown.append("select")
        .attr("class", "select form-control")
        .attr("id", "nutrientDropdownSelector")
        .style("width", "100%")
        .on("change", draw_curves)
        .selectAll("option")
        .data(nutrientList)
        .enter()
        .append("option")
        .text(function (d) {
            return d;
        });
    // Set default nutrient
    $('select option:contains("Total energy intake")').prop('selected', true);

    let sex = $("#sexDropdownSelector option:selected").text();
    let region = $("#provinceDropdownSelector option:selected").text();
    let nutrient = $("#nutrientDropdownSelector option:selected").text();
    let age = $("#ageDropdownSelector option:selected").text();

    // Filter data according to dropdown selection
    data = data['1-3 years']['Canada excluding territories'];
    // data = data[age][region];

    //Create SVG element
    let svgContainer = d3.select("#distribution-chart");
    let svg = svgContainer
        .append("svg")
        .attr("width", w + margin.left + margin.right)
        .attr("height", h + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // xAxis for mean nutrient values
    let xExtent = d3.extent(data, d => d.x);
    let xAxis = d3.scaleLinear()
        .domain([xExtent[0], xExtent[1]]) // data range
        .range([0, w]); // pixel range

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${h})`)
        .call(d3.axisBottom(xAxis));

    // yAxis for density function values
    let yExtent = d3.extent(data, d => d.y);
    let yAxis = d3.scaleLinear()
        .domain([yExtent[0], yExtent[1]])
        .range([h, 0]);
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yAxis));

    const colourScale = d3.scaleOrdinal().range(["#003ce3", "#e200c1"]);

    // Nest again by year
    data = d3.nest()
        .key(function (d) {
            return d['year'];
        })
        .object(data);

    // Setup area curve container
    let curves = svg.append("g").attr("class", "curves");

    // track whether to draw curve or not
    let renderTracker = {
        2004: true,
        2015: true
    };

    // track whether or not to draw limit line
    let drawLimit = true;

    // checkbox functionality
    d3.select("#checkbox2004").attr("checked", "checked").on("change", year_tickbox);
    d3.select("#checkbox2015").attr("checked", "checked").on("change", year_tickbox);
    d3.select("#checkboxLimit").attr("checked", "checked").on("change", limit_tickbox);

    // Enter the initial dataset
    draw_curves();

    // Plot UL/AI
    let ulVal = 10;
    let ul = svg.append("g").attr("class", "upper-limit");
    let lineGenerator = d3.line();
    let ulPoints = [
        [xAxis(ulVal), yAxis(0)],
        [xAxis(ulVal), yAxis(yExtent[1])],
    ];
    let pathData = lineGenerator(ulPoints);
    draw_limit();

    function draw_limit() {
        if (drawLimit) {
            ul.append("path")
                .attr("class", "limit-line")
                .style("stroke", "black")
                .style("stroke-dasharray", "2, 2")
                .style("opacity", 1)
                .attr('d', pathData);

            // UL/AI Text
            ul.append("text")
                .attr("class", "limit-line-text")
                .attr("x", xAxis(ulVal))
                .attr("y", yAxis(yExtent[1]))
                .style("text-anchor", "middle")
                .text("UL");
        } else {
            ul.selectAll(".limit-line").remove();
            ul.selectAll(".limit-line-text").remove();
        }


    }

    function draw_curves() {
        // Draw area curve for each year
        for (const year of yearCategories) {
            curves.selectAll(`.curve-${year}`)
                .data([data[year]])
                .join(
                    enter => enter.append("path")
                        .attr("class", `curve-${year}`)
                        .attr("fill", colourScale(year))
                        .attr("fill-opacity", ".4")
                        .attr("stroke", colourScale(year))
                        .attr("stroke-width", 2)
                        .attr("stroke-linejoin", "round")
                        .attr("d", d3.line()
                            .curve(d3.curveBasis)
                            .x(function (d) {
                                return xAxis(d.x);
                            })
                            .y(function (d) {
                                return yAxis(d.y);
                            })
                        ),
                    update => update.transition().duration(500)
                    // Stroke width shrinks to 0 if curve is disabled by user
                        .attr("stroke-width", function (d) {
                            if (renderTracker[year]) {
                                return 2;
                            } else {
                                return 0;
                            }
                        })
                        .attr("d", d3.line()
                            .curve(d3.curveBasis)
                            .x(function (d) {
                                return xAxis(d.x);
                            })
                            .y(function (d) {
                                if (renderTracker[year]) {
                                    return yAxis(d.y);
                                } else {
                                    return yAxis(0)
                                }
                            })
                        )
                );
        }
    }

    function year_tickbox() {
        renderTracker[2004] = !!d3.select("#checkbox2004").property("checked");
        renderTracker[2015] = !!d3.select("#checkbox2015").property("checked");
        draw_curves();
    }

    function limit_tickbox() {
        drawLimit = !!d3.select("#checkboxLimit").property("checked");
        draw_limit();
    }

});
//Width and height
const margin = {top: 60, right: 80, bottom: 60, left: 80};
const w = 720 - margin.left - margin.right;
const h = 480 - margin.top - margin.bottom;

// TODO: Delete/filter all negative values from dataset

d3.csv("static/data/distributions-sub20-en.csv").then(function (data) {
    // Iterate over every column and cast it to a float if it looks like a number
    data.forEach(function (obj) {
            Object.keys(obj).map(function (a) {
                if (!isNaN(obj[a])) {
                    obj[a] = parseFloat(obj[a]);
                }
            })
        }
    );

    // Nest data by age, nutrient, sex
    data = d3.nest()
        .key(function (d) {
            return d['Age (years)'];
        })
        .key(function (d) {
            return d['Nutrient/Item (unit)'];
        })
        .key(function (d) {
            return d['Sex'];
        })
        .object(data);

    // Unaltered data goes here
    const master_data = data;

    // Hard coded categories for chart labelling
    const yearCategories = [2004, 2015];
    const ageCategories = [
        // '1-3', '4-8',
        '9-13', '14-18', '19-30', '31-50',
        '51-70', '19 and over', '71 and over'
    ];

    const nutrientList = [
        'Total energy intake (kcal/d)',
        'Magnesium (mg/d)',
        // 'Linolenic acid (g/d)',
        'Folate (DFE/d)',
        'Riboflavin (mg/d)',
        'Vitamin C (mg/d)',
        'Niacin (NE/d)',
        // 'Caffeine (mg/d)',
        // 'Total monounsaturated fats (g/d)',
        'Potassium (mg/d)',
        'Calcium (mg/d)',
        'Percentage of total energy intake from fat',
        // 'Percentage of total energy intake from monounsaturated fats',
        'Percentage of total energy intake from sugars',
        'Percentage of total energy intake from protein',
        'Phosphorus (mg/d)',
        'Percentage of total energy intake from carbohydrates',
        'Percentage of total energy intake from linolenic acid',
        // 'Moisture (g/d)',
        'Vitamin A (RAE/d)',
        'Vitamin B6 (mg/d)',
        // 'Linoleic acid (g/d)',
        'Sodium (mg/d)',
        // 'Total polyunsaturated fatty acids (g/d)',
        // 'Protein (g/d)',
        // 'Naturally occurring folate (mcg/d)',
        'Iron (mg/d)',
        // 'Total saturated fats (g/d)',
        'Total sugars (g/d)',
        'Vitamin D (mcg/d)',
        // 'Total fats (g/d)',
        'Thiamin (mg/d)',
        'Percentage of total energy intake from linoleic acid',
        'Cholesterol (mg/d)',
        // 'Folacin (mcg/d)',
        // 'Percentage of total energy intake from polyunsaturated fats',
        'Vitamin B12 (mcg/d)',
        'Total carbohydrates (g/d)',
        'Percentage of total energy intake from saturated fats',
        'Zinc (mg/d)',
        'Total dietary fibre (g/d)'
    ].sort();
    const sexCategories = [
        'Male',
        'Female',
        // 'Both'
    ];

    // Filter the data according to dropdown menu selections
    const sexDropdown = d3.select("#sexDropdown");
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
        .attr("id", "ageDropdownSelector")
        .style("width", "100%")
        .on("change", draw_curves)
        .selectAll("option")
        .data(ageCategories)
        .enter()
        .append("option")
        .text(function (d) {
            return d;
        });


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
    let nutrient = $("#nutrientDropdownSelector option:selected").text();
    let age = $("#ageDropdownSelector option:selected").text();

    // Filter data according to dropdown selection
    data = master_data[age][nutrient][sex];

    //Create SVG element
    let svgContainer = d3.select("#distribution-chart");
    let svg = svgContainer
        .append("svg")
        .attr("width", w + margin.left + margin.right)
        .attr("height", h + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // track whether to draw curve or not
    let renderYearTracker = {
        2004: true,
        2015: true
    };

    let renderAdequacyTracker = {
        render_exceedance: false,
        render_adequacy: false
    };

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

    // Setup area curve container
    let curves = svg.append("g").attr("class", "curves");


    // track whether or not to draw limit line
    let drawLimit = true;

    // checkbox functionality
    d3.select("#checkbox2004").attr("checked", "checked").on("change", year_tickbox);
    d3.select("#checkbox2015").attr("checked", "checked").on("change", year_tickbox);
    d3.select("#checkboxLimit").attr("checked", "checked").on("change", limit_tickbox);

    // Plot UL/AI
    let referenceCode = 0;
    let adequacyVal = 0;
    let exceedanceVal = 0;
    let ul = svg.append("g").attr("class", "upper-limit");
    let lineGenerator = d3.line();
    let activeReferenceObject = {};

    // Legend
    let legend = svg.selectAll(".legend")
        .data(yearCategories)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function (d, i) {
            return "translate(0," + i * 20 + ")";
        })
        .style("opacity", "1");

    legend.append("rect")
        .attr("x", w + margin.right / 4)
        .attr("width", 15)
        .attr("height", 15)
        .style("fill", function (d) {
            return colourScale(d);
        })
        .on("mouseover", function () {
                d3.select(this).style("fill", function (d) {
                    return d3.rgb(colourScale(d)).darker(1);
                });
            }
        )
        .on("mouseout", function () {
                d3.select(this).style("fill", function (d) {
                    return d3.rgb(colourScale(d)).brighter(1);
                });
            }
        )
        // Spoof clicking the tick boxes
        .on("click", function (d) {
            $(`#checkbox${d}`).click()
        });

    legend.append("text")
        .attr("x", w + margin.right / 2)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "left")
        .text(function (d) {
            return d;
        });


    // Enter the initial dataset
    draw_curves();

    function draw_limit() {
        // Prepare adequacy line data
        adequacyVal = activeReferenceObject['Adequacy-Value'];
        let adequacyPoints = [
            [xAxis(adequacyVal), yAxis(0)],
            [xAxis(adequacyVal), yAxis(yExtent[1])],
        ];
        let adequacyPathData = lineGenerator(adequacyPoints);

        // Adequacy line
        ul.selectAll(".adequacy-line").data([null]).join(
            enter => enter
                .append("path")
                .attr("class", "adequacy-line")
                .style("stroke", "black")
                .style("stroke-dasharray", "2, 2")
                .style("opacity", 1)
                .attr('d', function () {
                    if (drawLimit && renderAdequacyTracker.render_adequacy) {
                        return adequacyPathData
                    } else {
                        return 0
                    }
                }),
            update => update
            // .transition()
            // .duration(100)
                .attr('d', function () {
                        if (drawLimit && renderAdequacyTracker.render_adequacy) {
                            return adequacyPathData
                        } else {
                            return 0
                        }
                    }
                ));

        let textPadding = 5; // Controls height of text above yMax

        // Adequacy text
        let adequacyTypeText = null;
        if (typeof activeReferenceObject['Adequacy-Type'] == "string") {
            adequacyTypeText = activeReferenceObject['Adequacy-Type'];
        }

        ul.selectAll(".adequacy-line-text").data([null]).join(
            enter => enter
                .append("text")
                .attr("class", "adequacy-line-text")
                .attr("x", xAxis(adequacyVal))
                .attr("y", yAxis(yExtent[1]) - textPadding)
                .style("text-anchor", "middle")
                .text(adequacyTypeText),
            update => update
            // .attr("x", xAxis(adequacyVal))
            // .attr("y", -100)
            // .transition()
            // .duration(500)
                .attr("x", xAxis(adequacyVal))
                .attr("y", yAxis(yExtent[1]) - textPadding)
                .text(function () {
                    if (drawLimit && renderAdequacyTracker.render_adequacy) {
                        return adequacyTypeText
                    } else {
                        return null;
                    }
                })
        );

        // Prepare exceedance line data
        exceedanceVal = activeReferenceObject['Excess-Value'];
        let exceedancePoints = [
            [xAxis(exceedanceVal), yAxis(0)],
            [xAxis(exceedanceVal), yAxis(yExtent[1])],
        ];
        let exceedancePathData = lineGenerator(exceedancePoints);

        // Exceedance line
        ul.selectAll(".exceedance-line").data([null]).join(
            enter => enter
                .append("path")
                .attr("class", "exceedance-line")
                .style("stroke", "black")
                .style("stroke-dasharray", "2, 2")
                .style("opacity", 1)
                .attr('d', function () {
                    if (drawLimit) {
                        return exceedancePathData
                    } else {
                        return 0
                    }
                }),
            update => update
            // .transition()
            // .duration(100)
                .attr('d', function () {
                        if (drawLimit && renderAdequacyTracker.render_exceedance) {
                            return exceedancePathData
                        } else {
                            return 0
                        }
                    }
                ));

        // Exceedance text
        let exceedanceTypeText = null;
        if (typeof activeReferenceObject['Excess-Type'] == "string") {
            exceedanceTypeText = activeReferenceObject['Excess-Type'];
        }
        ul.selectAll(".exceedance-line-text").data([null]).join(
            enter => enter
                .append("text")
                .attr("class", "exceedance-line-text")
                .attr("x", xAxis(exceedanceVal))
                .attr("y", yAxis(yExtent[1]) - textPadding)
                .style("text-anchor", "middle")
                .text(exceedanceTypeText),
            update => update
            // .transition()
            // .duration(500)
                .attr("x", xAxis(exceedanceVal))
                .attr("y", yAxis(yExtent[1]) - textPadding)
                .text(function () {
                    if (drawLimit && renderAdequacyTracker.render_exceedance) {
                        return exceedanceTypeText
                    } else {
                        return null;
                    }
                })
        )
    }

    function draw_curves() {
        // Main method for drawing the curves, limit lines, and updating the axes

        // Grab most recent user selected data
        age = $("#ageDropdownSelector option:selected").text();
        nutrient = $("#nutrientDropdownSelector option:selected").text();
        sex = $("#sexDropdownSelector option:selected").text();

        // Store new dataset
        data = master_data[age][nutrient][sex];

        // Grab reference code --> gets used in draw_limit() and retrieves pertinent adequacy/exceedance reference code
        referenceCode = data[0]['ref_code'];
        activeReferenceObject = retrieve_reference_values(referenceCode);
        update_render_tracker_adequacy(activeReferenceObject);

        // Update x-axis min and max values
        xExtent = d3.extent(data, d => d.x);
        let minX = xExtent[0];
        let maxX = xExtent[1];

        if (drawLimit) {
            // Determine if maxX needs to be adjusted
            if (renderAdequacyTracker.render_adequacy && (activeReferenceObject['Adequacy-Value'] > maxX)) {
                maxX = activeReferenceObject['Adequacy-Value']
            }
            if (renderAdequacyTracker.render_exceedance && (activeReferenceObject['Excess-Value'] > maxX)) {
                maxX = activeReferenceObject['Excess-Value']
            }

            // Determine if minX needs to be adjusted
            if (renderAdequacyTracker.render_adequacy && (activeReferenceObject['Adequacy-Value'] < minX)) {
                minX = activeReferenceObject['Adequacy-Value']
            }
            if (renderAdequacyTracker.render_exceedance && (activeReferenceObject['Excess-Value'] < minX)) {
                minX = activeReferenceObject['Excess-Value']
            }
        }

        // Update x-axis
        xAxis = d3.scaleLinear()
            .domain([minX, maxX]) // data range
            .range([0, w]); // pixel range

        // Update y-axis
        yExtent = d3.extent(data, d => d.y);
        yAxis = d3.scaleLinear()
            .domain([yExtent[0], yExtent[1]])
            .range([h, 0]);

        svg.select(".y-axis").transition().duration(500).call(d3.axisLeft(yAxis));
        svg.select(".x-axis").call(d3.axisBottom(xAxis));

        svg.selectAll(".y-axis .tick").remove();  // This removes the ticks and text for the y-axis

        // Nest data by year so we can draw the two curves separately
        data = d3.nest()
            .key(function (d) {
                return d['Year'];
            })
            .object(data);

        // Draw area curve for each year
        for (const year of yearCategories) {
            curves.selectAll(`.curve-${year}`)
                .data([data[year]])
                .join(
                    enter => enter.append("path")
                        .attr("class", `curve-${year}`)
                        .attr("fill", colourScale(year))
                        .attr("fill-opacity", "0")
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
                            if (renderYearTracker[year]) {
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
                                if (renderYearTracker[year]) {
                                    return yAxis(d.y);
                                } else {
                                    return yAxis(0)
                                }
                            })
                        )
                );
        }
        draw_limit();
    }

    function update_render_tracker_adequacy(reference_object) {
        // There are cases where one value is available, both values are available, and neither value is available.
        // The graphic must respond accordingly.

        // True if there's a string value available
        let adequacy_type_available = typeof (reference_object['Adequacy-Type']) == "string";
        let exceedance_type_available = typeof (reference_object['Excess-Type']) == "string";

        // Update the render object
        renderAdequacyTracker.render_adequacy = adequacy_type_available;
        renderAdequacyTracker.render_exceedance = exceedance_type_available;
    }

    function retrieve_reference_values(refCode) {
        // Grabs the Adequacy-Value, Adequacy-Type, Excess-Value, and Excess-Type for a particular reference code
        let ids = [refCode];
        let reference_object = coding_object.filter(i => ids.includes(i['Ref-code']));
        return reference_object[0]['metadata']
    }

    function year_tickbox() {
        // Updates the renderYearTracker bool status for each year depending on whether the tickbox is checked or not
        renderYearTracker[2004] = !!d3.select("#checkbox2004").property("checked");
        renderYearTracker[2015] = !!d3.select("#checkbox2015").property("checked");
        draw_curves();
    }

    function limit_tickbox() {
        // Updates the drawLimit bool depending on user selection for the Limit Value(s) tickbox
        drawLimit = !!d3.select("#checkboxLimit").property("checked");
        draw_curves();
    }

});

// Hard-coded reference values for each Nutrient/Sex/Age group (each is assigned its own unique ref-code)
// Values were generated with reformat_distribution_data.ipynb script
// ../CCHSNutritionViz/DistributionData2019Raw/DistributionReferenceValues-EN.json

const coding_object = [
    {
        "Ref-code": 0,
        "metadata": {
            "Adequacy-Value": 500.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 2500.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 1,
        "metadata": {
            "Adequacy-Value": 800.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 2500.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 2,
        "metadata": {
            "Adequacy-Value": 1100.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 3000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 3,
        "metadata": {
            "Adequacy-Value": 1100.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 3000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 4,
        "metadata": {
            "Adequacy-Value": 1100.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 3000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 5,
        "metadata": {
            "Adequacy-Value": 1100.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 3000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 6,
        "metadata": {
            "Adequacy-Value": 800.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 2500.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 7,
        "metadata": {
            "Adequacy-Value": 800.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 2500.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 8,
        "metadata": {
            "Adequacy-Value": 800.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 2500.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 9,
        "metadata": {
            "Adequacy-Value": 800.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 2500.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 10,
        "metadata": {
            "Adequacy-Value": 800.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 2000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 11,
        "metadata": {
            "Adequacy-Value": 1000.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 2000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 12,
        "metadata": {
            "Adequacy-Value": 1000.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 2000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 13,
        "metadata": {
            "Adequacy-Value": 1000.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 2000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 14,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 15,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 16,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 63.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 17,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 75.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 18,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 100.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 19,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 100.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 20,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 100.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 21,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 100.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 22,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 100.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 23,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 100.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 24,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 100.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 25,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 100.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 26,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 100.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 27,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 100.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 28,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 100.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 29,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 100.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 30,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 100.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 31,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 100.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 32,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": 40.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 33,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": 40.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 34,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": 40.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 35,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": 40.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 36,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": 45.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 37,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": 45.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 38,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": 45.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 39,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": 45.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 40,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": 45.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 41,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": 45.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 42,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": 45.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 43,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": 45.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 44,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": 45.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 45,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": 45.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 46,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": 45.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 47,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": 45.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 48,
        "metadata": {
            "Adequacy-Value": 800.0,
            "Adequacy-Type": "AI",
            "Excess-Value": 1200.0,
            "Excess-Type": "CDRR"
        }
    },
    {
        "Ref-code": 49,
        "metadata": {
            "Adequacy-Value": 1000.0,
            "Adequacy-Type": "AI",
            "Excess-Value": 1500.0,
            "Excess-Type": "CDRR"
        }
    },
    {
        "Ref-code": 50,
        "metadata": {
            "Adequacy-Value": 1200.0,
            "Adequacy-Type": "AI",
            "Excess-Value": 1800.0,
            "Excess-Type": "CDRR"
        }
    },
    {
        "Ref-code": 51,
        "metadata": {
            "Adequacy-Value": 1200.0,
            "Adequacy-Type": "AI",
            "Excess-Value": 1800.0,
            "Excess-Type": "CDRR"
        }
    },
    {
        "Ref-code": 52,
        "metadata": {
            "Adequacy-Value": 1500.0,
            "Adequacy-Type": "AI",
            "Excess-Value": 2300.0,
            "Excess-Type": "CDRR"
        }
    },
    {
        "Ref-code": 53,
        "metadata": {
            "Adequacy-Value": 1500.0,
            "Adequacy-Type": "AI",
            "Excess-Value": 2300.0,
            "Excess-Type": "CDRR"
        }
    },
    {
        "Ref-code": 54,
        "metadata": {
            "Adequacy-Value": 1500.0,
            "Adequacy-Type": "AI",
            "Excess-Value": 2300.0,
            "Excess-Type": "CDRR"
        }
    },
    {
        "Ref-code": 55,
        "metadata": {
            "Adequacy-Value": 1500.0,
            "Adequacy-Type": "AI",
            "Excess-Value": 2300.0,
            "Excess-Type": "CDRR"
        }
    },
    {
        "Ref-code": 56,
        "metadata": {
            "Adequacy-Value": 1500.0,
            "Adequacy-Type": "AI",
            "Excess-Value": 2300.0,
            "Excess-Type": "CDRR"
        }
    },
    {
        "Ref-code": 57,
        "metadata": {
            "Adequacy-Value": 1500.0,
            "Adequacy-Type": "AI",
            "Excess-Value": 2300.0,
            "Excess-Type": "CDRR"
        }
    },
    {
        "Ref-code": 58,
        "metadata": {
            "Adequacy-Value": 1500.0,
            "Adequacy-Type": "AI",
            "Excess-Value": 2300.0,
            "Excess-Type": "CDRR"
        }
    },
    {
        "Ref-code": 59,
        "metadata": {
            "Adequacy-Value": 1500.0,
            "Adequacy-Type": "AI",
            "Excess-Value": 2300.0,
            "Excess-Type": "CDRR"
        }
    },
    {
        "Ref-code": 60,
        "metadata": {
            "Adequacy-Value": 1500.0,
            "Adequacy-Type": "AI",
            "Excess-Value": 2300.0,
            "Excess-Type": "CDRR"
        }
    },
    {
        "Ref-code": 61,
        "metadata": {
            "Adequacy-Value": 1500.0,
            "Adequacy-Type": "AI",
            "Excess-Value": 2300.0,
            "Excess-Type": "CDRR"
        }
    },
    {
        "Ref-code": 62,
        "metadata": {
            "Adequacy-Value": 1500.0,
            "Adequacy-Type": "AI",
            "Excess-Value": 2300.0,
            "Excess-Type": "CDRR"
        }
    },
    {
        "Ref-code": 63,
        "metadata": {
            "Adequacy-Value": 1500.0,
            "Adequacy-Type": "AI",
            "Excess-Value": 2300.0,
            "Excess-Type": "CDRR"
        }
    },
    {
        "Ref-code": 64,
        "metadata": {
            "Adequacy-Value": 2000.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 65,
        "metadata": {
            "Adequacy-Value": 2300.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 66,
        "metadata": {
            "Adequacy-Value": 2500.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 67,
        "metadata": {
            "Adequacy-Value": 2300.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 68,
        "metadata": {
            "Adequacy-Value": 3000.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 69,
        "metadata": {
            "Adequacy-Value": 2300.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 70,
        "metadata": {
            "Adequacy-Value": 3400.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 71,
        "metadata": {
            "Adequacy-Value": 2600.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 72,
        "metadata": {
            "Adequacy-Value": 3400.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 73,
        "metadata": {
            "Adequacy-Value": 2600.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 74,
        "metadata": {
            "Adequacy-Value": 3400.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 75,
        "metadata": {
            "Adequacy-Value": 2600.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 76,
        "metadata": {
            "Adequacy-Value": 3400.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 77,
        "metadata": {
            "Adequacy-Value": 2600.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 78,
        "metadata": {
            "Adequacy-Value": 3400.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 79,
        "metadata": {
            "Adequacy-Value": 2600.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 80,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 81,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 82,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 83,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 84,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 85,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 86,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 87,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 88,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 89,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 90,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 91,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 92,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 93,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 94,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 95,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 96,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 97,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 98,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 99,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 100,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 101,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 102,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 103,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 104,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 105,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 106,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 107,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 108,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 109,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 110,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 111,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 112,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 113,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 114,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 115,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 116,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 117,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 118,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 119,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 120,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 121,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 122,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 123,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 124,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 125,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 126,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 127,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 128,
        "metadata": {
            "Adequacy-Value": 19.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 129,
        "metadata": {
            "Adequacy-Value": 25.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 130,
        "metadata": {
            "Adequacy-Value": 31.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 131,
        "metadata": {
            "Adequacy-Value": 26.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 132,
        "metadata": {
            "Adequacy-Value": 38.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 133,
        "metadata": {
            "Adequacy-Value": 26.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 134,
        "metadata": {
            "Adequacy-Value": 38.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 135,
        "metadata": {
            "Adequacy-Value": 25.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 136,
        "metadata": {
            "Adequacy-Value": 38.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 137,
        "metadata": {
            "Adequacy-Value": 25.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 138,
        "metadata": {
            "Adequacy-Value": 30.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 139,
        "metadata": {
            "Adequacy-Value": 21.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 140,
        "metadata": {
            "Adequacy-Value": 30.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 141,
        "metadata": {
            "Adequacy-Value": 21.0,
            "Adequacy-Type": "AI",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 142,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 143,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 144,
        "metadata": {
            "Adequacy-Value": 120.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 145,
        "metadata": {
            "Adequacy-Value": 160.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 146,
        "metadata": {
            "Adequacy-Value": 250.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 147,
        "metadata": {
            "Adequacy-Value": 250.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 148,
        "metadata": {
            "Adequacy-Value": 330.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 149,
        "metadata": {
            "Adequacy-Value": 330.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 150,
        "metadata": {
            "Adequacy-Value": 320.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 151,
        "metadata": {
            "Adequacy-Value": 320.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 152,
        "metadata": {
            "Adequacy-Value": 320.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 153,
        "metadata": {
            "Adequacy-Value": 320.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 154,
        "metadata": {
            "Adequacy-Value": 320.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 155,
        "metadata": {
            "Adequacy-Value": 320.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 156,
        "metadata": {
            "Adequacy-Value": 320.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 157,
        "metadata": {
            "Adequacy-Value": 320.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 158,
        "metadata": {
            "Adequacy-Value": 320.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 159,
        "metadata": {
            "Adequacy-Value": 320.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 160,
        "metadata": {
            "Adequacy-Value": 0.7,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 161,
        "metadata": {
            "Adequacy-Value": 1.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 162,
        "metadata": {
            "Adequacy-Value": 1.5,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 163,
        "metadata": {
            "Adequacy-Value": 1.5,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 164,
        "metadata": {
            "Adequacy-Value": 2.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 165,
        "metadata": {
            "Adequacy-Value": 2.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 166,
        "metadata": {
            "Adequacy-Value": 2.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 167,
        "metadata": {
            "Adequacy-Value": 2.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 168,
        "metadata": {
            "Adequacy-Value": 2.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 169,
        "metadata": {
            "Adequacy-Value": 2.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 170,
        "metadata": {
            "Adequacy-Value": 2.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 171,
        "metadata": {
            "Adequacy-Value": 2.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 172,
        "metadata": {
            "Adequacy-Value": 2.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 173,
        "metadata": {
            "Adequacy-Value": 2.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 174,
        "metadata": {
            "Adequacy-Value": 2.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 175,
        "metadata": {
            "Adequacy-Value": 2.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 176,
        "metadata": {
            "Adequacy-Value": 100.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 177,
        "metadata": {
            "Adequacy-Value": 100.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 178,
        "metadata": {
            "Adequacy-Value": 100.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 179,
        "metadata": {
            "Adequacy-Value": 100.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 180,
        "metadata": {
            "Adequacy-Value": 100.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 181,
        "metadata": {
            "Adequacy-Value": 100.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 182,
        "metadata": {
            "Adequacy-Value": 100.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 183,
        "metadata": {
            "Adequacy-Value": 100.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 184,
        "metadata": {
            "Adequacy-Value": 100.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 185,
        "metadata": {
            "Adequacy-Value": 100.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 186,
        "metadata": {
            "Adequacy-Value": 100.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 187,
        "metadata": {
            "Adequacy-Value": 100.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 188,
        "metadata": {
            "Adequacy-Value": 100.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 189,
        "metadata": {
            "Adequacy-Value": 100.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 190,
        "metadata": {
            "Adequacy-Value": 100.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 191,
        "metadata": {
            "Adequacy-Value": 100.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 192,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 193,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 194,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 195,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 196,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 197,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 198,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 199,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 200,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 201,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 202,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 203,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 204,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 205,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 206,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 207,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 208,
        "metadata": {
            "Adequacy-Value": 13.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 400.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 209,
        "metadata": {
            "Adequacy-Value": 22.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 650.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 210,
        "metadata": {
            "Adequacy-Value": 39.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 1200.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 211,
        "metadata": {
            "Adequacy-Value": 39.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 1200.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 212,
        "metadata": {
            "Adequacy-Value": 63.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 1800.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 213,
        "metadata": {
            "Adequacy-Value": 56.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 1800.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 214,
        "metadata": {
            "Adequacy-Value": 75.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 2000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 215,
        "metadata": {
            "Adequacy-Value": 60.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 2000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 216,
        "metadata": {
            "Adequacy-Value": 75.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 2000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 217,
        "metadata": {
            "Adequacy-Value": 60.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 2000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 218,
        "metadata": {
            "Adequacy-Value": 75.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 2000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 219,
        "metadata": {
            "Adequacy-Value": 60.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 2000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 220,
        "metadata": {
            "Adequacy-Value": 75.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 2000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 221,
        "metadata": {
            "Adequacy-Value": 60.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 2000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 222,
        "metadata": {
            "Adequacy-Value": 75.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 2000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 223,
        "metadata": {
            "Adequacy-Value": 60.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 2000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 224,
        "metadata": {
            "Adequacy-Value": 2.5,
            "Adequacy-Type": "EAR",
            "Excess-Value": 7.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 225,
        "metadata": {
            "Adequacy-Value": 4.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 12.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 226,
        "metadata": {
            "Adequacy-Value": 7.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 23.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 227,
        "metadata": {
            "Adequacy-Value": 7.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 23.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 228,
        "metadata": {
            "Adequacy-Value": 8.5,
            "Adequacy-Type": "EAR",
            "Excess-Value": 34.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 229,
        "metadata": {
            "Adequacy-Value": 7.3,
            "Adequacy-Type": "EAR",
            "Excess-Value": 34.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 230,
        "metadata": {
            "Adequacy-Value": 9.4,
            "Adequacy-Type": "EAR",
            "Excess-Value": 40.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 231,
        "metadata": {
            "Adequacy-Value": 6.8,
            "Adequacy-Type": "EAR",
            "Excess-Value": 40.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 232,
        "metadata": {
            "Adequacy-Value": 9.4,
            "Adequacy-Type": "EAR",
            "Excess-Value": 40.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 233,
        "metadata": {
            "Adequacy-Value": 6.8,
            "Adequacy-Type": "EAR",
            "Excess-Value": 40.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 234,
        "metadata": {
            "Adequacy-Value": 9.4,
            "Adequacy-Type": "EAR",
            "Excess-Value": 40.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 235,
        "metadata": {
            "Adequacy-Value": 6.8,
            "Adequacy-Type": "EAR",
            "Excess-Value": 40.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 236,
        "metadata": {
            "Adequacy-Value": 9.4,
            "Adequacy-Type": "EAR",
            "Excess-Value": 40.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 237,
        "metadata": {
            "Adequacy-Value": 6.8,
            "Adequacy-Type": "EAR",
            "Excess-Value": 40.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 238,
        "metadata": {
            "Adequacy-Value": 9.4,
            "Adequacy-Type": "EAR",
            "Excess-Value": 40.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 239,
        "metadata": {
            "Adequacy-Value": 6.8,
            "Adequacy-Type": "EAR",
            "Excess-Value": 40.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 240,
        "metadata": {
            "Adequacy-Value": 65.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 241,
        "metadata": {
            "Adequacy-Value": 110.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 242,
        "metadata": {
            "Adequacy-Value": 200.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 243,
        "metadata": {
            "Adequacy-Value": 200.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 244,
        "metadata": {
            "Adequacy-Value": 340.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 245,
        "metadata": {
            "Adequacy-Value": 300.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 246,
        "metadata": {
            "Adequacy-Value": 330.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 247,
        "metadata": {
            "Adequacy-Value": 255.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 248,
        "metadata": {
            "Adequacy-Value": 350.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 249,
        "metadata": {
            "Adequacy-Value": 265.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 250,
        "metadata": {
            "Adequacy-Value": 350.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 251,
        "metadata": {
            "Adequacy-Value": 265.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 252,
        "metadata": {
            "Adequacy-Value": 350.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 253,
        "metadata": {
            "Adequacy-Value": 265.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 254,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 255,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 256,
        "metadata": {
            "Adequacy-Value": 210.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 257,
        "metadata": {
            "Adequacy-Value": 275.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 258,
        "metadata": {
            "Adequacy-Value": 445.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 259,
        "metadata": {
            "Adequacy-Value": 420.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 260,
        "metadata": {
            "Adequacy-Value": 630.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 261,
        "metadata": {
            "Adequacy-Value": 485.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 262,
        "metadata": {
            "Adequacy-Value": 625.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 263,
        "metadata": {
            "Adequacy-Value": 500.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 264,
        "metadata": {
            "Adequacy-Value": 625.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 265,
        "metadata": {
            "Adequacy-Value": 500.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 266,
        "metadata": {
            "Adequacy-Value": 625.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 267,
        "metadata": {
            "Adequacy-Value": 500.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 268,
        "metadata": {
            "Adequacy-Value": 625.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 269,
        "metadata": {
            "Adequacy-Value": 500.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 270,
        "metadata": {
            "Adequacy-Value": 625.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 271,
        "metadata": {
            "Adequacy-Value": 500.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 272,
        "metadata": {
            "Adequacy-Value": 45.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 65.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 273,
        "metadata": {
            "Adequacy-Value": 45.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 65.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 274,
        "metadata": {
            "Adequacy-Value": 45.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 65.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 275,
        "metadata": {
            "Adequacy-Value": 45.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 65.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 276,
        "metadata": {
            "Adequacy-Value": 45.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 65.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 277,
        "metadata": {
            "Adequacy-Value": 45.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 65.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 278,
        "metadata": {
            "Adequacy-Value": 45.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 65.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 279,
        "metadata": {
            "Adequacy-Value": 45.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 65.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 280,
        "metadata": {
            "Adequacy-Value": 45.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 65.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 281,
        "metadata": {
            "Adequacy-Value": 45.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 65.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 282,
        "metadata": {
            "Adequacy-Value": 45.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 65.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 283,
        "metadata": {
            "Adequacy-Value": 45.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 65.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 284,
        "metadata": {
            "Adequacy-Value": 45.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 65.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 285,
        "metadata": {
            "Adequacy-Value": 45.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 65.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 286,
        "metadata": {
            "Adequacy-Value": 45.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 65.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 287,
        "metadata": {
            "Adequacy-Value": 45.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 65.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 288,
        "metadata": {
            "Adequacy-Value": 30.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 40.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 289,
        "metadata": {
            "Adequacy-Value": 25.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 35.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 290,
        "metadata": {
            "Adequacy-Value": 25.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 35.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 291,
        "metadata": {
            "Adequacy-Value": 25.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 35.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 292,
        "metadata": {
            "Adequacy-Value": 25.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 35.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 293,
        "metadata": {
            "Adequacy-Value": 25.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 35.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 294,
        "metadata": {
            "Adequacy-Value": 20.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 35.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 295,
        "metadata": {
            "Adequacy-Value": 20.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 35.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 296,
        "metadata": {
            "Adequacy-Value": 20.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 35.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 297,
        "metadata": {
            "Adequacy-Value": 20.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 35.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 298,
        "metadata": {
            "Adequacy-Value": 20.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 35.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 299,
        "metadata": {
            "Adequacy-Value": 20.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 35.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 300,
        "metadata": {
            "Adequacy-Value": 20.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 35.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 301,
        "metadata": {
            "Adequacy-Value": 20.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 35.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 302,
        "metadata": {
            "Adequacy-Value": 20.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 35.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 303,
        "metadata": {
            "Adequacy-Value": 20.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 35.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 304,
        "metadata": {
            "Adequacy-Value": 5.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 20.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 305,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 30.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 306,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 30.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 307,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 30.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 308,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 30.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 309,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 30.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 310,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 35.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 311,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 35.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 312,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 35.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 313,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 35.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 314,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 35.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 315,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 35.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 316,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 35.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 317,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 35.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 318,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 35.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 319,
        "metadata": {
            "Adequacy-Value": 10.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 35.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 320,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 321,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 322,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 323,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 324,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 325,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 326,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 327,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 328,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 329,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 330,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 331,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 332,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 333,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 334,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 335,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 336,
        "metadata": {
            "Adequacy-Value": 380.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 3000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 337,
        "metadata": {
            "Adequacy-Value": 405.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 3000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 338,
        "metadata": {
            "Adequacy-Value": 1055.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 4000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 339,
        "metadata": {
            "Adequacy-Value": 1055.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 4000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 340,
        "metadata": {
            "Adequacy-Value": 1055.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 4000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 341,
        "metadata": {
            "Adequacy-Value": 1055.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 4000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 342,
        "metadata": {
            "Adequacy-Value": 580.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 4000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 343,
        "metadata": {
            "Adequacy-Value": 580.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 4000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 344,
        "metadata": {
            "Adequacy-Value": 580.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 4000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 345,
        "metadata": {
            "Adequacy-Value": 580.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 4000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 346,
        "metadata": {
            "Adequacy-Value": 580.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 4000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 347,
        "metadata": {
            "Adequacy-Value": 580.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 4000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 348,
        "metadata": {
            "Adequacy-Value": 580.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 3000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 349,
        "metadata": {
            "Adequacy-Value": 580.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 3000.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 350,
        "metadata": {
            "Adequacy-Value": 580.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 351,
        "metadata": {
            "Adequacy-Value": 580.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 352,
        "metadata": {
            "Adequacy-Value": 0.4,
            "Adequacy-Type": "EAR",
            "Excess-Value": 30.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 353,
        "metadata": {
            "Adequacy-Value": 0.5,
            "Adequacy-Type": "EAR",
            "Excess-Value": 40.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 354,
        "metadata": {
            "Adequacy-Value": 0.8,
            "Adequacy-Type": "EAR",
            "Excess-Value": 60.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 355,
        "metadata": {
            "Adequacy-Value": 0.8,
            "Adequacy-Type": "EAR",
            "Excess-Value": 60.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 356,
        "metadata": {
            "Adequacy-Value": 1.1,
            "Adequacy-Type": "EAR",
            "Excess-Value": 80.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 357,
        "metadata": {
            "Adequacy-Value": 1.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": 80.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 358,
        "metadata": {
            "Adequacy-Value": 1.1,
            "Adequacy-Type": "EAR",
            "Excess-Value": 100.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 359,
        "metadata": {
            "Adequacy-Value": 1.1,
            "Adequacy-Type": "EAR",
            "Excess-Value": 100.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 360,
        "metadata": {
            "Adequacy-Value": 1.1,
            "Adequacy-Type": "EAR",
            "Excess-Value": 100.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 361,
        "metadata": {
            "Adequacy-Value": 1.1,
            "Adequacy-Type": "EAR",
            "Excess-Value": 100.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 362,
        "metadata": {
            "Adequacy-Value": 1.4,
            "Adequacy-Type": "EAR",
            "Excess-Value": 100.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 363,
        "metadata": {
            "Adequacy-Value": 1.3,
            "Adequacy-Type": "EAR",
            "Excess-Value": 100.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 364,
        "metadata": {
            "Adequacy-Value": 1.4,
            "Adequacy-Type": "EAR",
            "Excess-Value": 100.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 365,
        "metadata": {
            "Adequacy-Value": 1.3,
            "Adequacy-Type": "EAR",
            "Excess-Value": 100.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 366,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": 100.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 367,
        "metadata": {
            "Adequacy-Value": NaN,
            "Adequacy-Type": NaN,
            "Excess-Value": 100.0,
            "Excess-Type": "UL"
        }
    },
    {
        "Ref-code": 368,
        "metadata": {
            "Adequacy-Value": 5.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 369,
        "metadata": {
            "Adequacy-Value": 6.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 370,
        "metadata": {
            "Adequacy-Value": 9.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 371,
        "metadata": {
            "Adequacy-Value": 9.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 372,
        "metadata": {
            "Adequacy-Value": 12.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 373,
        "metadata": {
            "Adequacy-Value": 11.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 374,
        "metadata": {
            "Adequacy-Value": 12.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 375,
        "metadata": {
            "Adequacy-Value": 11.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 376,
        "metadata": {
            "Adequacy-Value": 12.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 377,
        "metadata": {
            "Adequacy-Value": 11.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 378,
        "metadata": {
            "Adequacy-Value": 12.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 379,
        "metadata": {
            "Adequacy-Value": 11.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 380,
        "metadata": {
            "Adequacy-Value": 12.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 381,
        "metadata": {
            "Adequacy-Value": 11.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 382,
        "metadata": {
            "Adequacy-Value": 12.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 383,
        "metadata": {
            "Adequacy-Value": 11.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 384,
        "metadata": {
            "Adequacy-Value": 0.4,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 385,
        "metadata": {
            "Adequacy-Value": 0.5,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 386,
        "metadata": {
            "Adequacy-Value": 0.8,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 387,
        "metadata": {
            "Adequacy-Value": 0.8,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 388,
        "metadata": {
            "Adequacy-Value": 1.1,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 389,
        "metadata": {
            "Adequacy-Value": 0.9,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 390,
        "metadata": {
            "Adequacy-Value": 1.1,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 391,
        "metadata": {
            "Adequacy-Value": 0.9,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 392,
        "metadata": {
            "Adequacy-Value": 1.1,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 393,
        "metadata": {
            "Adequacy-Value": 0.9,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 394,
        "metadata": {
            "Adequacy-Value": 1.1,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 395,
        "metadata": {
            "Adequacy-Value": 0.9,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 396,
        "metadata": {
            "Adequacy-Value": 1.1,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 397,
        "metadata": {
            "Adequacy-Value": 0.9,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 398,
        "metadata": {
            "Adequacy-Value": 1.1,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 399,
        "metadata": {
            "Adequacy-Value": 0.9,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 400,
        "metadata": {
            "Adequacy-Value": 0.4,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 401,
        "metadata": {
            "Adequacy-Value": 0.5,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 402,
        "metadata": {
            "Adequacy-Value": 0.7,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 403,
        "metadata": {
            "Adequacy-Value": 0.7,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 404,
        "metadata": {
            "Adequacy-Value": 1.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 405,
        "metadata": {
            "Adequacy-Value": 0.9,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 406,
        "metadata": {
            "Adequacy-Value": 1.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 407,
        "metadata": {
            "Adequacy-Value": 0.9,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 408,
        "metadata": {
            "Adequacy-Value": 1.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 409,
        "metadata": {
            "Adequacy-Value": 0.9,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 410,
        "metadata": {
            "Adequacy-Value": 1.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 411,
        "metadata": {
            "Adequacy-Value": 0.9,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 412,
        "metadata": {
            "Adequacy-Value": 1.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 413,
        "metadata": {
            "Adequacy-Value": 0.9,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 414,
        "metadata": {
            "Adequacy-Value": 1.0,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 415,
        "metadata": {
            "Adequacy-Value": 0.9,
            "Adequacy-Type": "EAR",
            "Excess-Value": NaN,
            "Excess-Type": NaN
        }
    },
    {
        "Ref-code": 416,
        "metadata": {
            "Adequacy-Value": 5.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 10.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 417,
        "metadata": {
            "Adequacy-Value": 5.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 10.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 418,
        "metadata": {
            "Adequacy-Value": 5.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 10.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 419,
        "metadata": {
            "Adequacy-Value": 5.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 10.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 420,
        "metadata": {
            "Adequacy-Value": 5.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 10.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 421,
        "metadata": {
            "Adequacy-Value": 5.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 10.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 422,
        "metadata": {
            "Adequacy-Value": 5.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 10.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 423,
        "metadata": {
            "Adequacy-Value": 5.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 10.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 424,
        "metadata": {
            "Adequacy-Value": 5.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 10.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 425,
        "metadata": {
            "Adequacy-Value": 5.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 10.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 426,
        "metadata": {
            "Adequacy-Value": 5.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 10.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 427,
        "metadata": {
            "Adequacy-Value": 5.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 10.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 428,
        "metadata": {
            "Adequacy-Value": 5.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 10.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 429,
        "metadata": {
            "Adequacy-Value": 5.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 10.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 430,
        "metadata": {
            "Adequacy-Value": 5.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 10.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 431,
        "metadata": {
            "Adequacy-Value": 5.0,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 10.0,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 432,
        "metadata": {
            "Adequacy-Value": 0.6,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 1.2,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 433,
        "metadata": {
            "Adequacy-Value": 0.6,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 1.2,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 434,
        "metadata": {
            "Adequacy-Value": 0.6,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 1.2,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 435,
        "metadata": {
            "Adequacy-Value": 0.6,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 1.2,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 436,
        "metadata": {
            "Adequacy-Value": 0.6,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 1.2,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 437,
        "metadata": {
            "Adequacy-Value": 0.6,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 1.2,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 438,
        "metadata": {
            "Adequacy-Value": 0.6,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 1.2,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 439,
        "metadata": {
            "Adequacy-Value": 0.6,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 1.2,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 440,
        "metadata": {
            "Adequacy-Value": 0.6,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 1.2,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 441,
        "metadata": {
            "Adequacy-Value": 0.6,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 1.2,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 442,
        "metadata": {
            "Adequacy-Value": 0.6,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 1.2,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 443,
        "metadata": {
            "Adequacy-Value": 0.6,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 1.2,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 444,
        "metadata": {
            "Adequacy-Value": 0.6,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 1.2,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 445,
        "metadata": {
            "Adequacy-Value": 0.6,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 1.2,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 446,
        "metadata": {
            "Adequacy-Value": 0.6,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 1.2,
            "Excess-Type": "AMDR - Upper bound"
        }
    },
    {
        "Ref-code": 447,
        "metadata": {
            "Adequacy-Value": 0.6,
            "Adequacy-Type": "AMDR - Lower bound",
            "Excess-Value": 1.2,
            "Excess-Type": "AMDR - Upper bound"
        }
    }
];
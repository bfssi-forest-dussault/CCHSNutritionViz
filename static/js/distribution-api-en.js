//Width and height
const margin = {top: 60, right: 80, bottom: 60, left: 80};
const w = 720 - margin.left - margin.right;
const h = 480 - margin.top - margin.bottom;

//Create SVG element
const svgContainer = d3.select("#distribution-chart");
const svg = svgContainer
    .append("svg")
    .attr("width", w + margin.left + margin.right)
    .attr("height", h + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

const x = svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${h})`);

const y = svg.append("g")
    .attr("class", "y-axis");

// Setup area curve container
const curves = svg.append("g").attr("class", "curves");

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
    .on("change", refreshData)
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
    .on("change", refreshData)
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
    .on("change", refreshData)
    .selectAll("option")
    .data(nutrientList)
    .enter()
    .append("option")
    .text(function (d) {
        return d;
    });
// Set default nutrient
$('select option:contains("Total energy intake")').prop('selected', true);

function getData(uri) {
    return d3.json(uri).then(function (data) {
        return data;
    })
}

async function refreshData() {
    // Get text selections
    let sex = $("#sexDropdownSelector option:selected").text();
    let nutrient = $("#nutrientDropdownSelector option:selected").text();
    let age = $("#ageDropdownSelector option:selected").text();

    let nutrient_ = nutrient.split(" ").join("%20");
    let age_ = age.split(" ").join("%20");
    // Build URI for API
    let apiUri = `http://0.0.0.0:8000/api/nutrient_distribution/?nutrient=${nutrient_}&sex=${sex}&age_group_value=${age_}`;
    console.log(apiUri);
    // Get data
    let data = await getData(apiUri);

    // Iterate over every column and cast it to a float if it looks like a number TODO: might be unnecessary, remove
    data.forEach(function (obj) {
            Object.keys(obj).map(function (a) {
                if (!isNaN(obj[a])) {
                    obj[a] = parseFloat(obj[a]);
                }
            })
        }
    );

    data = d3.nest()
        .key(function (d) {
            return d['age_group_value'];
        })
        .key(function (d) {
            return d['nutrient'];
        })
        .key(function (d) {
            return d['sex'];
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

    // Filter data according to dropdown selection
    data = master_data[age][nutrient][sex];

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

    x.call(d3.axisBottom(xAxis));

    // yAxis for density function values
    let yExtent = d3.extent(data, d => d.y);
    let yAxis = d3.scaleLinear()
        .domain([yExtent[0], yExtent[1]])
        .range([h, 0]);


    y.call(d3.axisLeft(yAxis));

    const colourScale = d3.scaleOrdinal().range(["#003ce3", "#e200c1"]);

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

    // console.log(data);

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
        // Store new dataset
        data = master_data[age][nutrient][sex];

        // Grab reference code --> gets used in draw_limit() and retrieves pertinent adequacy/exceedance reference code
        // referenceCode = data[0]['ref_code'];
        // activeReferenceObject = retrieve_reference_values(referenceCode);
        // update_render_tracker_adequacy(activeReferenceObject);

        // Update x-axis min and max values
        xExtent = d3.extent(data, d => d.x);
        let minX = xExtent[0];
        let maxX = xExtent[1];

        // if (drawLimit) {
        //     // Determine if maxX needs to be adjusted
        //     if (renderAdequacyTracker.render_adequacy && (activeReferenceObject['Adequacy-Value'] > maxX)) {
        //         maxX = activeReferenceObject['Adequacy-Value']
        //     }
        //     if (renderAdequacyTracker.render_exceedance && (activeReferenceObject['Excess-Value'] > maxX)) {
        //         maxX = activeReferenceObject['Excess-Value']
        //     }
        //
        //     // Determine if minX needs to be adjusted
        //     if (renderAdequacyTracker.render_adequacy && (activeReferenceObject['Adequacy-Value'] < minX)) {
        //         minX = activeReferenceObject['Adequacy-Value']
        //     }
        //     if (renderAdequacyTracker.render_exceedance && (activeReferenceObject['Excess-Value'] < minX)) {
        //         minX = activeReferenceObject['Excess-Value']
        //     }
        // }

        // Update x-axis
        xAxis = d3.scaleLinear()
            .domain([minX, maxX]) // data range
            .range([0, w]); // pixel range

        // Update y-axis
        yExtent = d3.extent(data, d => d.y);
        yAxis = d3.scaleLinear()
            .domain([yExtent[0], yExtent[1]])
            .range([h, 0]);

        y.transition().duration(500).call(d3.axisLeft(yAxis));
        x.call(d3.axisBottom(xAxis));

        svg.selectAll(".y-axis .tick").remove();  // This removes the ticks and text for the y-axis

        // Nest data by year so we can draw the two curves separately
        data = d3.nest()
            .key(function (d) {
                return d['year'];
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

}


$(document).ready(refreshData());


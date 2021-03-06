//Width and height
var margin = { top: 20, right: 80, bottom: 50, left: 80 };
var w = 640 - margin.left - margin.right;
var h = 480 - margin.top - margin.bottom;

function stripECoerceToFloat(val) {
    // Removes 'E' character from string then coerces to float. Used for the mean_se column from the dataset.
    var val_ = val.replace('E', '');
    return parseFloat(val_);
}


d3.csv("static/data/NutritionByRegion_Sept2019.csv", function(d) {
    return {
        // Rendered data
        nutrient: d['Nutrient/Item (unit)'],
        sample_size: +d['n'],
        year: +d['Year'],
        sex: d['Sex'],
        mean: +d['Mean'],
        mean_se: +stripECoerceToFloat(d['SE_Mean']),
        e_flag: d['e_flag'], // Detects presence of 'E' in original SE_Mean column before processing
        confidence_interval: +(stripECoerceToFloat(d['SE_Mean']) * 1.96), // 1.96xSEM = 95% confidence interval
        ear: d['EAR'],
        pct_ear: d['% <EAR'],
        ai: d['AI'],
        pct_ai: d['% >AI'],
        ul: d['UL'],
        pct_ul: d['% >UL'],
        cdrr: d['CDRR'],
        pct_cdrr: d['% >CDRR'],
        pct_amdr: d['% within AMDR'],
        region: d['Reg_Prov'],
        age: d['Age (years)'],

        // Data to include in table
        p5: d['P5'],
        p5_se: d['P5_SE'],
        p10: d['P10'],
        p10_se: d['P10_SE'],
        p25: d['P25'],
        p25_se: d['P25_SE'],
        p50: d['P50'],
        p50_se: d['P50_SE'],
        p75: d['P75'],
        p75_se: d['P75_SE'],
        p90: d['P90'],
        p90_se: d['P90_SE'],
        p95: d['P95'],
        p95_se: d['P95_SE'],

        ear_pct_se: d['%<EAR_SE'],
        ear_pct_se_p: d['p-value_%EAR'],

        ai_pct_se: d['%>AI_SE'],
        ai_pct_p: d['p-value_%AI'],

        ul_pct_se: d['%>UL_SE'],
        ul_pct_p: d['p-value_%UL'],

        amdr: d['AMDR'],
        amdr_pct_below: d['% below AMDR'],
        amdr_pct_below_p: d['p-value % below AMDR'],
        amdr_pct_below_se: d['% below AMDR_SE'],
        amdr_pct_within_se: d['% within AMDR_SE'],
        amdr_pct_within_p: d['p-value  % within AMDR'],
        amdr_pct_above: d['% above AMDR'],
        amdr_pct_above_p: d['p-value % above AMDR'],
        amdr_pct_above_se: d['% above AMDR_SE'],

        cdrr_pct_se: d['%>CDRR_SE'],
        cdrr_pct_p: d['p-value_%CDRR'],

        inad_pct: d['%Inadequacy'],
        inad_pct_se: d['%Inadequacy_SE'],
        inad_pct_p: d['p_value %Inadequacy']
    };
}).then(function(data) {
    data = d3.nest()
        .key(function(d) {
            return d.sex;
        })
        .key(function(d) {
            return d.region;
        })
        .key(function(d) {
            return d.nutrient;
        })
        .object(data);

    // Store unaltered data here to deal with updated user dropdown selections
    var master_data = data;

    // Dropdown menus
    var sexDropdown = d3.select("#sexDropdown");
    var provinceDropdown = d3.select("#provinceDropdown");
    var nutrientDropdown = d3.select("#nutrientDropdown");

    var regionList = [
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
    ];
    var nutrientList = [
        'Total energy intake (kcal/d)',
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
        'Percentage of total energy intake from protein',
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
        'Iron (mg/d)',
        'Total saturated fats (g/d)',
        'Total sugars (g/d)',
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
    ];

    // Categories for chart labelling
    var ageCategories = ['9-13', '14-18', '19-30', '31-50',
        '51-70', '19 years and over', '71 years and over'
    ];
    var sexCategories = ['Male', 'Female', 'Both'];
    var yearCategories = ['2004', '2015'];

    // Setup dropdown menus
    sexDropdown.append("select")
        .attr("class", "select form-control")
        .attr("id", "sexDropdownSelector")
        .style("width", "100%")
        .on("change", updateData)
        .selectAll("option")
        .data(sexCategories)
        .enter()
        .append("option")
        .text(function(d) {
            return d;
        });

    provinceDropdown.append("select")
        .attr("class", "select form-control")
        .attr("id", "provinceDropdownSelector")
        .style("width", "100%")
        .on("change", updateData)
        .selectAll("option")
        .data(regionList)
        .enter()
        .append("option")
        .text(function(d) {
            return d;
        });

    nutrientDropdown.append("select")
        .attr("class", "select form-control")
        .attr("id", "nutrientDropdownSelector")
        .style("width", "100%")
        .on("change", updateData)
        .selectAll("option")
        .data(nutrientList)
        .enter()
        .append("option")
        .text(function(d) {
            return d;
        });

    // Headers to render in the HTML data table
    // Note that we have to escape the < character with &lt;
    let nutrient_headers = [
        'Nutrient',
        'Region / Province',
        'Year',
        'Sex',
        'Age',
        'Sample size',
        'Mean',
        'Mean SE',
        'EAR',
        '% &lt;EAR',
        'AI',
        '% > AI',
        'UL',
        '% > UL',
        'CDRR',
        '% > CDRR',
        // Extra table-only data
        'P5',
        'P5_SE',
        'P10',
        'P10_SE',
        'P25',
        'P25_SE',
        'P50',
        'P50_SE',
        'P75',
        'P75_SE',
        'P90',
        'P90_SE',
        'P95',
        'P95_SE',
        '%&lt;EAR_SE',
        'p-value_%EAR',
        '%>AI_SE',
        'p-value_%AI',
        '%>UL_SE',
        'p-value_%UL',
        'AMDR',
        '% below AMDR',
        'p-value % below AMDR',
        '% below AMDR_SE',
        '% within AMDR_SE',
        'p-value  % within AMDR',
        '% above AMDR',
        'p-value % above AMDR',
        '% above AMDR_SE',
        '%>CDRR_SE',
        'p-value_%CDRR',
        '%Inadequacy',
        '%Inadequacy_SE',
        'p_value %Inadequacy',
    ];


    // Header row template
    let headerRow = headerVal => `<th style="white-space: nowrap">${headerVal}</th>`;
    // Select header row and populate with <th>
    $('.datatable-headers').html(nutrient_headers.map(headerRow).join(''));


    // Filter the data according to dropdown menu selections
    var sex = $("#sexDropdownSelector option:selected").text();
    var region = $("#provinceDropdownSelector option:selected").text();
    var nutrient = $("#nutrientDropdownSelector option:selected").text();

    data = master_data[sex][region][nutrient];

    // Nest again, this time returning entries instead of an object using 'age'
    data = d3.nest()
        .key(function(d) {
            return d.age;
        })
        .entries(data);

    // Colors for bars
    var color_range = d3.scaleOrdinal()
        .range(["#0571b0", "#ca0020", "#727272"]);

    // Iterate through data to find max y-value (mean + confidence interval)
    var upperValues = [];
    Object.keys(data).forEach(
        function(key) {
            for (var i = 0; i < data[key].values.length; i++) {
                upperValues.push(data[key].values[i].mean + data[key].values[i].confidence_interval);
            }
        }
    );
    var maxValueY = d3.max(upperValues);

    // xScale setup
    var xScale0 = d3.scaleBand()
        .domain(ageCategories) // Age categories go here (domain of values to use for xAxis)
        .rangeRound([0, w]); // pixel range for categories

    // Sub xScale containing a domain range for each year category (2004, 2015)
    var xScale1 = d3.scaleBand()
        .domain(yearCategories)
        .rangeRound([0, xScale0.bandwidth()]);

    // xAxis setup
    var xAxis = d3.axisBottom()
        .scale(xScale0)
        .tickFormat(function(d) { // Fit the text on the chart
            switch (d) {
                case "19 years and over":
                    return ">= 19";
                case "71 years and over":
                    return ">= 71";
                default:
                    return d;
            }
        });

    // yScale with previously calculated max y-value (mean)
    var yScale = d3.scaleLinear()
        .domain([0, maxValueY])
        .range([h, 0]);

    // yAxis setup
    var yAxis = d3.axisLeft()
        .scale(yScale)
        .ticks(5)
        .tickSizeOuter(2);

    //Create SVG element
    var svgContainer = d3.select("#barchart");
    var svg = svgContainer
        .append("svg")
        .attr("width", w + margin.left + margin.right)
        .attr("height", h + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Gridlines setup
    svg.append("g")
        .attr("class", "grid")
        .call(make_y_gridlines()
            .tickSize(-w)
            .tickFormat("")
        );

    // X Axis placement and text label
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + h + ")")
        .call(xAxis);

    svg.append("text")
        .attr("transform",
            "translate(" + (w / 2) + " ," +
            (h + margin.top + 25) + ")")
        .style("text-anchor", "middle")
        .text("Age group (years)");

    // Y Axis placement and text label
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    svg.append("text")
        .attr("id", "y-axis-text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (h / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Mean " + nutrient);

    //Legend
    var legend = svg.selectAll(".legend")
        .data(yearCategories)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) {
            return "translate(0," + i * 20 + ")";
        })
        .style("opacity", "0");

    legend.append("rect")
        .attr("x", h + 80)
        .attr("width", 15)
        .attr("height", 15)
        .style("fill", function(d) {
            return color_range(d);
        });

    legend.append("text")
        .attr("x", w + 70)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) {
            return d;
        });

    legend.transition().duration(500).delay(function(d, i) {
        return 200 + 100 * i;
    }).style("opacity", "1");

    // Drawing the chart
    updateData();

    d3.select("#barchart")
        .append("div")
        .attr("style", "width:100%")
        .html(
            `
            <div class="row">
                    <caption class='wb-inv'><i>* Error bars represent the 95% confidence interval.</i></caption>
            </div>
            <div class="row">
                    <caption class='wb-inv'><i>** Hashed bars should be interpreted with caution.</i></caption>
            </div>
            <br>
            `
        );

    // Save chart functionality (Source: https://github.com/exupero/saveSvgAsPng) 
    d3.select("#saveChart")
        .on('click', function() {
            // Get the d3js SVG element and save using saveSvgAsPng.js
            saveSvgAsPng(document.getElementsByTagName("svg")[0], "chart.png", { scale: 2, backgroundColor: "#FFFFFF" });
        });

    // Gridline functions
    function make_y_gridlines() {
        return d3.axisLeft(yScale)
            .ticks(5);
    }

    // Update the rendered dataset depending on selection from dropdown menu
    function updateData() {
        // Grab selected option from dropdown for each filter category
        sex = $("#sexDropdownSelector option:selected").text();
        region = $("#provinceDropdownSelector option:selected").text();
        nutrient = $("#nutrientDropdownSelector option:selected").text();

        // Filter dataset
        data = master_data[sex][region][nutrient];
        data = d3.nest()
            .key(function(d) {
                return d.age;
            })
            .entries(data);

        // Retrieve a new maximum y-value
        upperValues = [];
        Object.keys(data).forEach(
            function(key) {
                for (var i = 0; i < data[key].values.length; i++) {
                    upperValues.push(data[key].values[i].mean + data[key].values[i].confidence_interval);
                }
            }
        );
        maxValueY = d3.max(upperValues);

        // Set new domain and range with the updated max y-value
        yScale = d3.scaleLinear()
            .domain([0, maxValueY])
            .range([h, 0]);

        yAxis = d3.axisLeft()
            .scale(yScale)
            .ticks(5)
            .tickSizeOuter(2);

        // Reset the axis
        svg.select(".y.axis").transition().duration(600).call(yAxis);

        // Update the y-axis text label
        svg.select("#y-axis-text")
            .transition()
            .duration(200)
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (h / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text(
                function(d) {
                    if (nutrient.includes("Percentage")) {
                        return "Mean " + nutrient.replace("Percentage", "%");
                    }
                    else {
                        return "Mean " + nutrient;
                    }

                });

        // Age categories will change according to available data
        ageCategories = [];
        Object.keys(data).forEach(
            function(i) {
                ageCategories.push(data[i].key);
            }
        );

        // xScale setup
        xScale0 = d3.scaleBand()
            .domain(ageCategories) // domain of values to use for xAxis
            .rangeRound([0, w]) // pixel range for categories
            .padding(0.3)
            .round(true);

        // Sub xScale containing a domain range for each year category
        xScale1 = d3.scaleBand()
            .domain(yearCategories)
            .rangeRound([0, xScale0.bandwidth()]);

        xAxis = d3.axisBottom()
            .scale(xScale0)
            .tickFormat(function(d) { // To make the text fit more comfortably, do a text replacement
                switch (d) {
                    case "19 years and over":
                        return ">= 19";
                    case "71 years and over":
                        return ">= 71";
                    default:
                        return d;
                }
            });

        svg.select(".x.axis").call(xAxis);

        // Move the year-groups to their corresponding position on the x-axis
        const yeargroups = svg.selectAll(".year-group").data(data, d => d.key);
        yeargroups.join(
            enter => enter
            .append("g")
            .attr("class", "year-group")
            .attr("transform", function(d) {
                return "translate(" + xScale0(d.key) + ",0)";
            }),

            update => update.transition()
            .attr("transform", function(d) {
                return "translate(" + xScale0(d.key) + ",0)";
            }),
            exit => exit.remove()
        );

        // Draw on the svg
        updateBars();

        // Update the table
        updateTable();
    }


    function updateBars() {
        // Draw the bars, append/update data on rect elements
        const agegroups = svg.selectAll(".year-group").data(data, d => d.key);

        agegroups.selectAll("rect")
            // Grab values from objects previously bound to agegroups
            .data(function(d) {
                return d.values;
            })
            .join(
                // ENTER
                enter => enter
                .append("rect")
                .attr("width", xScale1.bandwidth())
                .attr("x", function(d) {
                    return xScale1(d.year);
                })
                .style("fill", function(d) {
                    if (d.e_flag === "TRUE") {
                        let t = textures.lines().thicker().stroke(d3.rgb(color_range(d.year)));
                        agegroups.call(t);
                        return t.url();
                    }
                    else {
                        return color_range(d.year);
                    }
                })
                .style("stroke", "white")
                .style("stroke-width", "1")
                .on("mouseover", function(d) {
                    // Darker shade for bar
                    // d3.select(this).style("fill", d3.rgb(color_range(d.year)).darker(1));
                    d3.select(this).style("fill", function(d) {
                        if (d.e_flag === "TRUE") {
                            let t = textures.lines().thicker().stroke("white").background(d3.rgb(color_range(d.year)).darker(1));
                            agegroups.call(t);
                            return t.url();
                        }
                        else {
                            return d3.select(this).style("fill", d3.rgb(color_range(d.year)).darker(1));
                        }
                    });

                    // Extract relevant limit values e.g. EAR/AI
                    var limit_obj = parseLimitValues(d);

                    // Update tooltip box
                    d3.select("#tooltip-box").html(prepareAdequacyHtml(d, limit_obj))
                })
                .on("mouseout", function(d) {
                    // Restore original color
                    d3.select(this).style("fill", function(d) {
                        d3.select("#tooltip-box").html("<i>Hover your cursor over the bars for additional detail.</i>"); // Empty the data box
                        if (d.e_flag === "TRUE") {
                            let t = textures.lines().thicker().stroke(d3.rgb(color_range(d.year)));
                            agegroups.call(t);
                            return t.url();
                        }
                        else {
                            return color_range(d.year);
                        }
                    });
                }).attr("y", function(d) {
                    return yScale(d.mean);
                })
                .attr("height", function(d) {
                    return h - yScale(d.mean);
                }),

                // UPDATE
                update => update.transition().style("fill", function(d) {
                    if (d.e_flag === "TRUE") {
                        let t = textures.lines().thicker().stroke(d3.rgb(color_range(d.year)));
                        agegroups.call(t);
                        return t.url();
                    }
                    else {
                        return color_range(d.year);
                    }
                }).transition().delay(function() {
                    return Math.random() * 300;
                })
                .duration(500)
                .attr("x", function(d) {
                    return xScale1(d.year);
                })
                .attr("y", function(d) {
                    return yScale(d.mean);
                })
                .attr("height", function(d) {
                    return h - yScale(d.mean);
                })
                .attr("width", xScale1.bandwidth()),

                // EXIT
                exit => exit.selectAll(".year-group").remove()
            );

        // Draw error lines
        agegroups.selectAll(".error-line")
            .data(function(d) {
                return d.values;
            })
            .join(

                // ENTER
                enter => enter
                .append("line")
                .attr("class", "error-line")
                // .attr("width", xScale1.bandwidth())
                .attr("x1", function(d) {
                    return xScale1(d.year) + ((xScale0.bandwidth() / 2) / 2);
                })
                .attr("y1", function(d) {
                    return yScale(d.mean + d.confidence_interval);
                })
                .attr("x2", function(d) {
                    return xScale1(d.year) + ((xScale0.bandwidth() / 2) / 2);
                })
                .attr("y2", function(d) {
                    return yScale(d.mean - d.confidence_interval);
                }),

                // UPDATE ERROR LINES
                update => update.attr("x1", function(d) {
                    return xScale1(d.year) + ((xScale0.bandwidth() / 2) / 2);
                })
                .attr("y1", function(d) {
                    return yScale(d.mean);
                })
                .attr("x2", function(d) {
                    return xScale1(d.year) + ((xScale0.bandwidth() / 2) / 2);
                })
                .attr("y2", function(d) {
                    return yScale(d.mean);
                })
                .transition()
                .delay(500)
                .duration(500)
                .attr("x1", function(d) {
                    return xScale1(d.year) + ((xScale0.bandwidth() / 2) / 2);
                })
                .attr("y1", function(d) {
                    return yScale(d.mean + d.confidence_interval);
                })
                .attr("x2", function(d) {
                    return xScale1(d.year) + ((xScale0.bandwidth() / 2) / 2);
                })
                .attr("y2", function(d) {
                    return yScale(d.mean - d.confidence_interval);
                }),

                // EXIT
                exit => exit.selectAll(".error-line").remove()
            );

        let hat_width = 5; // Controls how wide the error hats appear

        // Top error hats
        agegroups.selectAll(".error-line-hat-t")
            .data(function(d) {
                return d.values;
            })
            .join(

                // ENTER
                enter => enter
                .append("line")
                .attr("class", "error-line-hat-t")
                .attr("x1", function(d) {
                    return xScale1(d.year) + ((xScale0.bandwidth() / 2) / 2) - hat_width;
                })
                .attr("y1", function(d) {
                    return yScale(d.mean + d.confidence_interval);
                })
                .attr("x2", function(d) {
                    return xScale1(d.year) + ((xScale0.bandwidth() / 2) / 2) + hat_width;
                })
                .attr("y2", function(d) {
                    return yScale(d.mean + d.confidence_interval);
                }),

                // UPDATE
                update => update.attr("x1", function(d) {
                    return xScale1(d.year) + ((xScale0.bandwidth() / 2) / 2);
                })
                .attr("y1", function(d) {
                    return yScale(d.mean);
                })
                .attr("x2", function(d) {
                    return xScale1(d.year) + ((xScale0.bandwidth() / 2) / 2);
                })
                .attr("y2", function(d) {
                    return yScale(d.mean);
                })
                .transition()
                .delay(500)
                .duration(500)
                .attr("x1", function(d) {
                    return xScale1(d.year) + ((xScale0.bandwidth() / 2) / 2) - hat_width;
                })
                .attr("y1", function(d) {
                    return yScale(d.mean + d.confidence_interval);
                })
                .attr("x2", function(d) {
                    return xScale1(d.year) + ((xScale0.bandwidth() / 2) / 2) + hat_width;
                })
                .attr("y2", function(d) {
                    return yScale(d.mean + d.confidence_interval);
                }),

                // EXIT
                exit => exit.selectAll(".error-line-hat-t").remove()
            );

        // Bottom error hats
        agegroups.selectAll(".error-line-hat-b")
            .data(function(d) {
                return d.values;
            })
            .join(
                // ENTER
                enter => enter
                .append("line")
                .attr("class", "error-line-hat-b")
                .attr("x1", function(d) {
                    return xScale1(d.year) + ((xScale0.bandwidth() / 2) / 2) - hat_width;
                })
                .attr("y1", function(d) {
                    return yScale(d.mean - d.confidence_interval);
                })
                .attr("x2", function(d) {
                    return xScale1(d.year) + ((xScale0.bandwidth() / 2) / 2) + hat_width;
                })
                .attr("y2", function(d) {
                    return yScale(d.mean - d.confidence_interval);
                }),

                // UPDATE
                update => update.attr("x1", function(d) {
                    return xScale1(d.year) + ((xScale0.bandwidth() / 2) / 2);
                })
                .attr("y1", function(d) {
                    return yScale(d.mean);
                })
                .attr("x2", function(d) {
                    return xScale1(d.year) + ((xScale0.bandwidth() / 2) / 2);
                })
                .attr("y2", function(d) {
                    return yScale(d.mean);
                })
                .transition()
                .delay(500)
                .duration(500)
                .attr("x1", function(d) {
                    return xScale1(d.year) + ((xScale0.bandwidth() / 2) / 2) - hat_width;
                })
                .attr("y1", function(d) {
                    return yScale(d.mean - d.confidence_interval);
                })
                .attr("x2", function(d) {
                    return xScale1(d.year) + ((xScale0.bandwidth() / 2) / 2) + hat_width;
                })
                .attr("y2", function(d) {
                    return yScale(d.mean - d.confidence_interval);
                }),

                // EXIT
                exit => exit.selectAll(".error-line-hat-b").remove()
            );
    }

    function updateTable() {
        // TODO: Render only cols with data. Probably need to redeclare the headers here depending on which columns actually have data. jQuery/datatables approaches are not working. 
        // Compose flattened object for each row from main data object
        let rowObjects = [];
        Object.keys(data).forEach(
            function(i) {
                data[i].values.forEach(function(d) {
                    var mean_se = d.mean_se;
                    if (d.e_flag === "TRUE") {
                        mean_se = d.mean_se + "E";
                    }
                    rowObjects.push({
                        'age': d.age,
                        'ai': d.ai,
                        'cdrr': d.cdrr,
                        // 'confidence_interval': d.confidence_interval,
                        'ear': d.ear,
                        'mean': d.mean,
                        'mean_se': mean_se,
                        'nutrient': d.nutrient,
                        'pct_ai': d.pct_ai,
                        'pct_cdrr': d.pct_cdrr,
                        'pct_ear': d.pct_ear,
                        'pct_ul': d.pct_ul,
                        'region': d.region,
                        'sample_size': d.sample_size,
                        'sex': d.sex,
                        'ul': d.ul,
                        'year': d.year,

                        // Table only values
                        'p5': d.p5,
                        'p5_se': d.p5_se,
                        'p10': d.p10,
                        'p10_se': d.p10_se,
                        'p25': d.p25,
                        'p25_se': d.p25_se,
                        'p50': d.p50,
                        'p50_se': d.p50_se,
                        'p75': d.p75,
                        'p75_se': d.p75_se,
                        'p90': d.p90,
                        'p90_se': d.p90_se,
                        'p95': d.p95,
                        'p95_se': d.p95_se,
                        'ear_pct_se': d.ear_pct_se,
                        'ear_pct_se_p': d.ear_pct_se_p,
                        'ai_pct_se': d.ai_pct_se,
                        'ai_pct_p': d.ai_pct_p,
                        'ul_pct_se': d.ul_pct_se,
                        'ul_pct_p': d.ul_pct_p,
                        'amdr': d.amdr,
                        'amdr_pct_below': d.amdr_pct_below,
                        'amdr_pct_below_p': d.amdr_pct_below_p,
                        'amdr_pct_below_se': d.amdr_pct_below_se,
                        'amdr_pct_within_se': d.amdr_pct_within_se,
                        'amdr_pct_within_p': d.amdr_pct_within_p,
                        'amdr_pct_above': d.amdr_pct_above,
                        'amdr_pct_above_p': d.amdr_pct_above_p,
                        'amdr_pct_above_se': d.amdr_pct_above_se,
                        'cdrr_pct_se': d.cdrr_pct_se,
                        'cdrr_pct_p': d.cdrr_pct_p,
                        'inad_pct': d.inad_pct,
                        'inad_pct_se': d.inad_pct_se,
                        'inad_pct_p': d.inad_pct_p,
                    });
                });
            }
        );

        let dataRow = ({
            nutrient,
            region,
            year,
            sex,
            age,
            sample_size,
            mean,
            mean_se,
            // confidence_interval,
            ear,
            pct_ear,
            ai,
            pct_ai,
            ul,
            pct_ul,
            cdrr,
            pct_cdrr,
            p5,
            p5_se,
            p10,
            p10_se,
            p25,
            p25_se,
            p50,
            p50_se,
            p75,
            p75_se,
            p90,
            p90_se,
            p95,
            p95_se,
            ear_pct_se,
            ear_pct_se_p,
            ai_pct_se,
            ai_pct_p,
            ul_pct_se,
            ul_pct_p,
            amdr,
            amdr_pct_below,
            amdr_pct_below_p,
            amdr_pct_below_se,
            amdr_pct_within_se,
            amdr_pct_within_p,
            amdr_pct_above,
            amdr_pct_above_p,
            amdr_pct_above_se,
            cdrr_pct_se,
            cdrr_pct_p,
            inad_pct,
            inad_pct_se,
            inad_pct_p
        }) => `<tr>
        <td>${nutrient}</td>
        <td>${region}</td>
        <td>${year}</td>
        <td>${sex}</td>
        <td>${age}</td>
        <td>${sample_size}</td>
        <td>${mean}</td>
        <td>${mean_se}</td>
        <td>${ear}</td>
        <td>${pct_ear}</td>
        <td>${ai}</td>
        <td>${pct_ai}</td>
        <td>${ul}</td>
        <td>${pct_ul}</td>
        <td>${cdrr}</td>
        <td>${pct_cdrr}</td>
        <td>${p5}</td>
        <td>${p5_se}</td>
        <td>${p10}</td>
        <td>${p10_se}</td>
        <td>${p25}</td>
        <td>${p25_se}</td>
        <td>${p50}</td>
        <td>${p50_se}</td>
        <td>${p75}</td>
        <td>${p75_se}</td>
        <td>${p90}</td>
        <td>${p90_se}</td>
        <td>${p95}</td>
        <td>${p95_se}</td>
        <td>${ear_pct_se}</td>
        <td>${ear_pct_se_p}</td>
        <td>${ai_pct_se}</td>
        <td>${ai_pct_p}</td>
        <td>${ul_pct_se}</td>
        <td>${ul_pct_p}</td>
        <td>${amdr}</td>
        <td>${amdr_pct_below}</td>
        <td>${amdr_pct_below_p}</td>
        <td>${amdr_pct_below_se}</td>
        <td>${amdr_pct_within_se}</td>
        <td>${amdr_pct_within_p}</td>
        <td>${amdr_pct_above}</td>
        <td>${amdr_pct_above_p}</td>
        <td>${amdr_pct_above_se}</td>
        <td>${cdrr_pct_se}</td>
        <td>${cdrr_pct_p}</td>
        <td>${inad_pct}</td>
        <td>${inad_pct_se}</td>
        <td>${inad_pct_p}</td>
        </tr>`;

        $('.datatable-body').html(rowObjects.map(dataRow).join(''));

        // Finally hide any empty columns
        hideEmptyCols($('#nutrientTable'));

    }

    function hideEmptyCols(table) {
        // Adapted from https://stackoverflow.com/questions/9003335/hiding-a-table-column-if-the-containing-cells-are-empty-with-jquery
        var rows = $("tr", table).length - 1;
        var numCols = $("th", table).length;
        for (var i = 1; i <= numCols; i++) {
            if ($("span:empty", $("td:nth-child(" + i + ")", table)).length == rows) {
                $("td:nth-child(" + i + ")", table).hide(); //hide <td>'s
                $("th:nth-child(" + i + ")", table).hide(); //hide header <th>
            }
            else {
                $("td:nth-child(" + i + ")", table).show();
                $("th:nth-child(" + i + ")", table).show();
            }
        }
    }

    function parseLimitValues(obj) {
        // Default values
        var adequacy_value = "N/A";
        var adequacy_pct = "N/A";
        var adequacy_type = "N/A"; // Either AI or EAR
        var exceedance_value = "N/A";
        var exceedance_pct = "N/A";
        var exceedance_type = "N/A"; // Either UL or CDRR

        // Extract and parse relevant adequacy values
        if (obj.ai === "" && obj.ear !== "") {
            adequacy_value = obj.ear;
            if (obj.pct_ear === "F" || obj.pct_ear === "<3") {
                adequacy_pct = obj.pct_ear;
            }
            else {
                adequacy_pct = parseFloat(obj.pct_ear).toFixed(2);
            }
            adequacy_type = 'EAR';
        }
        else if (obj.ai !== "" && obj.ear === "") {
            adequacy_value = obj.ai;
            if (obj.pct_ai === "F" || obj.pct_ai === "<3") {
                adequacy_pct = obj.pct_ai;
            }
            else {
                adequacy_pct = parseFloat(obj.pct_ai).toFixed(2);

            }
            adequacy_type = 'AI';
        }

        // Extract and parse relevant limit values
        // TODO: Vitamin D, Iron show strange value for UL and %> UL
        if (obj.cdrr === "" && obj.ul !== "") {
            exceedance_value = obj.ul;
            if (obj.pct_ul === "F" || obj.pct_ul === "<3") {
                exceedance_pct = obj.pct_ul;
            }
            else {
                exceedance_pct = parseFloat(obj.pct_ul).toFixed(2);
            }
            exceedance_type = 'UL';
        }
        else if (obj.cdrr !== "" && obj.ul === "") {
            exceedance_value = obj.cdrr;
            if (obj.pct_cdrr === "F" || obj.pct_cdrr === "<3") {
                exceedance_pct = obj.pct_cdrr;
            }
            else {
                exceedance_pct = parseFloat(obj.pct_cdrr).toFixed(2);
            }
            exceedance_type = 'CDRR';
        }

        // Extract within AMDR value (only applies to 'Percentage of x...' nutrients)
        if (obj.pct_amdr !== 'F' && obj.pct_amdr !== "") {
            exceedance_pct = obj.pct_amdr;
            exceedance_value = 'AMDR';
        }

        return {
            'adequacy_value': adequacy_value,
            'adequacy_pct': adequacy_pct,
            'adequacy_type': adequacy_type,

            'exceedance_value': exceedance_value,
            'exceedance_pct': exceedance_pct,
            'exceedance_type': exceedance_type
        };
    }

    function extractUnitsFromNutrient(nutrient) {
        // This will return the term inside the brackets
        var re = new RegExp('\\(([^)]+)\\)');
        var result = re.exec(nutrient);
        try {
            return result[1];
        }
        catch (err) {
            return '';
        }
    }

    function prepareAdequacyHtml(d, limit_obj) {
        // TODO: % within AMDR for percentage values

        // Units
        var units = extractUnitsFromNutrient(d.nutrient);

        // Re-append the "E" character if e_flag is true
        var mean_se = d.mean_se;
        if (d.e_flag === "TRUE") {
            mean_se = d.mean_se + "E";
        }

        // store basic data that every object should have
        var base_html =
            "<strong>Age group: </strong>" + d.age +
            "<br><strong>Year: </strong>" + d.year +
            "<br><strong>Mean: </strong>" + d.mean + " (±" + mean_se + ") " + units;

        // Now append to the base_html object as necessary depending on presence of adequacy/limit values
        // Adequacy
        if (limit_obj.adequacy_type === "EAR") {
            base_html = base_html +
                "<br><strong>EAR: </strong>" + limit_obj.adequacy_value +
                ' ' + units +
                "<br><strong>% < EAR: </strong>" + limit_obj.adequacy_pct;
        }
        else if (limit_obj.adequacy_type === "AI") {
            base_html = base_html +
                "<br><strong>AI: </strong>" + limit_obj.adequacy_value + ' ' + units +
                "<br><strong>% > AI: </strong>" + limit_obj.adequacy_pct;
        }

        // Limits
        if (limit_obj.exceedance_type === "UL") {
            base_html = base_html +
                "<br><strong>UL: </strong>" + limit_obj.exceedance_value +
                ' ' + units +
                "<br><strong>% > UL: </strong>" + limit_obj.exceedance_pct;

        }
        else if (limit_obj.exceedance_type === "CDRR") {
            base_html = base_html +
                "<br><strong>CDRR: </strong>" + limit_obj.exceedance_value +
                ' ' + units +
                "<br><strong>% > CDRR: </strong>" + limit_obj.exceedance_pct;
        }

        base_html = base_html +
            "<br><strong>Sample size: </strong>" + d.sample_size;

        return base_html;
    }
});


// Download CSV file source code pulled from https://codepen.io/malahovks/pen/gLxLWX
function download_csv(csv, filename) {
    var csvFile;
    var downloadLink;

    // CSV FILE
    csvFile = new Blob([csv], { type: "text/csv" });

    // Download link
    downloadLink = document.createElement("a");

    // File name
    downloadLink.download = filename;

    // We have to create a link to the file
    downloadLink.href = window.URL.createObjectURL(csvFile);

    // Make sure that the link is not displayed
    downloadLink.style.display = "none";

    // Add the link to your DOM
    document.body.appendChild(downloadLink);

    // Lanzamos
    downloadLink.click();
}

function export_table_to_csv(html, filename) {
    var csv = [];
    var rows = document.querySelectorAll("#nutrientTable tr");

    for (var i = 0; i < rows.length; i++) {
        var row = [],
            cols = rows[i].querySelectorAll("td, th");

        for (var j = 0; j < cols.length; j++)
            row.push(cols[j].innerText);

        csv.push(row.join(","));
    }

    // Download CSV
    download_csv(csv.join("\n"), filename);
}

document.querySelector("#nutrientTableDownload").addEventListener("click", function() {
    var html = document.querySelector("#nutrientTable").outerHTML;
    var filename = $("#nutrientDropdownSelector option:selected").text() + "_" + $("#provinceDropdownSelector option:selected").text() + "_" + $("#sexDropdownSelector option:selected").text() + ".csv";
    export_table_to_csv(html, filename);
});

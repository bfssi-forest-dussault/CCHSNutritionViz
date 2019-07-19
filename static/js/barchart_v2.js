//Width and height
var margin = {top: 20, right: 80, bottom: 50, left: 60};
var w = 580 - margin.left - margin.right;
var h = 480 - margin.top - margin.bottom;

d3.csv("/static/data/NutritionByRegion_June2019.csv", function (d) {
    return {
        nutrient: d['Nutrient/Item (unit)'],
        sample_size: +d['n'],
        year: +d['Year'],
        sex: d['Sex'],
        mean: +d['Mean'],
        // TODO: Values with 'E' char currently break the drawing of these lines. Fix somehow.
        mean_se: +strip_e_and_coerce_to_float(d['SE_Mean']),
        confidence_interval: +(strip_e_and_coerce_to_float(d['SE_Mean'])*1.96),  // 1.96xSEM = 95% confidence interval
        /* New */
        ear: +d['EAR'],
        pct_ear: d['% <EAR'],
        ai: +d['AI'],
        pct_ai: d['% >AI'],
        ul: +d['UL'],
        pct_ul: d['% >UL'],
        cdrr: +d['CDRR'],
        pct_cdrr: d['% >CDRR'],
        pct_amdr: d['% within AMDR'], // This value is only for the 'Percentage of x...' nutrients (might contain 'F')
        /* End */
        region: d['Reg_Prov'],
        age: d['Age (years)']
    };
}).then(function (data) {
        data = d3.nest()
            .key(function (d) {
                return d.year
            })
            .key(function (d) {
                return d.region
            })
            .key(function (d) {
                return d.nutrient
            })
            .object(data);

        // Store unaltered data here to deal with updated user dropdown selections
        var master_data = data;

        // Dropdown menus
        var yearDropdown = d3.select("#yearDropdown");
        var provinceDropdown = d3.select("#provinceDropdown");
        var nutrientDropdown = d3.select("#nutrientDropdown");

        var yearList = ['2004', '2015'];
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
        ].sort();
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
        ].sort();

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

        provinceDropdown.append("select")
            .attr("class", "select form-control")
            .attr("id", "provinceDropdownSelector")
            .style("width", "100%")
            .on("change", update_data)
            .selectAll("option")
            .data(regionList)
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
        var region = $("#provinceDropdownSelector option:selected").text();
        var nutrient = $("#nutrientDropdownSelector option:selected").text();

        data = master_data[year][region][nutrient];

        // Nest again, this time returning entries instead of an object using 'age'
        data = d3.nest()
            .key(function (d) {
                return d.age
            })
            .entries(data);

        // Categories for chart labelling
        var age_categories = ['1-3', '4-8', '9-13', '14-18', '19-30', '31-50', '51-70',
            '19 years and over', '71 years and over'];
        var sex_categories = ['Male', 'Female', 'Both'];

        // Colors for bars
        var color_range = d3.scaleOrdinal()
            .range(["#0571b0", "#ca0020", "#727272"]);

        // xScale setup
        var xScale0 = d3.scaleBand()
            .domain(age_categories)  // categories go here (domain of values to use for xAxis)
            .rangeRound([0, w])  // pixel range for categories
            .paddingInner(0.05);

        // Sub xScale containing a domain range for each sex category (Male, Female, Both)
        var xScale1 = d3.scaleBand()
            .domain(sex_categories)
            .rangeRound([0, xScale0.bandwidth()]);


        // Iterate through data to find max y-value (mean + mean_se)
        var upperValues = [];
        Object.keys(data).forEach(
            function (key) {
                for (var i = 0; i < data[key].values.length; i++) {
                    upperValues.push(data[key].values[i].mean + data[key].values[i].confidence_interval)
                }
            }
        );
        var maxValueY = d3.max(upperValues);

        // yScale with previously calculated max y-value (mean)
        var yScale = d3.scaleLinear()
            .domain([0, maxValueY])
            .range([h, 0]);

        // xAxis setup
        var xAxis = d3.axisBottom()
            .scale(xScale0)
            .tickFormat(function (d) {  // To make the text fit more comfortably, do a text replacement
                switch (d) {
                    case "19 years and over":
                        return ">= 19";
                    case "71 years and over":
                        return ">= 71";
                    default:
                        return d;
                }
            });

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

        // Binding the data to agegroups
        var agegroups = svg.selectAll(".agegroups")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "g")
            .attr("transform", function (d) {
                return "translate(" + xScale0(d.key) + ",0)";
            });

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
            .data(sex_categories)
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function (d, i) {
                return "translate(0," + i * 20 + ")";
            })
            .style("opacity", "0");

        legend.append("rect")
            .attr("x", h + 85)
            .attr("width", 15)
            .attr("height", 15)
            .style("fill", function (d) {
                return color_range(d);
            });

        legend.append("text")
            .attr("x", w + 50)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(function (d) {
                return d;
            });

        legend.transition().duration(500).delay(function (d, i) {
            return 1300 + 100 * i;
        }).style("opacity", "1");

        // Drawing the chart
        update_data();

        // Gridline functions
        function make_y_gridlines() {
            return d3.axisLeft(yScale)
                .ticks(5)
        }

        // Data change
        function update_data() {
            // Grab selected option from dropdown for each filter category
            year = $("#yearDropdownSelector option:selected").text();
            region = $("#provinceDropdownSelector option:selected").text();
            nutrient = $("#nutrientDropdownSelector option:selected").text();

            // Filter dataset
            data = master_data[year][region][nutrient];
            data = d3.nest()
                .key(function (d) {
                    return d.age
                })
                .entries(data);

            // Retrieve a new maximum y-value
            upperValues = [];
            Object.keys(data).forEach(
                function (key) {
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

            // xScale setup
            xScale0 = d3.scaleBand()
                .domain(age_categories)  // categories go here (domain of values to use for xAxis)
                .rangeRound([0, w])  // pixel range for categories
                .paddingInner(0.05);

            // Sub xScale containing a domain range for each sex category (Male, Female, Both)
            xScale1 = d3.scaleBand()
                .domain(sex_categories)
                .rangeRound([0, xScale0.bandwidth()]);

            xAxis = d3.axisBottom()
                .scale(xScale0)
                .tickFormat(function (d) {  // To make the text fit more comfortably, do a text replacement
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

            // Update the y-axis text label
            svg.select("#y-axis-text")
                .transition()
                .duration(200)
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left)
                .attr("x", 0 - (h / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("Mean " + nutrient);

            // Draw on the svg
            d3.selectAll(".error-line").remove();
            draw_rects();
        }

        /* NEW */
        function parse_limit_values(obj) {
            /*
            Function to parse out the adequacy/limit values from the data.
            Definitely not elegant or DRY-compliant, but works.
            */

            // Default values
            var adequacy_value = "N/A";
            var adequacy_pct = "N/A";
            var adequacy_type = "N/A";  // Either AI or EAR
            var exceedance_value = "N/A";
            var exceedance_pct = "N/A";
            var exceedance_type = "N/A";  // Either UL or CDRR

            // Extract and parse relevant adequacy values
            if (obj.ai === 0 && obj.ear !== 0) {
                adequacy_value = obj.ear;
                if (obj.pct_ear === "F" || obj.pct_ear === "<3") {
                    adequacy_pct = obj.pct_ear
                } else {
                    adequacy_pct = parseFloat(obj.pct_ear).toFixed(2);
                }
                adequacy_type = 'EAR'
            } else if (obj.ai !== 0 && obj.ear === 0) {
                adequacy_value = obj.ai;
                if (obj.pct_ai === "F" || obj.pct_ai === "<3") {
                    adequacy_pct = obj.pct_ai
                } else {
                    adequacy_pct = parseFloat(obj.pct_ai).toFixed(2);

                }
                adequacy_type = 'AI'
            }

            // Extract and parse relevant limit values
            if (obj.cdrr === 0 && obj.ul !== 0) {
                exceedance_value = obj.ul;
                if (obj.pct_ul === "F" || obj.pct_ul === "<3") {
                    exceedance_pct = obj.pct_ul
                } else {
                    exceedance_pct = parseFloat(obj.pct_ul).toFixed(2);
                }
                exceedance_type = 'UL'
            } else if (obj.cdrr !== 0 && obj.ul === 0) {
                exceedance_value = obj.cdrr;
                if (obj.pct_cdrr === "F" || obj.pct_cdrr === "<3") {
                    exceedance_pct = obj.pct_cdrr
                } else {
                    exceedance_pct = parseFloat(obj.pct_cdrr).toFixed(2);
                }
                exceedance_type = 'CDRR'
            }

            // Extract within AMDR value (only applies to 'Percentage of x...' nutrients)
            if (obj.pct_amdr !== 'F' && obj.pct_amdr !== 0) {
                exceedance_pct = obj.pct_amdr;
                exceedance_value = 'AMDR'
            }

            return {
                'adequacy_value': adequacy_value,
                'adequacy_pct': adequacy_pct,
                'adequacy_type': adequacy_type,

                'exceedance_value': exceedance_value,
                'exceedance_pct': exceedance_pct,
                'exceedance_type': exceedance_type
            }
        }

        function extract_units_from_nutrient(nutrient) {
            // This will return the term inside the brackets
            var re = new RegExp('\\(([^)]+)\\)');
            var result = re.exec(nutrient);
            return result[1]
        }

        function prepare_adequacy_html(d, limit_obj) {
            // TODO: % within AMDR for percentage things
            // Units
            var units = extract_units_from_nutrient(d.nutrient);

            // object to store data that every object should have
            var base_html = "<strong>Mean: </strong>" + d.mean + " (±" + d.mean_se + ") " + units +
                "<br><strong>Sex: </strong>" + d.sex +
                "<br><strong>Age group: </strong>" + d.age;


            // Now append to the base_html object as necessary depending on presence of adequacy/limit values
            // Adequacy
            if (limit_obj.adequacy_type === "EAR") {
                base_html = base_html +
                    "<br><strong>Est. Average Requirement (EAR): </strong>" + limit_obj.adequacy_value +
                    ' ' + units +
                    "<br><strong>% < EAR: </strong>" + limit_obj.adequacy_pct
            } else if (limit_obj.adequacy_type === "AI") {
                base_html = base_html +
                    "<br><strong>Adequate Intake (AI): </strong>" + limit_obj.adequacy_value + ' ' + units +
                    "<br><strong>% > AI: </strong>" + limit_obj.adequacy_pct
            }

            // Limits
            if (limit_obj.exceedance_type === "UL") {
                base_html = base_html +
                    "<br><strong>Upper Limit (UL): </strong>" + limit_obj.exceedance_value +
                    ' ' + units +
                    "<br><strong>% < UL: </strong>" + limit_obj.exceedance_pct

            } else if (limit_obj.exceedance_type === "CDRR") {
                base_html = base_html +
                    "<br><strong>Chronic Disease Risk Reduction (CDRR): </strong>" + limit_obj.exceedance_value +
                    ' ' + units +
                    "<br><strong>% > CDRR: </strong>" + limit_obj.exceedance_pct
            }

            base_html = base_html +
                "<br><strong>Sample size: </strong>" + d.sample_size;

            return base_html
        }

        /* END NEW */

        function draw_rects() {
            // enter data
            agegroups.data(data)
                .enter()
                .append("g")
                .attr("class", "g")
                .attr("transform", function (d) {
                    return "translate(" + xScale0(d.key) + ",0)";
                });

            // Draw rects
            agegroups.selectAll(".bar")
                .data(function (d) {
                    return d.values;
                })
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("width", xScale1.bandwidth())
                .attr("x", function (d) {
                    return xScale1(d.sex)
                })
                .style("fill", function (d) {
                    return color_range(d.sex)
                })
                .style("stroke", "white")
                .style("stroke-width", "1")
                .on("mouseover", function (d) {
                    // Darker shade for bar
                    d3.select(this).style("fill", d3.rgb(color_range(d.sex)).darker(1));

                    var limit_obj = parse_limit_values(d);

                    // Update tooltip box
                    // TODO: Display full text i.e. Estimated Average Requirement (EAR) or Adequate Intake (AI)
                    // TODO: Footnote describing symbols like F or <3 which occasionally pop up
                    d3.select("#tooltip-box")
                        .html(prepare_adequacy_html(d, limit_obj))
                })
                .on("mouseout", function (d) {
                    // Restore original color
                    d3.select(this).style("fill", color_range(d.sex));
                });

            agegroups.selectAll(".bar")
                .data(function (d) {
                    return d.values;
                })
                .attr("y", function () {
                    return yScale(0)
                })
                .attr("height", function () {
                    return h - yScale(0);
                })
                .attr("y", function (d) {
                    return yScale(d.mean);
                })
                .attr("height", function (d) {
                    return h - yScale(d.mean);
                });

            // Draw error lines
            agegroups.selectAll(".error-line")
                .data(function (d) {
                    return d.values
                })
                .enter()
                .append("line")
                .attr("class", "error-line")
                .attr("width", xScale1.bandwidth())
                .attr("x1", function (d) {
                    return xScale1(d.sex) + 7.5
                })
                .attr("y1", function (d) {
                    return yScale(d.mean + d.confidence_interval)
                })
                .attr("x2", function (d) {
                    return xScale1(d.sex) + 7.5
                })
                .attr("y2", function (d) {
                    return yScale(d.mean - d.confidence_interval)
                })
                .transition()
                .duration(400);

        }

    }
);

function strip_e_and_coerce_to_float(val) {
    // Removes 'E' character from string then coerces to float. Used for the mean_se column from the dataset.
    var val_ = val.replace('E', '');
    return parseFloat(val_);
}


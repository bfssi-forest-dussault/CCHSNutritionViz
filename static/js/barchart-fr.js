/*
Investigate using d3.format to change locale to allow for commas instead of decimals for numeric display
This might be difficult/unfeasible due to the mixed data type encoding of the various columns.
*/


//Width and height
var margin = { top: 20, right: 80, bottom: 50, left: 80 };
var w = 640 - margin.left - margin.right;
var h = 480 - margin.top - margin.bottom;

function stripECoerceToFloat(val) {
    // Removes 'E' character from string then coerces to float. Used for the mean_se column from the dataset.
    var val_ = val.replace('E', '');
    return parseFloat(val_);
}


d3.csv("static/data/NutritionByRegion_Sept2019-fr.csv", function(d) {
    return {
        // Rendered data
        nutrient: d['Nutriment/Item (unité)'],
        sample_size: +d['n'],
        year: +d['Année'],
        sex: d['Sexe'],
        mean: +d['Moyenne'],
        mean_se: +stripECoerceToFloat(d['ÉT_Moyenne']),
        e_flag: d['e_flag'], // Detects presence of 'E' in original SE_Mean column before processing
        confidence_interval: +(stripECoerceToFloat(d['ÉT_Moyenne']) * 1.96), // 1.96xSEM = 95% confidence interval
        ear: d['BME'],
        pct_ear: d['% <BME'],
        ai: d['AS'],
        pct_ai: d['% >AS'],
        ul: d['AMT'],
        pct_ul: d['% >AMT'],
        cdrr: d['RRMC'],
        pct_cdrr: d['% >RRMC'],
        pct_amdr: d['%entreÉVAM'],
        region: d['Rég_Prov'],
        age: d['Âge (en années)'],

        // Data to include in table
        p5: d['P5'],
        p5_se: d['P5_ET'],
        p10: d['P10'],
        p10_se: d['P10_ET'],
        p25: d['P25'],
        p25_se: d['P25_ET'],
        p50: d['P50'],
        p50_se: d['P50_ET'],
        p75: d['P75'],
        p75_se: d['P75_ET'],
        p90: d['P90'],
        p90_se: d['P90_ET'],
        p95: d['P95'],
        p95_se: d['P95_ET'],

        ear_pct_se: d['%<BME_ET'],
        ear_pct_se_p: d['valeur p_%BME'],

        ai_pct_se: d['%>AS_ET'],
        ai_pct_p: d['valeur p_%>AS'],

        ul_pct_se: d['% >AMT_ET'],
        ul_pct_p: d['valeur p_%>AMT'],

        amdr: d['ÉVAM'],
        amdr_pct_below: d['% < ÉVAM'],
        amdr_pct_below_p: d['valeur p_%<ÉVAM'],
        amdr_pct_below_se: d['% < ÉVAM_ET'],
        amdr_pct_within_se: d['%entreÉVAM_ET'],
        amdr_pct_within_p: d['valeur p_%entreÉVAM'],
        amdr_pct_above: d['% > ÉVAM'],
        amdr_pct_above_p: d['ÉVAM'],
        amdr_pct_above_se: d['% > ÉVAM_ET'],

        cdrr_pct_se: d['% >RRMC_ET'],
        cdrr_pct_p: d['valeur p_%>RRMC'],

        inad_pct: d['%Carence'],
        inad_pct_se: d['%Carence_ET'],
        inad_pct_p: d['valeur p_%Carence']
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
        'Canada excluant les territoires',
        'Terre-Neuve-et-Labrador',
        'Île-du-Prince-Édouard',
        'Nouvelle-Écosse',
        'Nouveau-Brunswick',
        'Québec',
        'Ontario',
        'Manitoba',
        'Alberta',
        'Saskatchewan',
        'Colombie-Britannique',
        'Région de l’Atlantique',
        'Région des Prairies'
    ].sort();
    var nutrientList = [
        'Magnésium (mg/j)',
        'Acide linolénique (g/j)',
        'Folate (ÉFA/j)',
        'Riboflavine (mg/j)',
        'Vitamine C (mg/j)',
        'Niacine (ÉN/j)',
        'Caféine (mg/j)',
        'Acides gras monoinsaturés totaux (g/j)',
        'Potassium (mg/j)',
        'Calcium (mg/j)',
        "Pourcentage de l'apport énergétique total provenant des protéines",
        "Pourcentage de l'apport énergétique total provenant des lipides",
        "Pourcentage de l'apport énergétique total provenant des acides gras monoinsaturés",
        "Pourcentage de l'apport énergétique total provenant des sucres",
        'Apport énergétique (kcal/j)',
        'Phosphore (mg/j)',
        "Pourcentage de l'apport énergétique total provenant des glucides",
        "Pourcentage de l'apport énergétique total provenant de l'acide linolénique",
        'Eau totale (g/j)',
        'Vitamine A (ÉAR/j)',
        'Vitamine B6 (mg/j)',
        'Acide linoléique (g/j)',
        'Sodium (mg/j)',
        'Acides gras polyinsaturés totaux (g/j)',
        'Protéines (g/j)',
        'Folate de source naturelle (mcg/j)',
        'Fer (mg/j)',
        'Acides gras saturés totaux (g/j)',
        'Sucres totaux (g/j)',
        'Vitamine D (mcg/j)',
        'Lipides totaux (g/j)',
        'Thiamine (mg/j)',
        "Pourcentage de l'apport énergétique total provenant de l'acide linoléique",
        'Cholestérol (mg/j)',
        'Folacine (mcg/j)',
        "Pourcentage de l'apport énergétique total provenant des acides gras polyinsaturés",
        'Vitamine B12 (mcg/j)',
        'Glucides totaux (g/j)',
        "Pourcentage de l'apport énergétique total provenant des acides gras saturés",
        'Zinc (mg/j)',
        'Fibres alimentaires totales (g/j)'
    ].sort();

    // Categories for chart labelling
    var ageCategories = ['9 à 13', '14 à 18', '19 à 30', '31 à 50',
        '51 à 70', '19 ans et plus', '71 ans et plus'
    ];
    var sexCategories = ['Hommes', 'Femmes', 'Les deux sexes'];
    var yearCategories = ['2004', '2015'];

    // Variable to track whether we need to reset the x-axis or not (depending on selection in Sex dropdown)
    var updatexAxis = false;

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
        'Nutriment/Item (unité)',
        'Rég_Prov',
        'Année',
        'Sexe',
        'Âge (en années)',
        'n',
        'Moyenne',
        'ÉT_Moyenne',
        'BME',
        '% &lt;BME',
        'AS',
        '% >AS',
        'AMT',
        '% > AMT',
        'RRMC',
        '% > RRMC',
        // Extra table-only data
        'P5',
        'P5_ET',
        'P10',
        'P10_ET',
        'P25',
        'P25_ET',
        'P50',
        'P50_ET',
        'P75',
        'P75_ET',
        'P90',
        'P90_ET',
        'P95',
        'P95_ET',
        '%&lt;BME_ET',
        'valeur p_%BME',
        '%>AS_ET',
        'valeur p_%AS',
        '%>UL_ET',
        'valeur p_%AMT',
        'ÉVAM',
        '% < ÉVAM',
        'valeur p_%<ÉVAM',
        '% < ÉVAM_ET',
        '%entreÉVAM_ET',
        'valeur p_%entreÉVAM',
        '% > ÉVAM',
        'valeur p_%>ÉVAM',
        '% > ÉVAM_ET',
        '% >RRMC_ET',
        'valeur p_%RRMC',
        '%Carence',
        '%Carence_ET',
        'valeur p_%Carence',
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
                case "19 ans et plus":
                    return ">= 19";
                case "71 ans et plus":
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

    // Binding the data to agegroups
    let agegroups = svg.selectAll(".year-group")
        .data(data, d => d.key)
        .join(
            enter => enter
            .append("g")
            .attr("class", "year-group")
            .attr("transform", function(d) {
                return "translate(" + xScale0(d.key) + ",0)";
            }),
            exit => exit.remove()
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
        .text("Âge (en années)");

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
        .text(function(d) {
            return "Moyenne " + nutrient;
        });
        
        svg.append("text")
        .attr("id", "y-axis-text-1")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left - 3)
        .attr("x", 0 - (h / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")

        svg.append("text")
        .attr("id", "y-axis-text-2")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 15)
        .attr("x", 0 - (h / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")


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
            <caption class='wb-inv'><i>* Les barres d'erreur représentent l'intervalle de confiance à 95 %.</i></caption>
            </div>
            <div class="row">
            <caption class='wb-inv'><i>** Les barres hachées doivent être interprétées avec prudence.</i></caption>
            </div>
            <br>
            `
        );

    // Save chart functionality (Source: https://github.com/exupero/saveSvgAsPng) 
    d3.select("#saveChart")
        .on('click', function() {
            // Get the d3js SVG element and save using saveSvgAsPng.js
            saveSvgAsPng(document.getElementsByTagName("svg")[0], "chart.png", { scale: 2, backgroundColor: "#FFFFFF" });
        })

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
        // Need to dynamically detect the super long percentage nutrients and split them on two lines for the y-axis label
        if (nutrient.includes(" total ")) {
            let nutrient_relabel = nutrient.replace("Pourcentage", "%");
            let nutrient_relabel_elements = nutrient_relabel.split("total");
            let nutrient_yaxis_1 = "Moyenne " + nutrient_relabel_elements[0];
            let nutrient_yaxis_2 = "total" + nutrient_relabel_elements[1];

            svg.select("#y-axis-text").text("");

            svg.select("#y-axis-text-1")
                .transition()
                .duration(200)
                // First element
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left - 3)
                .attr("x", 0 - (h / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text(function(d) {
                    return nutrient_yaxis_1;
                });

            // Second element
            svg.select("#y-axis-text-2")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left + 15)
                .attr("x", 0 - (h / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text(function(d) {
                    return nutrient_yaxis_2;
                });

        }
        else {
            svg.select("#y-axis-text-1").text("");
            svg.select("#y-axis-text-2").text("");
            svg.select("#y-axis-text")
                .transition()
                .duration(200)
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left)
                .attr("x", 0 - (h / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text(function(d) {
                    return "Moyenne " + nutrient;
                });
        }

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
                    case "19 ans et plus":
                        return ">= 19";
                    case "71 ans et plus":
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
                        d3.select("#tooltip-box").html("<i>Passez votre curseur sur les barres pour plus de détails.</i>"); // Empty the data box
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
                    return yScale(d.mean - d.confidence_interval)
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
                    return yScale(d.mean + d.confidence_interval)
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
                    return yScale(d.mean - d.confidence_interval)
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

    function stringToRoundFloat(d) {
        // This is kind of disastrous to implement due to the variety of values 
        // possible in a cell. e.g. empty, float, or string, or some combo of 
        // float+string. The requested feature is to round all values to 2 
        // decimal places in the table.
        if (isNaN(d) === false) {
            return null;
        }
        else {
            return d;
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
            adequacy_type = 'BME';
        }
        else if (obj.ai !== "" && obj.ear === "") {
            adequacy_value = obj.ai;
            if (obj.pct_ai === "F" || obj.pct_ai === "<3") {
                adequacy_pct = obj.pct_ai;
            }
            else {
                adequacy_pct = parseFloat(obj.pct_ai).toFixed(2);

            }
            adequacy_type = 'AS';
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
            exceedance_type = 'AMT';
        }
        else if (obj.cdrr !== "" && obj.ul === "") {
            exceedance_value = obj.cdrr;
            if (obj.pct_cdrr === "F" || obj.pct_cdrr === "<3") {
                exceedance_pct = obj.pct_cdrr;
            }
            else {
                exceedance_pct = parseFloat(obj.pct_cdrr).toFixed(2);
            }
            exceedance_type = 'RRMC';
        }

        // Extract within AMDR value (only applies to 'Percentage of x...' nutrients)
        if (obj.pct_amdr !== 'F' && obj.pct_amdr !== "") {
            exceedance_pct = obj.pct_amdr;
            exceedance_value = 'ÉVAM';
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
            "<strong>Âge (en années): </strong>" + d.age +
            "<br><strong>Année: </strong>" + d.year +
            "<br><strong>Moyenne: </strong>" + d.mean + " (±" + mean_se + ") " + units;

        // Now append to the base_html object as necessary depending on presence of adequacy/limit values
        // Adequacy
        if (limit_obj.adequacy_type === "BME") {
            base_html = base_html +
                "<br><strong>BME: </strong>" + limit_obj.adequacy_value +
                ' ' + units +
                "<br><strong>% < BME: </strong>" + limit_obj.adequacy_pct;
        }
        else if (limit_obj.adequacy_type === "AS") {
            base_html = base_html +
                "<br><strong>AS: </strong>" + limit_obj.adequacy_value + ' ' + units +
                "<br><strong>% > AS: </strong>" + limit_obj.adequacy_pct;
        }

        // Limits
        if (limit_obj.exceedance_type === "AMT") {
            base_html = base_html +
                "<br><strong>AMT: </strong>" + limit_obj.exceedance_value +
                ' ' + units +
                "<br><strong>% > AMT: </strong>" + limit_obj.exceedance_pct;

        }
        else if (limit_obj.exceedance_type === "RRMC") {
            base_html = base_html +
                "<br><strong>RRMC: </strong>" + limit_obj.exceedance_value +
                ' ' + units +
                "<br><strong>% > RRMC: </strong>" + limit_obj.exceedance_pct;
        }

        base_html = base_html +
            "<br><strong>n: </strong>" + d.sample_size;

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

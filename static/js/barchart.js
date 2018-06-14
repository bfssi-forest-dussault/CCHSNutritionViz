//Width and height
var margin = {top: 20, right: 20, bottom: 50, left: 50};
var w = 640 - margin.left - margin.right;
var h = 360 - margin.top - margin.bottom;

d3.csv("/static/data/NutritionByRegion_Master.csv", function (d) {
    return {
        nutrient: d['Nutrient/Item (unit)'],
        year: +d['Year'],
        sex: d['Sex'],
        mean: +d['Mean'],
        mean_se: +d['SE_Mean'],
        province: d['Reg_Prov'],
        age: d['Age (years)']
    };
}).then(function (data) {
    data = d3.nest()
        .key(function (d) {
            return d.year
        })
        .key(function (d) {
            return d.province
        })
        .key(function (d) {
            return d.nutrient
        })
        .object(data);


    // Dropdown menus
    var yearDropdown = d3.select("#yearDropdown");
    var provinceDropdown = d3.select("#provinceDropdown");
    var nutrientDropdown = d3.select("#nutrientDropdown");

    // Grab values from the main data object to populate options from the select dropdown
    var yearList = Object.keys(data);
    var provinceList = Object.keys(data['2015']);
    var nutrientList = Object.keys(data['2015']['Alberta']);

    // Setup dropdown menus
    yearDropdown.append("select")
        .attr("class", "select form-control")
        .selectAll("option")
        .data(yearList)
        .enter()
        .append("option")
        .text(function (d) {
            return d
        });

    provinceDropdown.append("select")
        .attr("class", "select form-control")
        .selectAll("option")
        .data(provinceList)
        .enter()
        .append("option")
        .text(function (d) {
            return d
        });

    nutrientDropdown.append("select")
        .attr("class", "select form-control")
        .selectAll("option")
        .data(nutrientList)
        .enter()
        .append("option")
        .text(function (d) {
            return d
        });

    // Filter the data according to dropdown menu selections
    var year = "2015";
    var province = 'Ontario';
    var nutrient = 'Calcium (mg/d)';
    data = data[year][province][nutrient];

    // Nest again, this time returning entries instead of an object using 'age'
    data = d3.nest()
        .key(function (d) {
            return d.age
        })
        .entries(data);

    // Unique age categories
    var age_categories = ['1-3', '4-8', '9-13', '14-18', '19-30', '31-50', '51-70',
        '19 years and over', '71 years and over'];

    var sex_categories = ['Male', 'Female', 'Both'];

    // Colors for bars
    var color_range = d3.scaleOrdinal()
        .range(["#727272", "#ca0020", "#0571b0"]);

    // Scale setup
    var xScale0 = d3.scaleBand()
        .domain(age_categories)  // categories go here (domain of values tageo use for xAxis)
        .rangeRound([0, w])  // pixel range for categories
        .paddingInner(0.05);

    // Sub xScale containing a domain range for each sex category (Male, Female, Both)
    var xScale1 = d3.scaleBand()
        .domain(sex_categories)
        .rangeRound([0, xScale0.bandwidth()]);


    // Iterate through data structure to find max y-value (mean)
    var meanValues = [];
    Object.keys(data).forEach(
        function (key) {
            for (i = 0; i < data[key].values.length; i++) {
                meanValues.push(data[key].values[i].mean)
            }
        }
    );
    var maxValueY = d3.max(meanValues);
    console.log("Maximum y-value: " + maxValueY);

    // Setup yScale with previously calculated max y-value (mean)
    var yScale = d3.scaleLinear()
        .domain([0, maxValueY])
        .range([h, 0]);

    // Axes setup
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

    // Tooltip setup


    // Gridlines setup
    svg.append("g")
        .attr("class", "grid")
        .attr("transform", "translate(0," + h + ")")
        .call(make_x_gridlines()
            .tickSize(-h)
            .tickFormat("")
        );

    svg.append("g")
        .attr("class", "grid")
        .call(make_y_gridlines()
            .tickSize(-w)
            .tickFormat("")
        );

    // Plotting the data
    var agegroups = svg.selectAll(".agegroups")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "g")
        .attr("transform", function (d) {
            return "translate(" + xScale0(d.key) + ",0)";
        });

    agegroups.selectAll("rect")
        .data(function (d) {
            // console.log(d.values);
            return d.values;
        })
        .enter()
        .append("rect")
        .attr("width", xScale1.bandwidth())
        .attr("x", function (d) {
            return xScale1(d.sex)
        })
        .style("fill", function (d) {
            return color_range(d.sex)
        })
        .attr("y", function (d) {
            return yScale(0)
        })
        .attr("height", function (d) {
            return h - yScale(0);
        })
        .on("mouseover", function (d) {
            d3.select(this).style("fill", d3.rgb(color_range(d.sex)).darker(1));
        })
        .on("mouseout", function (d) {
            d3.select(this).style("fill", color_range(d.sex));
        });


    // Draw rects
    agegroups.selectAll("rect")
        .transition()
        .delay(function (d) {
            return Math.random() * 1000;
        })
        .duration(700)
        .attr("y", function (d) {
            return yScale(d.mean);
        })
        .attr("height", function (d) {
            return h - yScale(d.mean);
        });

    // X Axis placement and text
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + h + ")")
        .call(xAxis);

    svg.append("text")
        .attr("transform",
            "translate(" + (w / 2) + " ," +
            (h + margin.top + 20) + ")")
        .style("text-anchor", "middle")
        .text("Age group (years)");

    // Y Axis placement and text
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    svg.append("text")
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
        .attr("x", w - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", function (d) {
            return color_range(d);
        });

    legend.append("text")
        .attr("x", w - 40)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function (d) {
            return d;
        });

    legend.transition().duration(500).delay(function (d, i) {
        return 1300 + 100 * i;
    }).style("opacity", "1");


    // Gridline functions
    function make_x_gridlines() {
        return d3.axisBottom(xScale0)
            .ticks(9)
    }

    function make_y_gridlines() {
        return d3.axisLeft(yScale)
            .ticks(4)
    }

});


/*
- Distribution will only display a certain subset of 'nutrients of interest'
- Distribution values will be provided by Cunye. Using a temporary dataset for now.
 */

//Width and height
const margin = {top: 20, right: 80, bottom: 50, left: 80};
const w = 640 - margin.left - margin.right;
const h = 480 - margin.top - margin.bottom;

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
    const ageCategories = ['1-3', '9-13', '14-18', '19-30', '31-50',
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
    ];

    //Create SVG element
    var svgContainer = d3.select("#distribution-chart");
    var svg = svgContainer
        .append("svg")
        .attr("width", w + margin.left + margin.right)
        .attr("height", h + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");


    console.log(data);


});
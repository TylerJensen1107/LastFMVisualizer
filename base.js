console.log("here");

//Set up D3 graph
var margin = {top: 30, right: 20, bottom: 30, left: 50},
    width = 600 - margin.left - margin.right,
    height = 270 - margin.top - margin.bottom;

// Parse the date / time
var parseDate = d3.time.format("%d-%b-%y").parse;

// Set the ranges
var x = d3.scale.linear().range([0, width]);
var y = d3.scale.linear().range([height, 0]);

//domains
var x = d3.scale.linear().domain([0, 50]);

// Define the axes
var xAxis = d3.svg.axis().scale(x)
    .orient("bottom").ticks(5);

var yAxis = d3.svg.axis().scale(y)
    .orient("left").ticks(5);

// Define the line

var svg = d3.select("body")
.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
.append("g")
    .attr("transform", 
          "translate(" + margin.left + "," + margin.top + ")");


var dataArray = [];
var week = 0;

//Last FM API calls
$.ajax({
	url: "http://ws.audioscrobbler.com/2.0/?method=user.getWeeklyChartList&api_key=5e2801138b4ef76aeb794a9469cb3687&user=tylerjensen1107&format=json",

}).done(function(data) {
	$.each(data.weeklychartlist.chart, function(index, weeklyData) {
		var to = weeklyData.to;
		var from = weeklyData.from;
		$.ajax({
			url: "http://ws.audioscrobbler.com/2.0/?method=user.getWeeklyArtistChart&api_key=5e2801138b4ef76aeb794a9469cb3687&user=tylerjensen1107&format=json&from=" + from + "&to=" + to,

		}).done(function(data) {
			console.log(data);
            if(data.weeklyartistchart.artist.length > 0) week++;
			$.each(data.weeklyartistchart.artist, function(index, weeklyData) {
				if(!dataArray[week])
					dataArray[week] = [];
 				dataArray[week].push({artist: weeklyData.name, 
												 playCount: weeklyData.playcount});
			});

			
		});
	});

});

setTimeout(function() {
    console.log(dataArray);
    d3.select("body").selectAll("p").data(dataArray["Unkown Mortal Orchestra"]);
     x.domain(d3.extent(dataArray["Unkown Mortal Orchestra"], function(d) { console.log(d); return d.date; }));
}, 10000);

svg.append("g")
	.attr("class", "x axis")
	.attr("transform", "translate(0," + height + ")")
	.call(xAxis);

// Add the Y Axis
svg.append("g")
	.attr("class", "y axis")
	.call(yAxis);

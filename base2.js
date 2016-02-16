var dataArray = [];
var bandNameArray = [];
var bands = 0;

var week = -1;
var maxPlayCount = 0;

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
			if(data.weeklyartistchart.artist.length > 0) {
        week++;
  			$.each(data.weeklyartistchart.artist, function(index, weeklyData) {
  				// if(!dataArray[weeklyData.name])
  				// 	dataArray[weeklyData.name] = [];
   			// 	dataArray[weeklyData.name].push({date: data.weeklyartistchart['@attr'].to, 
  				// 								playCount: weeklyData.playcount});

  				// Converts string of date in seconds to MM/DD/YYYY
  				var date = new Date(data.weeklyartistchart['@attr'].to * 1000)
  					.toLocaleDateString();
  				var name = weeklyData.name;

  				if(weeklyData.playcount > maxPlayCount) maxPlayCount = weeklyData.playcount;

   				if(!bandNameArray[name]) {
  					bandNameArray[name] = {index: bands,
  											  name: name};
  					bands++;

  					dataArray.push([{name: weeklyData.name, 
  												playCount: weeklyData.playcount,
  												weekDate: date,
  												dateInSeconds: data.weeklyartistchart['@attr'].to,
                          weekNumber: week
                        }]);

  				} else {
   					dataArray[bandNameArray[name].index].push({name: weeklyData.name, 
  												playCount: weeklyData.playcount,
  												weekDate: date,
  												dateInSeconds: data.weeklyartistchart['@attr'].to,
                          weekNumber: week
                        });
   				}
  			});

    			// console.log(data);
       //          if(data.weeklyartistchart.artist.length > 0) week++;
    			// $.each(data.weeklyartistchart.artist, function(index, weeklyData) {
    			// 	if(!dataArray[week])
    			// 		dataArray[week] = [];
     		// 		dataArray[week].push({artist: weeklyData.name, 
    			// 									 playCount: weeklyData.playcount});
    			// });
      }
		});
	});
});

// Waiting to call render function
setTimeout(function() {
  render(dataArray);
}, 10000);

function render(data){
  console.log("IN RENDER");

  // Getting desired data
  var newData = [];
  var max = 32;
  for (var i = 0; i < data.length; i++) {
    var weekPlayCount = [];
    for (var j = 0; j < data[i].length; j++) {
      weekPlayCount.push(data[i][j].playCount);
    }
    // if (max < weekPlayCount.length) max = weekPlayCount.length;
    while (max > weekPlayCount.length) {
      weekPlayCount.push(0);
    }
    newData.push(weekPlayCount);
  }
  // console.log(newData);

  // permute the data
  newData = newData.map(function(d) { return d.map(function(p, i) { return {x:i, y:p, y0:0}; }); });

  var outerWidth = 1000;
  var outerHeight = 500;
  var margin = { left: 55, top: 5, right: 100, bottom: 60 };

  var xColumn = "weekNumber";
  var yColumn = "listens";
  var colorColumn = "country";
  var areaColumn = colorColumn;

  var xAxisLabelText = "Week";
  var xAxisLabelOffset = 48;

  var yAxisLabelText = "Listens";
  var yAxisLabelOffset = 35;

  var innerWidth  = outerWidth  - margin.left - margin.right;
  var innerHeight = outerHeight - margin.top  - margin.bottom;

  var x = d3.scale.linear()
      .range([0, innerWidth])
      .domain([0,4]);

  var y = d3.scale.linear()
      .range([innerHeight, 0])
      .domain([0,30]);

  var z = d3.scale.category20c();

  var svg = d3.select("#chart").append("svg:svg")
      .attr("width", outerWidth)
      .attr("height", outerHeight);
  var g = svg.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Appending x axis
  var xAxisG = g.append("svg:g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + innerHeight + ")")
  var xAxisLabel = xAxisG.append("text")
    .style("text-anchor", "middle")
    .attr("transform", "translate(" + (innerWidth / 2) + "," + xAxisLabelOffset + ")")
    .attr("class", "label")
    .text(xAxisLabelText);

  // Appending y axis
  var yAxisG = g.append("svg:g")
    .attr("class", "y axis");
  var yAxisLabel = yAxisG.append("text")
    .style("text-anchor", "middle")
    .attr("transform", "translate(-" + yAxisLabelOffset + "," + (innerHeight / 2) + ") rotate(-90)")
    .attr("class", "label")
    .text(yAxisLabelText);

  var colors = d3.scale.category10();

  colors.domain(data.map(function (d, i){ return d[0].name; }));

  // Appending color legend
  var colorLegendG = svg.append("svg:g")
    .attr("class", "color-legend")
    .attr("transform", "translate("+ (outerWidth - 100) + ", 5)");

  var stack = d3.layout.stack()
        .offset("zero")
      
  var layers = stack(newData);

  var area = d3.svg.area()
      .interpolate('cardinal')
      .x(function(d, i) { return x(i); })
      //.y0(function(d) { return y(innerHeight); })
      .y1(function(d) { return y(d.y0 + d.y); });

  svg.selectAll(".layer")
        .data(layers)
        .enter().append("path")
        .attr("class", "layer")
        .attr("d", function(d) { return area(d); })
        .style("fill", function(d, i) { return colors(i); });

//vis.append("svg:line").attr("x1",x(startYear)).attr("y1",y(0)).attr("x2",x(startYear)).attr("y2",y(45)).attr("class","axis")


}
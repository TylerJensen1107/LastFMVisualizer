
var dataArray = [];
var bandNameArray = [];
var bands = 0;
var TIME_CONST = 26;
var NUM_BANDS = 10;
var currUser;
var startDate = null;

var week = -1;
var maxPlayCount = 0;
var csvString = "band,week,playcount\n";
var loaded = false;
var sortByConsistency = true;

var parseDate = d3.time.format("%m/%d/%Y").parse;

document.getElementById("submit").onclick = callLoadName;

function callLoadName() {
  // Removes all data from graph
  d3.select("svg").remove();

  var username = document.getElementById("name").value;

  if(currUser && currUser != username) {
  	loaded = false;
  	currUser = username;
  }
  else currUser = username; 

  var newTimeConst = document.getElementById("timeConst").value;
  
  if (newTimeConst.length > 0) {
    TIME_CONST = newTimeConst;
  }

  var newArtistNum = document.getElementById("numArtists").value;
  if (newArtistNum.length > 0) {
    NUM_BANDS = newArtistNum;
  }

  sortByConsistency = document.getElementById("consistency").checked;
  console.log(sortByConsistency);

  if(!loaded) {
  	dataArray = [];
  	bandNameArray = [];
  	bands = 0;
  	week = -1;
  	maxPlayCount = 0;
  	startDate = null;
	document.getElementById("loading").style.display = "inline";
	document.getElementById("loading").style.width = "50px";
	document.getElementById("loading").style.height = "50px";

	$.when(loadName(document.getElementById("name").value)).done(function() {
		loaded = true;
		loadGraph();
	});
   } else {
	loadGraph();
   }

}

function loadName(name) {

	var def = $.Deferred();

	$.ajax({
		url: "http://ws.audioscrobbler.com/2.0/?method=user.getWeeklyChartList&api_key=5e2801138b4ef76aeb794a9469cb3687&user=" + name + "&format=json",

	}).done(function(data) {

		var requests = [];

        requests.push(loadWeekData(data, name));

        $.when.apply($, requests).then(function() { def.resolve(); });

	});

	return def.promise();
}

function loadGraph() {
	startDate = new Date(startDate);
	csvString = "band,week,playcount\n";
 	dataArray.sort(function(a, b) {
		if(sortByConsistency) return consistencySort(a, b);
		else return sortByTotalPlayCount(a, b);
 	});
 	for(var i = 0; i < Math.min(NUM_BANDS, dataArray.length); i++) {
 		var index = 0;
 		var monthCount = 0;
 		var currDate = new Date(startDate.toLocaleDateString());
 		for(var j = 0; j < week; j++) {
 			currDate.setDate(currDate.getDate() + 7);
 			if(dataArray[i][index]) {
 				if(dataArray[i][index].weekNumber == j) { //if there is data for this week
 					if(j % TIME_CONST == 0) {
			 			monthCount += parseInt(dataArray[i][index].playCount);
			 			csvString += dataArray[i][index].name + ",";
						csvString += currDate.toLocaleDateString() + ",";
		 				csvString += monthCount + "\n";
		 				monthCount = 0;
		 			} else {
		 				monthCount += parseInt(dataArray[i][index].playCount);
		 			}
	 				index++;
	 			} else { // no data for this week
	 				if(j % TIME_CONST == 0) {
		 				csvString += dataArray[i][0].name + ",";
						csvString += currDate.toLocaleDateString() + ",";
		 				csvString += monthCount + "\n";
		 				monthCount = 0;
		 			}
	 			}
 			} else { // out of data, but still need to fill in extra weeks
 				if(j % TIME_CONST == 0) {
	 				csvString += dataArray[i][0].name + ",";
					csvString += currDate.toLocaleDateString() + ",";
	 				csvString += 0 + "\n";

	 			}
 			}
 		}
 	}
    render(d3.csv.parse(csvString, type));
    document.getElementById("loading").style.display = "none";
}

function loadWeekData(data, name) {

	var def = $.Deferred(), requests = [];

	$.each(data.weeklychartlist.chart, function(index, weeklyData) {
		var to = weeklyData.to;
		var from = weeklyData.from;
		requests.push(
			$.ajax({
				url: "http://ws.audioscrobbler.com/2.0/?method=user.getWeeklyArtistChart&api_key=5e2801138b4ef76aeb794a9469cb3687&user=" + name + "&format=json&from=" + from + "&to=" + to,

			}).done(function(data) {
				if(data.weeklyartistchart.artist.length > 0) {
	        		week++;
		  			$.each(data.weeklyartistchart.artist, function(index, weeklyData) {
		  				var date = new Date(data.weeklyartistchart['@attr'].to * 1000)
		  					.toLocaleDateString();
		  				if(!startDate) startDate = date;
		  				var name = weeklyData.name;
		  				//csvString += name + "," + week + "," + weeklyData.playcount +"\n";

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
      			}
			})
		);
	});

  $.when.apply($, requests).then(function() { def.resolve(); });

  return def.promise();
}

// Responsible for setting the domain with the retrieved data
// x.domain(dataArray.map(function(d) { return d.1/3/2016; }));
// code omitted.
// .on('mouseout', tip.hide)


function render(data){

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

	var svg = d3.select("#chart").append("svg")
	  .attr("width", outerWidth)
	  .attr("height", outerHeight);
	var g = svg.append("g")
	  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var xAxisG = g.append("g")
	  .attr("class", "x axis")
	  .attr("transform", "translate(0," + innerHeight + ")")
	var xAxisLabel = xAxisG.append("text")
	  .style("text-anchor", "middle")
	  .attr("transform", "translate(" + (innerWidth / 2) + "," + xAxisLabelOffset + ")")
	  .attr("class", "label")
	  .text(xAxisLabelText);

	var yAxisG = g.append("g")
	  .attr("class", "y axis");
	var yAxisLabel = yAxisG.append("text")
	  .style("text-anchor", "middle")
	  .attr("transform", "translate(-" + yAxisLabelOffset + "," + (innerHeight / 2) + ") rotate(-90)")
	  .attr("class", "label")
	  .text(yAxisLabelText);

	var colorLegendG = svg.append("g")
	  .attr("class", "color-legend")
	  .attr("transform", "translate("+ (outerWidth - 80) + ", 5)");

	var xScale = d3.time.scale().range([0, innerWidth]);
	var yScale = d3.scale.linear().range([innerHeight, 0]);
	var colorScale = d3.scale.category20();

	var xAxis = d3.svg.axis().scale(xScale).orient("bottom")
	  .ticks(5)
	  .outerTickSize(0);
	var yAxis = d3.svg.axis().scale(yScale).orient("left")
	  .ticks(5)
	  .outerTickSize(0);

	// https://bl.ocks.org/mbostock/6452972
	// var brush = d3.svg.brush()
	// .x(xAxis)
	// .extent([0, 0])
	// .on("brush", brushed);

	var stack = d3.layout.stack()
	  .y(function (d){ return d.playcount; })
	  .values(function (d){ return d.values; });

	var area = d3.svg.area()
	  .x(function(d) { return xScale(d.week); xScale(d.week); })
	  .y0(function(d) { return yScale(d.y0); })
	  .y1(function(d) { return yScale(d.y0 + d.y); });
	  
	var colorLegend = d3.legend.color()
	  .scale(colorScale)
	  .shapePadding(3)
	  .shapeWidth(15)
	  .shapeHeight(15)
	  .labelOffset(4);

  var nested = d3.nest()
    .key(function (d){ return d.band; })
    .entries(data);

   colorScale.domain(nested.map(function (d){ return d.key; }));


  // Reversed the order here so the order matches between legend & areas.
  var layers = stack(nested.reverse());
  xScale.domain(d3.extent(data, function (d){ return d.week; }));
      yScale.domain([
        0,
        d3.max(layers, function (layer){
          return d3.max(layer.values, function (d){
            return d.y0 + d.y;
          });
        })
      ]);

  // Define the div for the tooltip
  var div = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);

  var paths = g.selectAll(".chart-area").data(layers);
  paths.enter().append("path").attr("class", "chart-line");
  paths.exit().remove();
  paths
    .attr("d", function (d){ return area(d.values); })
    .attr("fill", function (d){ return colorScale(d.key); });

  paths.on("mouseover", function(d) {
  	var totalPlays = 0;
  	for (var i = 0; i < d.values.length; i++) {
  		totalPlays += d.values[i].playcount;
  	}
  	div.transition()		
       .duration(200)		
       .style("opacity", .9);		
    div.html(d.key + "<br>Play count: " + totalPlays)	
        .style("left", (d3.event.pageX) + "px")		
        .style("top", (d3.event.pageY - 28) + "px");	
  	d3.select(this).attr("stroke", "black");
  	d3.select(this).attr("stroke-width", function(d) {return 5;});
  });
  paths.on("mouseout", function() {
  	div.transition()		
       .duration(500)		
       .style("opacity", 0);
  	d3.select(this).attr("stroke", "white");
  	d3.select(this).attr("stroke-width", "0");
  });


  xAxisG.call(xAxis);
  yAxisG.call(yAxis);

  colorLegendG.call(colorLegend);
}

function brushed() {
  var value = brush.extent()[0];

  if (d3.event.sourceEvent) { // not a programmatic event
    value = xAxis.invert(d3.mouse(this)[0]);
    brush.extent([value, value]);
  }

  handle.attr("cx", x(value));
  d3.select("body").style("background-color", d3.hsl(value, .8, .8));
}

function type(d){
  d.week = parseDate(d.week);
  d.playcount = +d.playcount;
  return d;
}

function sortByTotalPlayCount(a, b) {
	var totalPlaysA = 0;
  	for (var i = 0; i < a.length; i++) {
  		totalPlaysA += parseInt(a[i].playCount);
  	} 
  	var totalPlaysB = 0;
  	for (var i = 0; i < b.length; i++) {
  		totalPlaysB += parseInt(b[i].playCount);
  	}		
  	return  totalPlaysB - totalPlaysA;
}

function consistencySort(a, b) {
	return b.length - a.length;
}



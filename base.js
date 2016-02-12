
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

// Responsible for setting the domain with the retrieved data
// x.domain(dataArray.map(function(d) { return d.1/3/2016; }));
// code omitted.
// .on('mouseout', tip.hide)


  var outerWidth = 2000;
  var outerHeight = 1000;
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

  var svg = d3.select("body").append("svg")
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
    .attr("transform", "translate("+ (outerWidth - 100) + ", 5)");

  var xScale = d3.scale.linear().range([0, innerWidth]);
  var yScale = d3.scale.linear().range([innerHeight, 0]);
  var colorScale = d3.scale.category10();


  var xAxis = d3.svg.axis().scale(xScale).orient("bottom")
    .ticks(5)
    .outerTickSize(0);
  var yAxis = d3.svg.axis().scale(yScale).orient("left")
    .ticks(5)
    .outerTickSize(0);

  var stack = d3.layout.stack()
    .y(function (d){ return d[yColumn]; })
    .values(function (d){ return d.values; });

  var area = d3.svg.area()
    .x(function(d) { return xScale(d.weekNumber); })
    .y0(function(d) { return yScale(d.playCount); })
    .y1(function(d) { return yScale(d.playCount + 2); });
    
  var colorLegend = d3.legend.color()
    .scale(colorScale)
    .shapePadding(3)
    .shapeWidth(15)
    .shapeHeight(15)
    .labelOffset(4);

  function render(data){
  	console.log("IN RENDER");


    colorScale.domain(data.map(function (d, i){ return d[0].name; }));

    // Reversed the order here so the order matches between legend & areas.
    //var layers = stack(nested.reverse());

    xScale.domain([0, week]);
    yScale.domain([
      0,
      maxPlayCount
    ]);

    var paths = g.selectAll(".chart-area").data(data);
    paths.enter().append("path").attr("class", "chart-line");
    paths.exit().remove();
    paths
      .attr("d", function (d, i){ return area(d); })
      .attr("stroke", function (d){ return colorScale(d[0].name); })
      .attr("fill", function (d){ return colorScale(d[0].name); });

    xAxisG.call(xAxis);
    yAxisG.call(yAxis);

    colorLegendG.call(colorLegend);
  }

  function type(d){
    d.year = new Date(d.year);
    d.population = +d.population;
    return d;
  }

 setTimeout(function() {
    render(dataArray);

}, 10000);
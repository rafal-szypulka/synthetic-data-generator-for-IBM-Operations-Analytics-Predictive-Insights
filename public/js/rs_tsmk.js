var opts = {
    lines: 13, // The number of lines to draw
    length: 20, // The length of each line
    width: 10, // The line thickness
    radius: 30, // The radius of the inner circle
    corners: 1, // Corner roundness (0..1)
    rotate: 0, // The rotation offset
    direction: 1, // 1: clockwise, -1: counterclockwise
    color: 'grey', // #rgb or #rrggbb or array of colors
    speed: 1, // Rounds per second
    trail: 60, // Afterglow percentage
    shadow: true, // Whether to render a shadow
    hwaccel: false, // Whether to use hardware acceleration
    className: 'spinner', // The CSS class to assign to the spinner
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    top: '50%', // Top position relative to parent
    left: '50%' // Left position relative to parent
};

var dd = new Date()
var tzOffset = dd.getTimezoneOffset();

function enableObjects() {
//    $('#showJSON').removeClass('disabled');
    $('#downloadCsv').removeClass('disabled');
    $('#downloadPiModel').removeClass('disabled');
    $('#downloadScript').removeClass('disabled');
//    $("#tabs").tabs("enable", "#tabs-1");
    $("#tabs").tabs("enable", "#tabs-2");
    $("#tabs").tabs("enable", "#tabs-3");
    $("#tabs").tabs("enable", "#tabs-4");
}

function disableObjects() {
//    $('#showJSON').removeClass('disabled');
    $('#downloadCsv').removeClass('enabled');
    $('#downloadPiModel').removeClass('enabled');
    $('#downloadScript').removeClass('enabled');
//    $("#tabs").tabs("enable", "#tabs-1");
    $("#tabs").tabs("disable", "#tabs-2");
    $("#tabs").tabs("disable", "#tabs-3");
    $("#tabs").tabs("disable", "#tabs-4");
}

// Get the size of teh div containing the plot
var divWidth = $('#canvas').width();
var divHeight = divWidth / 2.5;

// Define the margin and sizes of the plotting area
var margin = {
        top: 20,
        right: 40,
        bottom: 50,
        left: 30
    },
    width = divWidth - margin.left - margin.right,
    height = divHeight - margin.top - margin.bottom;
padding = 100;


// Scales for X and Y axes
var x_sampling = 86400 / $('select#sampling').val();

var x = d3.scale.linear().domain([0, x_sampling]).range([0, width]);
var y = d3.scale.linear().domain([0, 100]).range([height, 0]);

// X and Y axes
var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .innerTickSize(-height)
    .outerTickSize(6)
    .tickPadding(10);

var yAxisLeft = d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(10)
    .innerTickSize(-width)
    .outerTickSize(6)
    .tickPadding(10);

// The SVG element containing the plot
var svg = d3.select("#canvas")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

var line = d3.svg.line();

// Add the rectangle where the data will be drawn
svg.append("rect")
    .attr("id", "rect")
    .attr("x", 0)
    .attr("y", 0)
    .style("fill", "rgba(255,255,255,0.1)")
    .attr("width", width)
    .attr("height", height);

// Add the X and Y Axis
svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);
svg.append("g")
    .attr("class", "y axis")
    .call(yAxisLeft);

svg.append("text")
	.attr("id", "xAxisLabel")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", width - 5)
    .attr("y", height - 6)
    .text("5-minute(s) sample number within 24h");

svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("values");

var drawObj = {
    isDown: false,
    dataPoints: [],
    currentPath: null
};


// Function called when the mousedown event on the SVG canvas
// is detected
svg.on("mousedown", function() {
    var x;

    x = d3.mouse(this)[0];
    // Consider only events that happens inside the rect,
    // i.e. x > 0
    if (x > 0) {

        if (drawObj.dataPoints.length > 0) {
            //			drawObj.dataPoints = [];
            drawObj.currentPath = null;
            //			d3.selectAll(".currentPath").remove();
            enableObjects.apply(this);
			showJSON.apply(this);
        }
        drawObj.isDown = true;
    }

    // Block propagation of the event to other elements
    d3.event.preventDefault();

});

// Function called when the mousemove event on the SVG canvas
// is detected
svg.on("mousemove", function() {

    var x, y;
    x = d3.mouse(this)[0];
    y = d3.mouse(this)[1];

    // Consider to draw the point only if the isDown flag
    // has been set and the points are actually inside the rect x > 0
    if (drawObj.isDown && x > 0) {;
        // Apply constraints to x and y coordinates
        x = Math.max(0, x);
        x = Math.min(x, width);
        y = Math.max(0, y);
        y = Math.min(height, y);

        if (drawObj.dataPoints.length > 0) {
            // Impose that x coordinates are monotonically
            // increasing, otherwise skip
            if (x > drawObj.dataPoints[drawObj.dataPoints.length - 1][0]) {
                drawObj.dataPoints.push([x, y]);
            }
        } else {
            // First point, don't check for monotonically
            // increasing values
            drawObj.dataPoints.push([x, y]);
        }

        // Create the Pah object if not defined
        if (!drawObj.currentPath) {
            drawObj.currentPath = svg.append("path")
                .attr("class", "currentPath")
                .style("stroke-width", 4)
                .style("stroke", "#007AFF")
                .style("fill", "none");
        }

        // Draw the path
        drawObj.currentPath
            .datum(drawObj.dataPoints)
            .attr("d", line);

        // When the point is at the very right, 
        // terminate the line and activate buttons
        if (x >= width - 1.0) {
            drawObj.isDown = false;
            enableObjects.apply(this);
			showJSON.apply(this);
        }
    }

    // Block propagation of the event to other elements
    d3.event.preventDefault();
});

// Function that is called when the mouseup event on the SVG
// canvas is detected, i.e. completed to draw a line.
svg.on("mouseup", function() {
    drawObj.isDown = false;
    if (drawObj.dataPoints.length > 0) {
        enableObjects.apply(this);
		showJSON.apply(this);

    }
    d3.event.preventDefault();
});

document.body.addEventListener('mouseup', function(){
    drawObj.isDown = false;
    if (drawObj.dataPoints.length > 0) {
        enableObjects.apply(this);
		showJSON.apply(this);

    }
    d3.event.preventDefault();
});

(function($) {
    $.fn.checked = function(value) {
        if (value === true || value === false) {
            // Set the value of the checkbox
            $(this).each(function() {
                this.checked = value;
            });
        } else if (value === undefined || value === 'toggle') {
            // Toggle the checkbox
            $(this).each(function() {
                this.checked = !this.checked;
            });
        }

        return this;
    };
})(jQuery);

function setStatus() {
    document.getElementById("visibility").innerHTML = g.visibility().toString();
}

function toggleAllSeries(source) {
    checkboxes = document.getElementsByName("CB");
    for (var i = 0, n = checkboxes.length; i <= n; i++) {
        checkboxes[i].checked = source.checked;
        g.setVisibility(i + 1, source.checked);
    }
    setStatus();
}

function change(el) {
    g.setVisibility(parseInt(el.id), el.checked);
    setStatus();
}

function prepJSON() {
    var jsonData = {};
    jsonData.times = drawObj.dataPoints.map(function(v) {
        return x.invert(v[0]);
        //		    return v[0];
    });
    jsonData.values = drawObj.dataPoints.map(function(v) {
        return y.invert(v[1]);
        //			return v[1];
    });
    jsonData.met = $('textarea#met').val();
    jsonData.met_an = $('textarea#met_an').val();
	jsonData.met_an2 = $('textarea#met_an2').val();
    jsonData.datepicker = $('#datepicker').val();
    jsonData.days = $('#days').val();
    jsonData.resource = $('#resource').val();
	jsonData.sampling = $('#sampling').val();
	return jsonData;
    //return JSON.stringify(jsonData, null, 4);
}

function showJSON() {

    var jsonData = prepJSON();
	var data = JSON.stringify(jsonData, null, 4);
    $("#configDiv").html('<pre style="text-align: left">' + data + '</pre>');

}

function exportJSON() {

    var jsonData = prepJSON();
 	var data = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(jsonData));
//	console.log(data);
    $(this).attr({
	    'download': "config.json",
		'href': data,
		'target': '_blank'
		});
}


(function() {

    function onChange(event) {
        var reader = new FileReader();
        reader.onload = onReaderLoad;
        reader.readAsText(event.target.files[0]);
    }

    function onReaderLoad(event) {
        var u, w;
        var obj = JSON.parse(event.target.result);

        if (typeof obj.met != 'undefined') {
			$('textarea#met').val(obj.met);
        }
		
		if (typeof obj.met_an != 'undefined') {
			$('textarea#met_an').val(obj.met_an);
		}
		
		if (typeof obj.met_an2 != 'undefined') {
			$('textarea#met_an2').val(obj.met_an2);
        }
		
		if (typeof obj.datepicker != 'undefined') {
			$('#datepicker').val(obj.datepicker);
        }
		
		if (typeof obj.resource != 'undefined') {
        	$('#resource').val(obj.resource);
        }
		
		if (typeof obj.days != 'undefined') {
			$('#days').val(obj.days);
        }
		
		if (typeof obj.sampling != 'undefined') {
			$('#sampling').val(obj.sampling);
		}
		
//		var sampl =  $('#sampling').val()/60;
        drawObj.dataPoints = [];
		svg.select("#xAxisLabel")
		   .text($('#sampling').val()/60 + "-minute(s) sample number within 24h");
		
		x.domain([0,86400/$('#sampling').val()]);  
		svg.select(".x.axis")
	     .transition().duration(1500).ease("sin-in-out") 
	     .call(xAxis);
        d3.selectAll(".currentPath").remove();
        for (var i = 0; i < obj.times.length; i++) {
            //		    console.log(obj.times[i] + ','+ obj.values[i]);
            u = x(obj.times[i]);
            w = y(obj.values[i]);
            drawObj.dataPoints.push([u, w]);
        }

		 
        drawObj.currentPath = svg.append("path")
            .attr("class", "currentPath")
            .style("stroke-width", 4)
            .style("stroke", "#007AFF")
            .style("fill", "none")
            .datum(drawObj.dataPoints)
            .attr("d", line);
		enableObjects.apply(this);
		showJSON.apply(this);

    }
    document.getElementById('file').addEventListener('change', onChange);
}());



$( "#sampling" ).selectmenu({ change: function( event, ui ) { 
	x.domain([0,86400/$('#sampling').val()]);
	svg.select("#xAxisLabel")
   	    .text($('#sampling').val()/60 + "-minute(s) sample number within 24h"); 
	svg.select(".x.axis")
     .transition().duration(1500).ease("sin-in-out")  // https://github.com/mbostock/d3/wiki/Transitions#wiki-d3_ease
     .call(xAxis);
 }});

$(document).ready(function() {
    $('.metrics').keyup(function() {
        $('span.error-keyup-1').hide();
        var inputVal = $(this).val();
        var numericReg = /(^[\d\*\s\(\)rgym\-\+\?\:\n\<\>\/\.]+)$/;
        if (!numericReg.test(inputVal)) {
            $(this).after('<span class="error error-keyup-1"><br>Metric rules not valid.. Valid characters +-*?:[0-9]rand \\n and string:granger</span>');
        }
    });

    $.each($('select'), function () {
        $(this).selectmenu({ width : $(this).attr("width")})
    })
		
    function drawCsv() {
        var colDelim = ',';
        var rowDelim = '\r\n';

        var csv = 'time' + colDelim + 'value' + rowDelim;
        drawObj.dataPoints.map(function(v, i) {
            var t = x.invert(v[0]);
            var val = y.invert(v[1]);
            csv += t + colDelim + val + rowDelim;
        });
        var routes_jsonstr = csv;
        var met = $('textarea#met').val();
        var met_an = $('textarea#met_an').val();
		var met_an2 = $('textarea#met_an2').val();
        var datepicker = $('#datepicker').val();
        var resource = $('#resource').val();
		var sampling = $('#sampling').val();
        var days = $('#days').val();
        //		var delay = $('#delay').val();
        var target = document.getElementById('graphDiv1');
		var metArray = $('textarea#met').val().split('\n');
		var myTempText = "";
		      for (var i = 1; i < (metArray.length+1); i++) {
		   	   myTempText += "<input name='CB' id='" + i + "' type=checkbox checked onClick='change(this)'><label for='" + (i - 1) + "'> met" + i + "</label>\n";
		      }
		      //Write the completed list of labels into the "myLabelListDiv" div
		      document.getElementById('myLabelListDiv').innerHTML = myTempText;
			  
        $(':checkbox').checked(true);
        var spinner = new Spinner(opts).spin(target);

        $.ajax('/', {
            type: 'post',
            //		 async: false,
            data: {
                routes_jsonstr: routes_jsonstr,
                met: met,
                met_an: met_an,
				met_an2: met_an2,
                datepicker: datepicker,
                days: days,
                sampling: sampling,
                resource: resource,
                tzOffset: tzOffset
            },
            dataType: 'text',
            success: function(data) {
                if (/^Validation/.test(data)) {
                    $("#tabs-3").html(data);
                } else {
                    g = new Dygraph(
                        document.getElementById("graphDiv1"),
                        data, {
                            legend: 'always',
                            //			        highlightSeriesOpts: {
                            //			           strokeWidth: 4,
                            //			           strokeBorderWidth: 1,
                            //			           highlightCircleSize: 5,  //default=3
                            //			        },
                            //	                xValueFormatter: Dygraph.dateString_,
                            xValueParser: function(x) {
                                return parseInt(x, 10);
                            },
                            xTicker: Dygraph.dateTicker,
                            visibility: [false, true, true, true, true, true, true, true, true, true, true, true, true, true],
                            labelsUTC: true,
                            strokeWidth: 2,
                            colors: ["#A6761D", "#1B9E77", "#D95F02", "#7570B3", "#E7298A", "#66A61E", "#E6AB02"],
                            axes: {
                                x: {
                                    axisLabelFormatter: Dygraph.dateAxisLabelFormatter,
                                    valueFormatter: Dygraph.dateValueFormatter
                                }
                            }
                        }

                    );
                }
                g.ready(function() {
                    // stop spinner
                    //spinner.stop();
                });
            },
            error: function() {
                alert("Error");
            }
        });
    }


    // Function taht generates CSV representation of the data
    // and allows to download it
    function prevCsv() {
        var colDelim = ',';
        var rowDelim = '\r\n';

        var csv = 'time' + colDelim + 'value' + rowDelim;
        drawObj.dataPoints.map(function(v, i) {
            var t = x.invert(v[0]);
            var val = y.invert(v[1]);
            csv += t + colDelim + val + rowDelim;
        });

        var routes_jsonstr = csv;
        var met = $('textarea#met').val();
        var met_an = $('textarea#met_an').val();
		var met_an2 = $('textarea#met_an2').val();
        var datepicker = $('#datepicker').val();
        var resource = $('#resource').val();
        var days = $('#days').val();
        var sampling = $('#sampling').val();
        var target = document.getElementById('tabs-2');
        var spinner = new Spinner(opts).spin(target);

        $.ajax('/', {
            type: 'POST',
            async: 'true',
            data: {
                routes_jsonstr: routes_jsonstr,
                prev: 1,
                met: met,
                met_an: met_an,
				met_an2: met_an2,
                datepicker: datepicker,
                days: days,
                sampling: sampling,
                resource: resource,
                tzOffset: tzOffset
            },
            dataType: 'html',
            success: function(data) {
                // Insert the html into the page here using ".html(html)"
                // or a similar method.
                p = $("#tabs-2").html(data);
                //	      p.ready(function () {
                // stop spinner
                //spinner.stop();
                //	      });
            },
            error: function() {
                alert("Error");
            }
        });
    }

    $("#showJSON").on('click', function(event) {
        if (drawObj.dataPoints.length > 0) {

            showJSON.apply(this);
        }
    });
	
    $("#exportJSON").on('click', function(event) {
        //if (drawObj.dataPoints.length > 0) {

            exportJSON.apply(this);
        
    });

    $("#downloadCsv").unbind('click').bind('click', function(event) {
        if (drawObj.dataPoints.length > 0) {
            //		    downloadCsv.apply(this, ['data.csv']);
            var colDelim = ',';
            var rowDelim = '\r\n';
            var target = document.getElementById('tabs-4');
            var spinner = new Spinner(opts).spin(target);

            var csv = 'time' + colDelim + 'value' + rowDelim;
            drawObj.dataPoints.map(function(v, i) {
                var t = x.invert(v[0]);
                var val = y.invert(v[1]);
                csv += t + colDelim + val + rowDelim;
            });
            var routes_jsonstr = csv;
            //	var csvData;
            var datepicker = $('#datepicker').val();
            var met = $('textarea#met').val();
            var met_an = $('textarea#met_an').val();
			var met_an2 = $('textarea#met_an2').val();
            var resource = $('#resource').val();
            var days = $('#days').val();
            var sampling = $('#sampling').val();

            $.ajax('/', {
                //    async: false,
                type: 'post',
                data: {
                    routes_jsonstr: routes_jsonstr,
                    met: met,
                    met_an: met_an,
					met_an2: met_an2,
                    datepicker: datepicker,
                    days: days,
                    sampling: sampling,
                    resource: resource,
                    tzOffset: tzOffset
                },
                dataType: 'text',
                success: function(data) {
                    //		down = encodeURIComponent(data);
                    var allTextLines = data.split(/\r\n|\n/);
                    //    var headers = allTextLines[0].split(',');
                    //    var lines = [];
                    var firstRecord = allTextLines[1].split(',');
                    var lastRecord = allTextLines[allTextLines.length - 2].split(',');
                    var firstEpoch = firstRecord[0];
                    var lastEpoch = lastRecord[0];
                    var dFirst = moment(Number(firstEpoch)).format('[1]YYMMDDHHmmssSSS');
                    var dLast = moment(Number(lastEpoch)).format('[1]YYMMDDHHmmssSSS');

                    //			console.log(dFirst);
                    //		    csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(data);

                    var a = document.createElement("a");
                    document.body.appendChild(a);
                    a.style = "display: none";

                    blob = new Blob([data], {
                            type: "text/plain;charset=utf-8"
                        }),
                        url = window.URL.createObjectURL(blob);
                    a.href = url;
                    a.download = "RespTime_" + dFirst + "_" + dLast + ".csv";
                    a.click();
                    spinner.stop();
                },

                error: function() {
                    alert("Error");
                }
            });

            //$(this).attr({
            //	    'download': "data.csv",
            //		'href': csvData,
            //		'target': '_blank'
            //	});		
        }
    });

    $("#downloadPiModel").unbind('click').bind('click', function(event) {
		var met = $('textarea#met').val();
        $.ajax('/', {
            type: 'POST',
            async: 'false',
            data: {
                model: 1,
				met: met
            },
            dataType: 'html',
            success: function(data) {
                var a = document.createElement("a");
                document.body.appendChild(a);
                a.style = "display: none";
                blob = new Blob([data], {
                        type: "text/plain;charset=utf-8"
                    }),
                    url = window.URL.createObjectURL(blob);
                a.href = url;
                a.download = "sdgen.pamodel";
                a.click();
            },
            error: function() {
                alert("Error");
            }
        });
    });

$('a.description').click( function(e) {        
	      e.preventDefault(); // stops link from making page jump to the top
	      e.stopPropagation(); // when you click the button, it stops the page from seeing it as clicking the body too
	      $(this).next().toggle();
          if($(this).find("span#accordionIcon").text()=="►"){
          	$(this).find("span#accordionIcon").text("▼");
          }
          else{
              $(this).find("span#accordionIcon").text("►");
		  }
	  });
	
$('#example tr').click(function() {
	    $.ajax('/download', {
		    type: 'GET',
			async: 'false',
		    data: {
		    	example: this.id,
		    },
		    dataType: 'html',
		    success: function (data) {
				var u, w;
		        var obj = JSON.parse(data);
				//console.log(obj.met);
		        if (typeof obj.met != 'undefined') {
					$('textarea#met').val(obj.met);
		        }
		
				if (typeof obj.met_an != 'undefined') {
					$('textarea#met_an').val(obj.met_an);
				}
		
				if (typeof obj.met_an2 != 'undefined') {
					$('textarea#met_an2').val(obj.met_an2);
		        }
		
				if (typeof obj.datepicker != 'undefined') {
					$('#datepicker').val(obj.datepicker);
		        }
		
				if (typeof obj.resource != 'undefined') {
		        	$('#resource').val(obj.resource);
		        }
		
				if (typeof obj.days != 'undefined') {
					$('#days').val(obj.days);
		        }
		
				if (typeof obj.sampling != 'undefined') {
					$('#sampling').val(obj.sampling);
				}
				
		        drawObj.dataPoints = [];
				x.domain([0,86400/$('#sampling').val()]);
	 		    svg.select("#xAxisLabel")
	 		       .text($('#sampling').val()/60 + "-minute(s) sample number within 24h");  
				svg.select(".x.axis")
			       .transition().duration(1500).ease("sin-in-out") 
			       .call(xAxis);
		        d3.selectAll(".currentPath").remove();
		        
		        for (var i = 0; i < obj.times.length; i++) {
		            //		    console.log(obj.times[i] + ','+ obj.values[i]);
		            u = x(obj.times[i]);
		            w = y(obj.values[i]);
		            drawObj.dataPoints.push([u, w]);
		        }

		        drawObj.currentPath = svg.append("path")
		            .attr("class", "currentPath")
		            .style("stroke-width", 4)
		            .style("stroke", "#007AFF")
		            .style("fill", "none")
		            .datum(drawObj.dataPoints)
		            .attr("d", line);
				 enableObjects.apply(this);	
				showJSON.apply(this);
		    },

	    });
	});

    $("#downloadScript").unbind('click').bind('click', function(event) {
        if (drawObj.dataPoints.length > 0) {
            //		    downloadCsv.apply(this, ['data.csv']);
            var colDelim = ',';
            var rowDelim = '\r\n';
            var target = document.getElementById('tabs-4');
            var spinner = new Spinner(opts).spin(target);

            var csv = 'time' + colDelim + 'value' + rowDelim;
            drawObj.dataPoints.map(function(v, i) {
                var t = x.invert(v[0]);
                var val = y.invert(v[1]);
                csv += t + colDelim + val + rowDelim;
            });
            var routes_jsonstr = csv;
            //	var csvData;
            var datepicker = $('#datepicker').val();
            var met = $('textarea#met').val();
            var met_an = $('textarea#met_an').val();
            var met_an2 = $('textarea#met_an2').val();
			
            var resource = $('#resource').val();
            var days = $('#days').val();
            var sampling = $('#sampling').val();
            $.ajax('/', {
                type: 'POST',
                async: 'true',
                data: {
                    routes_jsonstr: routes_jsonstr,
                    script1: 1,
                    met: met,
                    met_an: met_an,
					met_an2: met_an2,
                    datepicker: datepicker,
                    days: days,
                    sampling: sampling,
                    resource: resource,
                    tzOffset: tzOffset
                },
                dataType: 'html',
                success: function(data) {
                    // Insert the html into the page here using ".html(html)"
                    // or a similar method.
                    var a = document.createElement("a");
                    document.body.appendChild(a);
                    a.style = "display: none";

                    blob = new Blob([data], {
                            type: "text/plain;charset=utf-8"
                        }),
                        url = window.URL.createObjectURL(blob);
                    a.href = url;
                    a.download = "sdgen.sh";
                    a.click();
                    //	      p.ready(function () {
                    // stop spinner
                    spinner.stop();
                    //	      });
                },
                error: function() {
                    alert("Error");
                }
            });
        }
    });


    $("#reset").on('click', function(event) {
        if(drawObj.dataPoints.length > 0){
        		drawObj.dataPoints = [];
        		drawObj.currentPath = null;
        		d3.selectAll(".currentPath").remove();
				disableObjects.apply(this);	
	}
        //window.location.reload();
    });

    $('#tabs').tabs({
        cache: false,
        activate: function(event, ui) {
            if (ui.newTab.index() == 6) {
                showJSON.apply(this);
            }
            if (ui.newTab.index() == 1) {
                prevCsv.apply(this);
            }
            if (ui.newTab.index() == 2) {
                drawCsv.apply(this);
            }
        },
        active: 0,
        ajaxOptions: {
            cache: false
        }
    });

    $("#tabs").tabs("option", "disabled", [1, 2, 3]);

    $("#datepicker").datepicker({}).datepicker("setDate", "-20");


});

$(function() {
    $("#accordion").accordion({
        heightStyle: "content"
    });
});


(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-83388512-1', 'auto');
ga('send', 'pageview');


// Define map size on screen
var margin = {top: 50, right: 50, bottom: 20, left: 50},
width = 940,
height = 550;

var svg = d3.select(".chart")
.attr("width", width)
.attr("height", height)
.attr("align", 'center')

var g = svg.append("g");

// var zoom = d3.behavior.zoom()
// .translate([0, 0])
// .scale(1.2)
// .scaleExtent([1, 8])
// .on("zoom", zoomed);

// svg.call(zoom) // delete this line to disable free zooming
// .call(zoom.event);

// Align center of Brazil to center of map

var projection = d3.geo.mercator()
.scale(window.innerHeight)
.center([-52, -15])
.translate([width / 2, height / 2]);

var path = d3.geo.path()
.projection(projection);

// Load data (asynchronously)
d3_queue.queue()
.defer(d3.json, "./br-states.json")
.defer(d3.csv, "files/eleicoes_2014.csv")
.await(ready);

function ready(error, shp, data) {
   if (error) throw error;

   var votes = d3.nest()
   .key(function(d) { return d.cat_state;})
   .key(function(d) { return d.cat_party;})
   .rollup(function(d) {
      return d3.sum(d, function(g) {return g.num_votes; });
   }).entries(data);

   // console.log(votes[0]);
   // console.log(d3.max(votes[0], votes[0].values));

   // Extracting polygons and contours
   var states = topojson.feature(shp, shp.objects.estados);
   var states_contour = topojson.mesh(shp, shp.objects.estados);

   var moreVotedParties = [];
   var colors = ['red', 'blue', 'green', 'yellow'];
   var parties = ['PT', 'PSDB', 'PSB', 'PMDB'];
   var max = 0;

   var rect = g.selectAll("rect")
   .data(parties)
   .enter().append("rect")
   .attr("width", 20).attr("height", 20)
   .attr("rx", 2).attr("ry", 2)
   .attr("x", width / 2 + 300)
   .attr("y", function(d, i){ return i * 100 + height / 4; })
   .style("stroke", 'black')
   .style("fill", function(d){ return colors[parties.indexOf(d)];})
   .style("opacity", 0.7);

   var text = g.selectAll("text")
   .data(parties)
   .enter().append("text")
   .attr("x", width / 2 + 325)
   .attr("y", function(d, i){ return i * 100 + height / 4 + 15; })
   .text(function(d){ return d; });

   // Desenhando estados
   g.selectAll(".estado")
   .data(states.features)
   .enter().append("path").attr({
      class: 'state',
      d: path
   });

   g.append("path")
   .datum(states_contour)
   .attr("d", path)
   .attr("class", "state_contour");

   // console.log(g.select("path"));


   // console.log(votes);
   votes.forEach(function(state){
      var maxParty;
      state.values.forEach(function(party){
         if(party.values > max){
            max = party.values;
            maxParty = party.key;
         }
      });
      moreVotedParties.push(maxParty);
      // console.log(state);
      // console.log(state.key + ": " + maxParty + " - "+ max);
      max = 0;
   });
   // console.log(moreVotedParties[18]);
   // console.log(moreVotedParties);
   moreVotedParties.pop();
   // console.log(g.selectAll("path").data(states.features));
   // console.log(moreVotedParties);
   // g.select("path").data(states.features, function(d){
   console.log(g.selectAll("path").data(states.features));
   g.selectAll("path")
   .data(states.features)
   .style("fill", function(d, i){
      return (colors[parties.indexOf(moreVotedParties[i])]);
   })
   .style('fill-opacity', '0.7')
   .on("mouseover", mouseover)
   .on("mousemove", mousemove)
   .on("mouseout", mouseout);
   // .on("mouseover", function(d) {
   //    div.transition()
   //        .duration(200)
   //        .style("opacity", 1);
   //    div .html(d.properties.nome)
   //        .style("left", (d3.event.pageX) + "px")
   //        .style("top", (d3.event.pageY) + "px");
   //    })
   // .on("mouseout", function(d) {
   //    div.transition()
   //        .duration(500)
   //        .style("opacity", 0);
   // });

}

var div = d3.select("body").append("div")
.attr("class", "tooltip")
.style("opacity", 0);

// function type(d) {
//    d.num_votes = +d.num_votes; // coerce to number
//    return d;
// }

// What to do when zooming
// function zoomed() {
//    g.style("stroke-width", 1.5 / d3.event.scale + "px");
//    g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
// }
// d3.select(self.frameElement).style("height", height + "px");

function showInfo(d, i){
   // d3.select(this).style("fill", 'orange');
   d3.select("text")
   .append("text")
   .attr("x", 100)
   .attr("y", 100)
   .text(function(){ return "ABC";});
}

var div = d3.select("body").append("div")
.attr("class", "tooltip")
.style("display", "none");

function mouseover() {
   div.style("display", "inline");
}

function mousemove(d) {
   div
   .text(d.properties.nome + "</br>" + d.num_votes)
   .style("left", (d3.event.pageX) + "px")
   .style("top", (d3.event.pageY) + "px");
}

function mouseout() {
   div.style("display", "none");
}

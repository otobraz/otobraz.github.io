// Define map size on screen
var margin = {top: 100, right: 50, bottom: 150, left: 50},
width = window.innerWidth / 2.5,
height = window.innerHeight - margin.top - margin.bottom;

var svg = d3.selectAll(".chart")
.attr("width", width)
.attr("height", height)

var g = svg.append("g")
   .attr("id", function(d, i){ return ("g"+i);});

// var svg1 = d3.selectAll(".chart1")
// .attr("width", '100%')
// .attr("height", height)
// // .attr("align", 'center')
//
// var g1 = svg.append("g");

// var zoom = d3.behavior.zoom()
// .translate([0, 0])
// .scale(1.2)
// .scaleExtent([1, 8])
// .on("zoom", zoomed);

// svg.call(zoom) // delete this line to disable free zooming
// .call(zoom.event);

// Align center of Brazil to center of map

var projection = d3.geoMercator()
.scale(width)
.center([-52, -15])
.translate([width / 2, height - margin.top - margin.bottom]);

var path = d3.geoPath()
.projection(projection);

// Load data (asynchronously)

var files = ['data/br-states.json', 'data/eleicoes_2014.csv'];
var promises = [];

promises.push(d3.json('data/br-states.json'));
promises.push(d3.csv('data/eleicoes_2014.csv'));

Promise.all(promises)
   .then(makeMap)
   .catch(function(error){
      throw error;
   });

// d3_queue.queue()
// .defer(d3.json, "./br-states.json")
// .defer(d3.csv, "files/eleicoes_2014.csv")
// .await(ready);
function makeMap(data) {

   var votes = d3.nest()
   .key(function(d) { return d.cat_state;})
   .key(function(d) { return d.cat_party;})
   .rollup(function(d) {
      return d3.sum(d, function(g) {return g.num_votes;});
   }).entries(data[1]);

   console.log(votes);

   var votesByTurn = d3.nest()
   .key(function(d) { return d.num_turn;})
   .key(function(d) { return d.cat_state;})
   .key(function(d) { return d.cat_party;})
   .rollup(function(d) {
      return d3.sum(d, function(g) {return g.num_votes;});
   }).entries(data[1]);

   // console.log(votes);
   // console.log(d3.max(votes[0], votes[0].values));

   // Extracting polygons and contours
   var states = topojson.feature(data[0], data[0].objects.estados);
   var states_contour = topojson.mesh(data[0], data[0].objects.estados);

   var mostVotedByTurn = [[],[]];
   var mostVoted = [];
   // console.log(mostVotedByTurn[0][0]);
   // mostVotedByTurn[0] = {teste: "a"};
   // console.log(mostVotedByTurn);
   var colors = [
      {party: 'PT', color: '#33a02c'},
      {party: 'PSDB', color: '#1f78b4'},
      {party: 'PSB', color: '#b2df8a'},
      {party: 'PMDB', color: '#a6cee3'},
   ];

   // var parties = ['PT', 'PSDB', 'PSB', 'PMDB'];
   var max = 0;

   // var rect = svg.select("#g1").selectAll("rect")
   // .data(colors)
   // .enter().append("rect")
   // .attr("width", 20).attr("height", 20)
   // .attr("rx", 2).attr("ry", 2)
   // .attr("x", width / 2 + 125)
   // .attr("y", function(d, i){ return i * 25 + height / 2 + 50; })
   // .style("stroke", 'black')
   // .style("fill", function(d){ return d.color;})
   // .style("opacity", 1);
   // //
   // var text = svg.select("#g1").selectAll("text")
   // .data(colors)
   // .enter().append("text")
   // .attr("x", width / 2 + 150)
   // .attr("y", function(d, i){ return i * 25 + height / 2 + 65; })
   // .text(function(d){ return d.party; });
   var legend = d3.select(".legend")
      .attr("width", '100%')
      .attr("height", '100%');

   legend.selectAll("rect")
   .data(colors)
   .enter().append("rect")
   .attr("width", 20).attr("height", 20)
   .attr("rx", 2).attr("ry", 2)
   .attr("y", function(d, i){ if(i>=2){ return height / 2 + 75; } return height / 2;})
   .attr("x", function(d, i) { if(i == 0 || i == 2) return 25; return 125;})
   .style("fill", function(d){ return d.color;});
   //
   var text = legend.selectAll("text")
   .data(colors)
   .enter().append("text")
   .attr("y", function(d, i){ if(i>=2){ return height / 2 + 90; } return height / 2 + 15;})
   .attr("x", function(d, i) { if(i == 0 || i == 2) return 50; return 150;})
   .text(function(d){ return d.party; });

   // var text = legend.append("text")
   // // .attr("x", width / 2)
   // .attr("y", height / 2)
   // .style("font-style", 'italic')
   // .style("font-size", '14px')
   // .style("text-anchor", 'middle')
   // .text('*Passe o cursor nos estados para mais informações');

   // Desenhando estados
   g.selectAll(".estado")
   .data(states.features)
   .enter().append("path")
      .attr("class", 'state')
      .attr("d", path);
   // .attr("id", function(d,i){ return ("path" + i);});

   g.append("path")
   .datum(states_contour)
   .attr("d", path)
   .attr("class", "state_contour");

   // g.selectAll(".estado1")
   // .data(states.features)
   // .enter().append("path").attr({
   //    class: 'state',
   //    d: path
   // });

   // g.append("path")
   // .datum(states_contour)
   // .attr("d", path)
   // .attr("class", "state_contour");

   // console.log(g.select("path"));

   // var maxParty = [];
   // console.log(votes);
   votesByTurn.forEach(function(turn, i){
      turn.values.forEach(function(state){
         var maxParty;
         // console.log(state.key);
         state.values.forEach(function(party){
            if(party.value > max){
               max = party.value;
               maxParty = party.key;
            }
         });
         mostVotedByTurn[i].push({state: state.key, party: maxParty, votes: max});
         // console.log(state);
         // console.log(state.key + ": " + maxParty + " - "+ max);
         max = 0;
      })
   });
   // mostVotedByTurn[0].sort(function(x, y){return x.votes < y.votes;});
   // console.log(mostVotedByTurn);
   // console.log(mostVoted);
   // console.log(moreVotedParties[18]);
   // console.log(moreVotedParties);
   // mostVotedByTurn[0].pop();
   // mostVotedByTurn[1].pop();
   // console.log(mostVotedByTurn);

   var maxParty = [];
   // console.log(votes);
   votes.forEach(function(state, i){
      var maxParty;
      // console.log(state.key);
      state.values.forEach(function(party){
         if(party.value > max){
            max = party.value;
            maxParty = party.key;
         }
      });
      mostVoted.push({state: state.key, party: maxParty, votes: max});
      // console.log(state);
      // console.log(state.key + ": " + maxParty + " - "+ max);
      max = 0;
   });
   // console.log(mostVoted);
   // console.log(moreVotedParties[18]);
   // console.log(moreVotedParties);
   mostVoted.pop();
   // console.log(g.selectAll("path").data(states.features));
   // console.log(moreVotedParties);
   // g.select("path").data(states.features, function(d){
   // console.log(svg.select("#g0").selectAll("path").data(states.features).nodes());
   svg.select("#g0").selectAll("path")
   .data(states.features)
   .style("fill", function(d, i){
      // console.log(d);
      // console.log(i);
      return colors.find(c => c.party === mostVotedByTurn[0].find(s => s.state === d.id).party).color;
   })
   .style('fill-opacity', '1')
   .on("mouseover", mouseover)
   .on("mousemove", function(d, i){
      div
         .html(d.properties.nome + '</br>Votos: ' + mostVotedByTurn[0].find(s => s.state === d.id).votes.toLocaleString('pt-br'))
         .style("left", (d3.event.pageX) + "px")
         .style("top", (d3.event.pageY) + "px");
   })
   .on("mouseout", mouseout);

   svg.select("#g1").selectAll("path")
   .data(states.features)
   .style("fill", function(d, i){
      // console.log(d);
      // console.log(i);
      return colors.find(c => c.party === mostVotedByTurn[1].find(s => s.state === d.id).party).color;
   })
   .style('fill-opacity', '1')
   .on("mouseover", mouseover)
   .on("mousemove", function(d, i){
      div
         .html(d.properties.nome + '</br>Votos: ' + mostVotedByTurn[1].find(s => s.state === d.id).votes.toLocaleString('pt-br'))
         .style("left", (d3.event.pageX) + "px")
         .style("top", (d3.event.pageY) + "px");
   })
   .on("mouseout", mouseout);

   // svg.select("#g2").selectAll("path")
   // .data(states.features)
   // .style("fill", function(d, i){
   //    // console.log(d);
   //    // console.log(i);
   //    return colors.find(c => c.party === mostVoted.find(s => s.state === d.id).party).color;
   // })
   // .style('fill-opacity', '1')
   // .on("mouseover", mouseover)
   // .on("mousemove", function(d, i){
   //    div
   //       .html(d.properties.nome + '</br>Votos: ' + mostVoted.find(s => s.state === d.id).votes.toLocaleString('pt-br'))
   //       .style("left", (d3.event.pageX) + "px")
   //       .style("top", (d3.event.pageY) + "px");
   // })
   // .on("mouseout", mouseout);

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
.attr("class", "map-tooltip")
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

var div = d3.select("body").append("div")
.attr("class", "map-tooltip")
.style("display", "none");

function mouseover() {
   div.style("display", "inline");
}

function mouseout() {
   div.style("display", "none");
}

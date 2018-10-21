var format = d3.format(",");

var margin = {top: 50, right: 50, bottom: 50, left: 50},
            width = 1250 - margin.left - margin.right,
            height = 600 - margin.top - margin.bottom;

var path = d3.geoPath();

var svg = d3.select("svg")
   .attr("width", width)
   .attr("height", height)
   .append('g')
   .attr('class', 'map');

// add tooltip
var tooltip = d3.select("body")
   .append("div")
   .attr("class", "map-tooltip")
   .style("display", "none");

var projection = d3.geoEquirectangular()
   .scale(150)
   .translate([width / 2, 250])

var path = d3.geoPath().projection(projection);

// define promise para que a função para gerar o mapa só seja executada após a leitura dos arquivos
var promises = [];
promises.push(d3.json('data/world_countries.json'));
promises.push(d3.csv('data/sumAllEnemies.csv'));
promises.push(d3.csv('data/sumAllAllies.csv'));



Promise.all(promises)
 .then(ready)
 .catch(function(error){
    throw error;
 });

var enemiesCount = {};
var alliesCount = {};

function ready(data) {

   data[1].forEach(function(d) { enemiesCount[d.id] = +d.enemies; });
   data[2].forEach(function(d) { alliesCount[d.id] = +d.allies; });
   // data[0].features.forEach(function(d) { d.population = populationById[d.id] });

   // console.log(enemiesCount);
   // console.log(enemiesCount.find(o => o.id === "BRA").enemies);
   // .features.forEach(function(d) { d.population = populationById[d.id] });

   var color = d3.scaleLinear()
      .domain([0, 1.0])
      .range([d3.interpolateReds(0), "#FF0000"]);

   svg.append("g")
      .attr("class", "countries")
      .selectAll("path")
      .data(data[0].features)
      .enter().append("path")
      .attr("d", path)
      .style("fill", function(d){
         if(enemiesCount[d.id]){
            return d3.interpolateReds(enemiesCount[d.id]/212);
         }
         return "#ffffff";
      })
      .style("opacity",1)
      .style("stroke","black")
      .style("stroke-width", 0.3)
      .on("mouseover", mouseOver)
      .on("mouseout", mouseOut)
      .on("mousemove", function(d, i){
         tooltip
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY) - 15 + "px")
      });

   svg.append("path")
      .datum(topojson.mesh(data.features, function(a, b) { return a.id !== b.id; }))
       // .datum(topojson.mesh(data.features, function(a, b) { return a !== b; }))
      .attr("class", "names")
      .attr("d", path);

}

// shows tooltip
function mouseOver(d) {
   var n = 0;
   var tWidth = Math.max(getTextWidth(d.properties.name, "bold 12pt BlinkMacSystemFont"), 100);
   d3.select(this)
      .style("opacity", 0.5)
      .style("stroke-width",1.5);
   tooltip
      .style("display", "inline")
      .style("width", tWidth + "px");
   if(d3.select(".btn-enemies").classed("active")){
      if(enemiesCount[d.id]){
         n = enemiesCount[d.id];
      }
      tooltip.html(d.properties.name + '</br>Conflicts: ' + n)
   }else{
      if(alliesCount[d.id]){
         n = alliesCount[d.id];
      }
      tooltip.html(d.properties.name + '</br>Alliances: ' + n)
   }


}

// hide tooltip
function mouseOut() {
   tooltip.style("display", "none");

   d3.select(this)
      .style("opacity",1)
      .style("stroke","black")
      .style("stroke-width", 0.3);
}

function getTextWidth(text, font) {
    // re-use canvas object for better performance
    var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    var context = canvas.getContext("2d");
    context.font = font;
    var metrics = context.measureText(text);
    return metrics.width;
}

function toEnemies(){
   d3.selectAll("g.countries path")
      .transition()
      .duration(500)
      .style("fill", function(d){
         if(enemiesCount[d.id]){
            return d3.interpolateReds(enemiesCount[d.id]/212);
         }
         return "#ffffff";
      })

   d3.select(".title h1")
      .html("Number of conflicts faced by each country since 1501")

   d3.select(".btn-enemies").classed("focus", true);
   d3.select(".btn-allies").classed("focus", false);
}

function toAllies(){
   d3.selectAll("g.countries path")
      .transition()
      .duration(500)
      .style("fill", function(d){
         if(alliesCount[d.id]){
            return d3.interpolateGreens(alliesCount[d.id]/327);
         }
         return "#ffffff";
      })

   d3.select(".title h1")
      .html("Number of alliances formed by each country since 1501")

   d3.select(".btn-enemies").classed("focus", false);
   d3.select(".btn-allies").classed("focus", true);
}

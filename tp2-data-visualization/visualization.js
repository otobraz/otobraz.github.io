var margin = {top: 50, right: 50, bottom: 50, left: 50},
            width = 1250 - margin.left - margin.right,
            height = 600 - margin.top - margin.bottom;

var svg = d3.select("svg")
   .attr("width", width)
   .attr("height", height);

var g = svg
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

// 0: inimigos em geral
// 1: alianças em geral
// 2: inimigos de país selecionado
// 3: alianças de país selecionado
var status = 0;

var selectedCountry;

var enemiesCount = {};
var alliesCount = {};
var enemiesByCountry = {};
var alliesByCountry = {};

// define promise para que a função para gerar o mapa só seja executada após a leitura dos arquivos
var promises = [];
promises.push(d3.json('data/world_countries.json'));
promises.push(d3.csv('data/sumAllEnemies.csv'));
promises.push(d3.csv('data/sumAllAllies.csv'));
promises.push(d3.csv('data/NovoEdges.csv'));
promises.push(d3.csv('data/node.csv'));

Promise.all(promises)
 .then(ready)
 .catch(function(error){
    throw error;
 });

function ready(data) {

   data[1].forEach(function(d) { enemiesCount[d.id] = +d.enemies; });
   data[2].forEach(function(d) { alliesCount[d.id] = +d.allies; });

   data[4].forEach(function(d){
      enemiesByCountry[d.id] = {};
      alliesByCountry[d.id] = {};
      data[4].forEach(function(g){
         if(d.id != g.id){
            enemiesByCountry[d.id][g.id] = 0;
            alliesByCountry[d.id][g.id] = 0;
         }
      });
   });

   data[3].forEach(function(d){
      if(d.relation === "-"){
         enemiesByCountry[d.source_id][d.target_id]++;
         enemiesByCountry[d.target_id][d.source_id]++;
      }else{
         alliesByCountry[d.source_id][d.target_id]++;
         alliesByCountry[d.target_id][d.source_id]++;
      }
   });

   // console.log(count);
   // var color = d3.scaleLinear()
   //    .domain([0, 1.0])
   //    .range([d3.interpolateReds(0), "#FF0000"]);

   g = svg.append("g")
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
      .style("opacity", 1)
      .style("stroke","black")
      .style("stroke-width", 0.3)
      .on("mouseover", mouseOver)
      .on("mouseout", mouseOut)
      .on("mousemove", mouseMove)
      .on("click", updateMap);
}

// shows tooltip
function mouseOver(d) {
   var n = 0;
   var tWidth = Math.max(getTextWidth(d.properties.name, "bold 12pt BlinkMacSystemFont"), 100);
   d3.select(this)
      .style("opacity", 0.5)
      .style("stroke-width",1.5)
      .style("stroke", "blue");
   tooltip
      .style("display", "inline")
      .style("width", tWidth + "px");

   switch(status){
      case '0':
         // console.log(status);
         if(enemiesCount[d.id]){
            n = enemiesCount[d.id];
         }
         tooltip.html(d.properties.name + '</br>Conflicts: ' + n);
         break;
      case '1':
         if(alliesCount[d.id]){
            n = alliesCount[d.id];
         }
         tooltip.html(d.properties.name + '</br>Alliances: ' + n);
         break;
      case '2':
         if(selectedCountry == d.id){
            tooltip.html('Selected:</br>' + d.properties.name);
         }else{
            tooltip.html(d.properties.name + '</br>Conflicts: ' + enemiesByCountry[selectedCountry][d.id]);
         }
         break;
      case '3':
         if(selectedCountry == d.id){
            tooltip.html('Selected:</br>' + d.properties.name);
         }else{
            tooltip.html(d.properties.name + '</br>Alliances: ' + alliesByCountry[selectedCountry][d.id]);
         }
         break;
      default:
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

function mouseMove(){
   tooltip
      .style("left", (d3.event.pageX) + "px")
      .style("top", (d3.event.pageY) - 15 + "px");
}

function getTextWidth(text, font) {
    var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    var context = canvas.getContext("2d");
    context.font = font;
    var metrics = context.measureText(text);
    return metrics.width;
}

function toEnemies(){
   d3.selectAll("g.countries path")
      .classed("selected", false)
      .transition()
      .duration(500)
      .style("fill", function(d){
         if(enemiesCount[d.id]){
            return d3.interpolateReds(enemiesCount[d.id]/212);
         }
         return "#ffffff";
      });
   d3.select(".title h1")
      .html("Number of conflicts faced by each country since 1501")
   d3.select(".btn-enemies").classed("focus", true);
   d3.select(".btn-allies").classed("focus", false);
   status = 0;
}

function toAllies(){
   d3.selectAll("g.countries path")
      .classed("selected", false)
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
   status = 1;
}

function updateMap(d){
   selected = d3.select(this);
   if(status == 0 || status == 2){
      if(selected.classed("selected")){
         selected.classed("selected", false);
         toEnemies();
      }else{
         max = myMax(enemiesByCountry[d.id]);
         d3.selectAll("g.countries path")
            .classed("selected", false)
            .transition()
            .duration(500)
            .style("fill", function(g){
               if((d.id in enemiesByCountry) && (g.id in enemiesByCountry[d.id])){
                  if(enemiesByCountry[d.id][g.id] == 0) return "#ffffff";
                  return d3.interpolateReds(enemiesByCountry[d.id][g.id]/max);
               }else if(d.id == g.id){
                  return "#2166ac";
               }
               return "#ffffff";
         });
         selected.attr("class", "selected");
         status = 2;
         selectedCountry = d.id;
      }
   }else{
      if(selected.classed("selected")){
         selected.classed("selected", false);
         toAllies();
      }else{
         max = myMax(alliesByCountry[d.id]);
         d3.selectAll("g.countries path")
            .classed("selected", false)
            .transition()
            .duration(500)
            .style("fill", function(g){
               if((d.id in alliesByCountry) && (g.id in alliesByCountry[d.id])){
                  if(alliesByCountry[d.id][g.id] == 0) return "#ffffff";
                  return d3.interpolateGreens(alliesByCountry[d.id][g.id]/max);
               }else if(d.id == g.id){
                  return "#2166ac";
               }
               return "#ffffff";
         });
         selected.attr("class", "selected");
         status = 3;
         selectedCountry = d.id;
      }
   }
}

var zoom = d3.zoom()
   .scaleExtent([1,5])
   .wheelDelta(wheelDelta)
   .on("zoom", function() {
      g.attr("transform", d3.event.transform)
});

svg.call(zoom);

function wheelDelta() {
  return -d3.event.deltaY * (d3.event.deltaMode ? 120 : 1) / 2000;
}

function myMax(array){
   var max = 0;
   for(var key in array){
      if(array[key] > max){
         max = array[key];
      }
   };
   return max;
}

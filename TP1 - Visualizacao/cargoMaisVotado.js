var margin = {top: 30, right: 100, bottom: 50, left: 100},
width = window.innerWidth - margin.left - margin.right,
height = 600 - margin.top - margin.bottom;

var x = d3.scaleBand()
    .rangeRound([0, width])
    .padding(0.5);

var y = d3.scaleLinear()
    .range([height, 0]);
//

var chart = d3.select(".chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// chart.margin().left = 120;

var f = d3.format(".2f");
var layers;

d3.csv("files/eleicoes_2014.csv").then(function(data){

   var votes = d3.nest()
   .key(function(d) { return d.cat_political_office;})
   .key(function(d) { return d.num_turn;})
   .rollup(function(d) {
      return d3.sum(d, function(g) {return g.num_votes; })
   }).entries(data.filter(function(d) { return d.cat_political_office != "";}));

   var xData = ["1", "2"];
   // console.log(dataIntermediate);

   // votes.sort(function(x, y){ return x.value < y.value;});
   // console.log(votes);
   votes.forEach(function(cargo){
      if(cargo.values[1] == null){
         cargo.values.push({"key": "2","value":0});
      }
   });

   layers = votes.map(function(d){
         return {x:d.key, "1":d.values[0].value, "2":d.values[1].value}
   });

   layers.sort(function(d,g){return (d[1]+d[2]) < (g[1] + g[2]);});

   var dataStackLayout = d3.stack().keys(xData)
      .offset(d3.stackOffsetDiverging)
      (layers);

   x.domain(layers.map(function(d) { return d.x; }));

   y.domain([d3.min(dataStackLayout, stackMin), d3.max(dataStackLayout, stackMax)]);

   var xAxis = d3.axisBottom()
     .scale(x);

   var yAxis = d3.axisLeft()
     .scale(y);

   // x.domain(votes.map(function(d) { return d.key; }));
   // y.domain([d3.min(dataStackLayout, stackMin), d3.max(dataStackLayout, stackMax)])
   //    .rangeRound([height - margin.bottom, margin.top]);

   // add the Y gridlines
   chart.append("g")
      .attr("class", "grid")
      .call(make_y_gridlines()
          .tickSize(-width)
          .tickFormat("")
      )

   chart.append("g")
       .attr("transform", "translate(0," + (height+0.5) + ")")
       .attr("class", "xAxis")
       .call(d3.axisBottom(x));

   chart.append("g")
      .call(d3.axisLeft(y)
         .tickFormat(d3.format("~s"))
   );

   chart.append("g")
      .selectAll("g")
      .data(dataStackLayout)
      .enter().append("g")
         .attr("fill", function(d) { return d.key == 1 ? "#1b9e77" : "#d95f02"; })
      .selectAll(".stack-bar")
      .data(function(d){ return d;})
      .enter().append("rect")
      .attr("class", "stack-bar")
      .attr("x", function(d) { return x(d.data.x);})
      .attr("y", function(d) { return y(d[1]);})
      .attr("height", function(d) { return (y(d[0]) - y(d[1]));})
      .attr("width", x.bandwidth())
      .on("mouseover", mouseoverBar)
      .on("mouseout", mouseoutBar);

      // chart.selectAll(".bar")
      //    .data(layers)
      //    .enter().append("rect")
      //    .attr("class", "bar")
      //    .attr("x", function(d) { return x(d.x)})
      //    .attr("y", function(d) { return y(d[2]); })
      //    .attr("height", function(d) { return (y(d[1]) - y(d[2])); })
      //    .attr("width", x.bandwidth());
         // .on("mouseover", mouseover)
         // .on("mouseout", mouseout);

   // gridlines in y axis function
   function make_y_gridlines() {
       return d3.axisLeft(y)
           .ticks(10)
   }

   chart.selectAll(".labelTotal")
      .data(layers)
      .enter().append("text")
      .attr("class", "labelTotal label")
      .attr('x', function(d) {return x(d.x) + x.bandwidth()/2;})
      .attr('y', function(d) {return y(d[1]+d[2]) - 5;})
      .text(function(d) {return f((d[1]+d[2])/1000000) + "M";})

   chart.selectAll(".label1st")
      .data(layers.filter(function(d){ return d[2] != 0;}))
      .enter().append("text")
      .attr("class", "label label1st")
      .attr("transform", function(d){
         return "rotate(90," + (x(d.x) + x.bandwidth() + 5) + "," + y(d[1]/2) + ")";
      })
      .style("text-anchor", "middle")
      .attr('x', function(d) {return x(d.x) + x.bandwidth();})
      .attr('y', function(d) {return y(d[1]/2);})
      .text(function(d) {return f(d[1]/1000000) + "M";})

   chart.selectAll(".label2nd")
      .data(layers.filter(function(d){ return d[2] != 0;}))
      .enter().append("text")
      .attr("class", "label label2nd")
      .attr("transform", function(d){
         return "rotate(90," + (x(d.x) + x.bandwidth() + 5) + "," + y(d[2]/2 + d[1]) + ")";
      })
      .style("text-anchor", "middle")
      .attr('x', function(d) {return x(d.x) + x.bandwidth();})
      .attr('y', function(d) {return y(d[2]/2 + d[1]);})
      .text(function(d) {return f(d[2]/1000000) + "M";})

   chart.selectAll("g .xAxis").selectAll(".tick")
      .on("mouseover", mouseoverXAxis)
      .on("mouseout", mouseoutXAxis);

   chart.append("text")
      .attr("transform", "translate(" + (width/2) + " ," + (height + margin.top + 20) + ")")
      .attr("class", "axis-label")
      .style("text-anchor", "middle")
      .text("Date");

   chart.append("text")
      .attr("transform", "rotate(-90)")
      .attr("class", "axis-label")
      .attr("y", 0 - margin.left)
      .attr("x",0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Value");

   // chart.select("body").select(".chart-tooltip")
   //    .append("div")
   //    .attr("class", "chart-tooltip")
   //    .style("display", "none");
   //    .attr('x', function(d) {return x(d.key) + x.bandwidth()/2;})
   //    .attr('y', function(d) {return y(d.value) - 5;})
   //    .text(function(d) {return f(d.value/1000000) + "M";});

   // console.log(g.select("path"));

   // g.selectAll("path")
   // .data(states.features)
   // .style("fill", function(d, i){
   //    return colors.find(x => x.party === mostVoted[i].party).color;
   // })
   // .style('fill-opacity', '0.7')
   // .on("mouseover", mouseover)
   // .on("mousemove", function(d, i){
   //    div
   //    .html(d.properties.nome + '</br>Votos: ' + mostVoted[i].votes)
   //    .style("left", (d3.event.pageX) + "px")
   //    .style("top", (d3.event.pageY) + "px");
   // })
   // .on("mouseout", mouseout);
});

var div = d3.select("#chart-col").append("div")
.attr("class", "chart-tooltip")
.style("display", "none");

function stackMin(serie) {
  return d3.min(serie, function(d) { return d[0]; });
}

function stackMax(serie) {
  return d3.max(serie, function(d) { return d[1]; });
}

function mouseoverBar(d,i) {

   // d3.select(this)
   //    .style("fill", '#d95f02');
   d3.selectAll(".labelTotal").filter(function(g, j){ return i === j;})
      .text((layers[i][1]+layers[i][2]).toLocaleString('pt-br'));

   d3.selectAll(".label1st").filter(function(g, j){ return i === j;})
      .text(layers[i][1].toLocaleString('pt-br'));

   d3.selectAll(".label2nd").filter(function(g, j){ return i === j;})
      .text(layers[i][1].toLocaleString('pt-br'));

   // d3.select(".chart-tooltip")
   //    .style("display", "inline")
   //    .html(d.key + '</br>Votos: ' + d.value.toLocaleString('pt-br'))
   //    .style("left", x(d.key) + "px")
   //    .style("top", y(d.value) + "px");
}

function mouseoutBar(d, i) {
   // d3.select(this)
   //    .style("fill", '#1b9e77');

   // d3.select(".chart-tooltip")
   //    .style("display", "none");

   d3.selectAll(".labelTotal").filter(function(g, j){ return i === j;})
      .text(f((layers[i][1]+layers[i][2])/1000000) + "M");

   d3.selectAll(".label1st").filter(function(g, j){ return i === j;})
      .text(f(layers[i][1]/1000000) + "M");
}

function mouseoverXAxis(d,i) {

   var bar = d3.selectAll(".stack-bar");

   d3.selectAll(".labelTotal").filter(function(d, j){ return i === j;})
      .text((layers[i][1]+layers[i][2]).toLocaleString('pt-br'));

   d3.selectAll(".label1st").filter(function(d, j){ return i === j;})
      .text(layers[i][1].toLocaleString('pt-br'));
}

function mouseoutXAxis(d,i) {

   d3.selectAll(".labelTotal").filter(function(g, j){ return i === j;})
      .text(f((layers[i][1]+layers[i][2])/1000000) + "M");

   d3.selectAll(".label1st").filter(function(g, j){ return i === j;})
      .text(f(layers[i][1]/1000000) + "M");

   d3.select(".chart-tooltip")
      .transition().duration(200)
      .style("opacity", 0);
}

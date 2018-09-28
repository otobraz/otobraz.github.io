var margin = {top: 20, right: 200, bottom: 100, left: 200},
width = 1400 - margin.left - margin.right,
height = 650 - 78 - margin.top - margin.bottom;

var f = d3.format(",.2f");

var tickValues = [
   5000000, 10000000, 15000000, 20000000, 25000000,
   30000000, 35000000, 40000000, 45000000
];

var tickValues1 = [
   300000, 600000, 900000, 1200000, 1500000
];

var candidateNames = {
   "13": "Dilma ", "45": "Aécio Neves", "40": "Marina Silva",
   "50": "Luciana Genro", "20": "Pastor Everaldo",
   "43": "Eduardo Jorge", "28": "Levy Fidelix",
   "16": "Zé Maria", "27": "Eymael",
   "21": "Mauro Iasi", "29": "Rui Costa Pimenta",
};

var x = d3.scaleBand()
    .rangeRound([0, width])
    .padding(0.5);

// console.log(x);
// console.log(x.bandwidth());
var y = d3.scaleLinear()
    .range([height, 0]);

var xAxis = d3.axisBottom()
    .scale(x);

var yAxis = d3.axisLeft()
    .scale(y)
    .tickFormat(d3.format("~s"))
    .ticks(5);

var x1 = d3.scaleBand()
  .rangeRound([0, width*.55])
  .padding(0.5);

// console.log(x);
// console.log(x.bandwidth());
var y1 = d3.scaleLinear()
  .range([height*.65, 0]);

var xAxis1 = d3.axisBottom()
  .scale(x1);

var yAxis1 = d3.axisLeft()
  .scale(y1)
  .tickFormat(d3.format("~s"));

// gridlines in y axis function
function make_y_gridlines() {
  return d3.axisLeft(y).tickValues(tickValues)
}

// gridlines in y axis function
function make_y_gridlines1() {
  return d3.axisLeft(y1).tickValues(tickValues1)
}

var chart = d3.select(".chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.csv("data/presidente.csv").then(function(data){

   var votes = d3.nest()
   .key(function(d) { return d.id_candidate_num;})
   .rollup(function(d) {
      return d3.sum(d, function(g) {return g.num_votes; })
   }).entries(data.filter(function(d){ return d.num_turn == 1;}));

   votes.sort(function(x, y){ return x.value < y.value;});

   var votes1 = votes.slice(0);

   votes1.shift(); votes1.shift(); votes1.shift();

   // console.log(votes);
   // votes.shift(); votes.shift(); votes.shift();
   x.domain(votes.map(function(d) { return candidateNames[d.key]; }));
   y.domain([0, 50000000]);

   x1.domain(votes1.map(function(d) { return candidateNames[d.key]; }));
   y1.domain([0, 1800000]);

   // add the Y gridlines
   chart.append("g")
      .attr("class", "grid")
      .call(make_y_gridlines()
          .tickSize(-width)
          .tickFormat("")
      );

   chart.append("g")
       .attr("transform", "translate(0," + (height+0.5) + ")")
       .attr("class", "xAxis")
       .call(xAxis)
       .selectAll(".tick text")
         .call(wrap, x.bandwidth()/x.padding());

   chart.append("g").call(yAxis);

   chart.selectAll(".bar")
      .data(votes)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(candidateNames[d.key])})
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); })
      .attr("width", x.bandwidth())
      .on("mouseover", mouseoverBar)
      .on("mouseout", mouseoutBar);

   // chart.selectAll(".chart1-bg")
   //    .append("rect")
   //    .attr("class", "chart1-bg")
   //    .attr("x", widht/2)
   //    .attr("y", height*.7)
   //    .attr("height", height)
   //    .attr("width", width);

   chart.selectAll(".label")
      .data(votes)
      .enter().append("text")
      .attr("class", "label")
      .attr('x', function(d) {return x(candidateNames[d.key]) + x.bandwidth()/2;})
      .attr('y', function(d) {return y(d.value) - 5;})
      .text(function(d) {return f(d.value/1000000).toLocaleString('pt-br') + "M";});

   d3.select(".chart")
      .append("svg")
      .attr("class", "chart1");

   var chart1 = d3.select(".chart1")
     .attr("width", width + margin.left + margin.right)
     .attr("height", height + margin.top + margin.bottom)
     .append("g")
     .attr("transform", "translate(" + (width/2 + 130) + "," + (margin.top + 20) + ")");

   chart1.append("rect")
      .attr("width", width/2 + 120)
      .attr("height", height*.82)
      .attr("transform", "translate(" + -50 + "," + -10 + ")")
      .style("fill", "white")
      .style("stroke", "black");

   chart1.append("g")
      .attr("class", "grid")
      .call(make_y_gridlines1()
          .tickSize(-width/2)
          .tickFormat("")
      );

   chart1.append("g")
       .attr("transform", "translate(0," + (height*.65+0.5) + ")")
       .attr("class", "xAxis")
       .call(d3.axisBottom(x1))
       .selectAll(".tick text")
         .call(wrap, x1.bandwidth()/x1.padding());

   chart1.append("g").call(yAxis1
         .tickValues(tickValues1)
      );

   chart1.selectAll(".bar")
      .data(votes1)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x1(candidateNames[d.key])})
      .attr("y", function(d) { return y1(d.value); })
      .attr("height", function(d) { return height*.65 - y1(d.value); })
      .attr("width", x1.bandwidth())
      .on("mouseover", mouseoverBar)
      .on("mouseout", mouseoutBar);

   // chart1.selectAll("g .xAxis1").selectAll(".tick")
   //    .on("mouseover", mouseoverXAxis)
   //    .on("mouseout", mouseoutXAxis);

   chart1.selectAll(".label")
      .data(votes1)
      .enter().append("text")
      .attr("class", "label")
      .attr('x', function(d) {return x1(candidateNames[d.key]) + x1.bandwidth()/2;})
      .attr('y', function(d) {return y1(d.value) - 5;})
      .text(function(d) {return f(d.value/1000000).toLocaleString('pt-br') + "M";});

   d3.selectAll("g .xAxis").selectAll(".tick")
      .on("mouseover", mouseoverXAxis)
      .on("mouseout", mouseoutXAxis);

   chart.append("text")
      .attr("transform", "translate(" + (width/2) + " ," + (height + 65) + ")")
      .attr("class", "axis-label")
      .style("text-anchor", "middle")
      .text("Candidatos");

   chart.append("text")
      .attr("transform", "rotate(-90)")
      .attr("class", "axis-label")
      .attr("y", - 100)
      .attr("x", - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Votos");

   // chart.select("body").select(".chart-tooltip")
   //    .append("div")
   //    .attr("class", "chart-tooltip")
   //    .style("display", "none");
      // .attr('x', function(d) {return x(d.key) + x.bandwidth()/2;})
      // .attr('y', function(d) {return y(d.value) - 5;})
      // .text(function(d) {return f(d.value/1000000) + "M";});

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
.style("opacity", 0);

function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}

function mouseoverBar(d, i) {

   d3.select(this).style("fill", '#d95f02');

   var parentNode = d3.select(this.parentNode);

   var labels = parentNode.selectAll(".label");

   labels.filter(function(g, j){ return i === j;})
      .text(d.value.toLocaleString('pt-br'));

   // var toolTip = d3.select(".chart-tooltip");
   //
   // toolTip
   //    .transition().duration(200)
   //    .style("opacity", .9)
   //
   // toolTip
   //    .html(d.key + '</br>Votos: ' + d.value.toLocaleString('pt-br'))
   //    .style("left", x(candidateNames[d.key]) + x.bandwidth() + "px")
   //    .style("top", y(d.value) - 10 + "px");
}

function mouseoutBar(d, i) {
   d3.select(this).style("fill", '#1b9e77');
   var parentNode = d3.select(this.parentNode);
   var labels = parentNode.selectAll(".label");
   labels.filter(function(g, j){ return i === j;})
      .text(f(d.value/1000000) + "M");
}

function mouseoverXAxis(d,i) {

   var parentNode = d3.select(this.parentNode.parentNode);
   // console.log(parentNode);
   var labels = parentNode.selectAll(".label");
   var bar = parentNode.selectAll(".bar");

   bar
      .filter(function(g, j) {
         if(i === j){
            labels.filter(function(d, i){ return i === j;})
               .text(g.value.toLocaleString('pt-br'));
            return true;
         }
         return false;
      })
      .style("fill", '#d95f02');
}

function mouseoutXAxis(d,i) {
   var parentNode = d3.select(this.parentNode.parentNode);
   // console.log(parentNode);
   var labels = parentNode.selectAll(".label");
   var bar = parentNode.selectAll(".bar");

   bar
      .filter(function(d, j) {
         if(i === j){
            labels.filter(function(d, i){ return i === j;})
               .text(f(d.value/1000000) + "M");
            return true;
         }
         return false;
      })
      .style("fill", '#1b9e77');

   d3.select(".chart-tooltip")
      .transition().duration(200)
      .style("opacity", 0);
}

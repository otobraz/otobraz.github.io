var margin = {top: 30, right: 100, bottom: 80, left: 100},
width = window.innerWidth - margin.left - margin.right,
height = 600 - margin.top - margin.bottom;

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
    .scale(y);

var x1 = d3.scaleBand()
  .rangeRound([0, width])
  .padding(0.5);

// console.log(x);
// console.log(x.bandwidth());
var y1 = d3.scaleLinear()
  .range([height, 0]);

var xAxis1 = d3.axisBottom()
  .scale(x1);

var yAxis1 = d3.axisLeft()
  .scale(y1);

// gridlines in y axis function
function make_y_gridlines() {
  return d3.axisLeft(y)
      .ticks(10)
}

var chart = d3.select(".chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var chart1 = d3.select(".chart1")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// chart.margin().left = 120;
var f = d3.format(",.2f");

var candidateNames = {
   "13": "Dilma ", "45": "Aécio Neves", "40": "Marina Silva",
   "50": "Luciana Genro", "20": "Pastor Everaldo",
   "43": "Eduardo Jorge", "28": "Levy Fidelix",
   "16": "Zé Maria", "27": "Eymael",
   "21": "Mauro Iasi", "29": "Rui Costa Pimenta",
};

d3.csv("files/presidente.csv").then(function(data){

   var votes = d3.nest()
   .key(function(d) { return d.id_candidate_num;})
   .rollup(function(d) {
      return d3.sum(d, function(g) {return g.num_votes; })
   }).entries(data.filter(function(d){ return d.num_turn == 1;}));

   votes.sort(function(x, y){ return x.value < y.value;});

   var votes1 = votes.slice(0);

   votes1.shift(); votes1.shift(); votes1.shift();

   console.log(votes);
   // votes.shift(); votes.shift(); votes.shift();
   x.domain(votes.map(function(d) { return candidateNames[d.key]; }));
   y.domain([0, d3.max(votes, function(d) { return d.value; })]);

   x1.domain(votes1.map(function(d) { return candidateNames[d.key]; }));
   y1.domain([0, d3.max(votes1, function(d) { return d.value; })]);

   // add the Y gridlines
   chart.append("g")
      .attr("class", "grid")
      .call(make_y_gridlines()
          .tickSize(-width)
          .tickFormat("")
      );

   chart1.append("g")
      .attr("class", "grid")
      .call(make_y_gridlines()
          .tickSize(-width)
          .tickFormat("")
      );

   chart.append("g")
       .attr("transform", "translate(0," + (height+0.5) + ")")
       .attr("class", "xAxis")
       .call(d3.axisBottom(x))
       .selectAll(".tick text")
         .call(wrap, x.bandwidth()/x.padding());

      chart.append("g")
         .call(d3.axisLeft(y)
            .tickFormat(d3.format("~s"))
      );

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

   chart.selectAll(".label")
      .data(votes)
      .enter().append("text")
      .attr("class", "label")
      .attr('x', function(d) {return x(candidateNames[d.key]) + x.bandwidth()/2;})
      .attr('y', function(d) {return y(d.value) - 5;})
      .text(function(d) {return f(d.value/1000000).toLocaleString('pt-br') + "M";});

   chart1.append("g")
       .attr("transform", "translate(0," + (height+0.5) + ")")
       .attr("class", "xAxis")
       .call(d3.axisBottom(x1))
       .selectAll(".tick text")
         .call(wrap, x1.bandwidth()/x1.padding());

      chart1.append("g")
         .call(d3.axisLeft(y1)
            .tickFormat(d3.format("~s"))
      );

   chart1.selectAll(".bar")
      .data(votes1)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x1(candidateNames[d.key])})
      .attr("y", function(d) { return y1(d.value); })
      .attr("height", function(d) { return height - y1(d.value); })
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

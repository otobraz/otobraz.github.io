var margin = {top: 30, right: 50, bottom: 50, left: 100},
width = window.innerWidth - margin.left - margin.right,
height = 600 - margin.top - margin.bottom;

var x = d3.scaleBand()
    .rangeRound([0, width])
    .padding(0.5);

var y = d3.scaleLinear()
    .range([height, 0]);

var xAxis = d3.axisBottom()
    .scale(x);

var yAxis = d3.axisLeft()
    .scale(y);

var chart = d3.select(".chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// chart.margin().left = 120;

// gridlines in y axis function
function make_y_gridlines() {
    return d3.axisLeft(y)
        .ticks(10)
}

var f = d3.format(".2f");

d3.csv("files/eleicoes_2014.csv").then(function(data){

   var votes = d3.nest()
   .key(function(d) { return d.cat_political_office;})
   // .key(function(d) { return d.num_turn;})
   .rollup(function(d) {
      return d3.sum(d, function(g) {return g.num_votes; })
   }).entries(data.filter(function(d) { return d.cat_political_office != "";}));

   votes.sort(function(x, y){ return x.value < y.value;});
   // console.log(votes);

   x.domain(votes.map(function(d) { return d.key; }));
   y.domain([0, d3.max(votes, function(d) { return d.value; })]);

   // add the Y gridlines
   chart.append("g")
      .attr("class", "grid")
      .call(make_y_gridlines()
          .tickSize(-width)
          .tickFormat("")
      )

   chart.append("g")
       .attr("transform", "translate(0," + (height+0.5) + ")")
       .call(d3.axisBottom(x));

      chart.append("g")
         .call(d3.axisLeft(y)
            .tickFormat(d3.format("~s"))
      );

   chart.selectAll(".bar")
      .data(votes)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d.key)})
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); })
      .attr("width", x.bandwidth())
      .on("mouseover", mouseover)
      .on("mouseout", mouseout);

   chart.selectAll(".label")
      .data(votes)
      .enter().append("text")
      .attr("class", "label")
      .attr('x', function(d) {return x(d.key) + x.bandwidth()/2;})
      .attr('y', function(d) {return y(d.value) - 5;})
      .text(function(d) {return f(d.value/1000000) + "M";});

   // chart.select("body").select(".chartTooltip")
   //    .append("div")
   //    .attr("class", "chartTooltip")
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
.attr("class", "chartTooltip")
.style("display", "none");


function mouseover(d,i) {
   d3.select(this)
      .style("fill", '#d95f02');

   d3.select(".chartTooltip")
      .style("display", "inline")
      .html(d.key + '</br>Votos: ' + d.value.toLocaleString('pt-br'))
      .style("left", x(d.key) + "px")
      .style("top", y(d.value) + "px");
}

function mouseout() {
   d3.select(this)
      .style("fill", '#1b9e77');

   d3.select(".chartTooltip")
      .style("display", "none");
}

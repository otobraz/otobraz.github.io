/* ------- MAPA ------- */

// define margens e tamanho da tela
var margin = {top: 25, right: 50, bottom: 25, left: 50},
            width = d3.select(".map-div").node().getBoundingClientRect().width,
            height = d3.select(".map-div").node().getBoundingClientRect().height + 100;

// seleciona o SVG e define sua dimensão
var svg = d3.select(".map")
   .attr("width", width)
   .attr("height", height)
   .attr("transform", "translate(" + 0 + "," + 5 + ")");

svg.append("rect")
   .attr("width", width)
   .attr("height", height)
   .style("fill-opacity", 0)
   .style("stroke", "black")
   .style("stroke-width", 2);

// define e cria o elemento "g" para o mapa
var g = svg
   .append('g')
   .attr('class', 'map')

// adiciona tooltip
var tooltip = d3.select("body")
   .append("div")
   .attr("class", "map-tooltip")
   .style("display", "none");

// define a projeção do mapa
var projection = d3.geoEquirectangular()
   .scale(width*.158)
   .translate([width / 2, 240])

// define path para desenhar o mapa
var path = d3.geoPath().projection(projection);

// define o zoom behavior
var zoom = d3.zoom()
   .scaleExtent([1,5])        // define zoom máximo e mínimo
   .wheelDelta(wheelDelta)    // define a quantidade de "zoom in" e "zoom out" a ser dada por vez
   .on("zoom", function() {   // dá "zoom in" ou "zoom out"
      g.attr("transform", d3.event.transform)
});
svg.call(zoom);

// define valores dos ticks das legendas pros estados 0 e 1 da visualização
var enemiesTickValues = [0,20,40,60,80,100,120,140,160,180,200,212];
var alliesTickValues = [0,30,60,90,120,150,180,210,240,270,300,327];

var maxAllies = 327;
var maxEnemies = 212;
var max;
/* ------- MAPA ------- */


/* ------- GRÁFICO DE BARRAS  ------- */

var chartWidth = d3.select(".chart-div").node().getBoundingClientRect().width - margin.left/2;
var chartHeight = height;
var innerWidth  = chartWidth - margin.left*1.5;
var innerHeight = chartHeight - margin.top - margin.bottom;

var chartSVG = d3.select(".chart")
   .attr("width",  chartWidth)
   .attr("height", chartHeight);

var chartTooltip = d3.select("body")
   .append("div")
   .attr("class", "chart-tooltip")
   .style("display", "none");

var chartG = chartSVG.append("g")
   .attr("transform", "translate(" + (margin.left+10) + "," + 15 + ")")
   .attr('class', "chart");

var xAxisG = chartG.append("g")
   .attr("class", "x axis")
   .attr("transform", "translate(0," + innerHeight + ")");

var yAxisG = chartG.append("g")
   .attr("class", "y axis");

var xScale = d3.scaleLinear().range([0, innerWidth]);
var yScale = d3.scaleBand().rangeRound([0, innerHeight]).padding(0.3);

var xAxis = d3.axisBottom().scale(xScale)
   .ticks(5)
   .tickFormat(d3.format("~s"));

var yAxis;

/* ------- GRÁFICO DE BARRAS  ------- */


/* ------- SÉRIE TEMPORAL  ------- */

var lineChartWidth = d3.select(".line-chart-div").node().getBoundingClientRect().width - margin.left;
var lineChartHeight = 210;

var lineChartInnerWidth  = lineChartWidth - margin.left - margin.right;
var lineChartInnerHeight = lineChartHeight - margin.top - margin.bottom;

// Escala X e Y do grafico da serie temporal
var lineChartXScale = d3.scaleLinear()
    .range([0, lineChartInnerWidth]);

var lineChartYScale = d3.scaleLinear()
    .range([lineChartInnerHeight, 0]);

var countryXScale = d3.scaleLinear()
  .range([0, lineChartInnerWidth]);

var countryYScale = d3.scaleLinear()
  .range([lineChartInnerHeight, 0]); // output

// Adiciona o SVG
var lineChartSVG = d3.select(".line-chart")
  .attr("width", lineChartWidth)
  .attr("height", lineChartHeight)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + 5 + ")");

var lineChartTooltip = d3.select("body")
  .append("div")
  .attr("class", "linechart-tooltip")
  .style("display", "none");

var lineChartXAxis, lineChartYAxis;
var circleRadius = 2;
var edges, conflicts = [], conflictsByYear = [], countriesConflicts = {};
var line, countryLine, from, to;
var filteredConflicts;
var filteredCountryConflicts;
var startYear = 1500;
var currentYear = 2018;
var duration = [];

/* ------- SÉRIE TEMPORAL  ------- */


/* mantém controle do estado atual da visualização {
   0: inimigos em geral
   1: alianças em geral
   2: inimigos de país selecionado
   3: alianças de país selecionado
}*/
var status = 0;

var selectedCountry = {};                // mantem controle do país selecionado pelo usuário

var enemiesCount = {};              // número de inimizades de cada país
var alliesCount = {};               // número de alianças de cada país
var enemiesByCountry = {};          // número de inimizades que cada país teve com os demais
var alliesByCountry = {};           // número de alianças que cada país formou com os demais
var countries = {};

var chartData = {};

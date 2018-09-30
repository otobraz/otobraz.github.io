// define margens e tamanho da tela
var margin = {top: 20, right: 200, bottom: 100, left: 200},
width = 1400 - margin.left - margin.right,
height = 650 - 78 - margin.top - margin.bottom;

var f = d3.format(".2f");  // formatador dos números
var layers;                // camadas do gráfico empilhado

// cores para cada turno
var colors = [
   {turn: "1", color:"#377eb8"},
   {turn: "2", color:"#e41a1c"}
];

// valores a serem exibidos no eixo Y
var tickValues = [ 40000000, 80000000, 120000000, 160000000, 200000000];

// valores para as grids
var gridTickValues = [
   20000000, 40000000, 60000000, 80000000,
   100000000, 120000000, 140000000, 160000000,
   180000000, 200000000
];

// definição das escalas

var x = d3.scaleBand()
    .rangeRound([0, width])
    .padding(0.5);            // definição da distância entre as barras

var y = d3.scaleLinear()
    .range([height, 0]);

// define e cria container para a visualização
var chart = d3.select(".chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// lê os dados e gera o gráfico de barra
d3.csv("data/eleicoes_2014.csv").then(function(data){

   // leitura e processamento dos dados usando a função nest
   var votes = d3.nest()
   .key(function(d) { return d.cat_political_office;})   // define cargo como 1ª chave
   .key(function(d) { return d.num_turn;})               // define turno como 2ª chava
   .rollup(function(d) {                                 // faz soma do número de votos
      return d3.sum(d, function(g) {return g.num_votes; })
   }).entries(data.filter(function(d) { return d.cat_political_office != "";}));    // desconsidera candidatos sem cargo definido

   // cria uma chave com valor 0 para cargos que não tiveram segundo turno
   votes.forEach(function(cargo){
      if(cargo.values[1] == null){
         cargo.values.push({"key": "2","value":0});
      }
   });

   // formata os dados para facilitar a geração das barras empilhadas
   layers = votes.map(function(d){
         return {cargo:d.key, "1":d.values[0].value, "2":d.values[1].value}
   });

   // ordena de forma decrescente os items
   layers.sort(function(d,g){return (d[1]+d[2]) < (g[1] + g[2])? 1 : -1;});

   // gera o layout das barras empilhadas
   var dataStackLayout = d3.stack().keys([colors[0].turn, colors[1].turn])
      .offset(d3.stackOffsetDiverging)
      (layers);

   // definição dos eixos X e Y

   x.domain(layers.map(function(d) { return d.cargo; }));
   y.domain([0, 220000000]);

   var xAxis = d3.axisBottom()
     .scale(x);

   var yAxis = d3.axisLeft()
      .scale(y)
      .tickValues(tickValues)
      .tickFormat(d3.format("~s"));

   // adiciona os grids ao gráfico
   chart.append("g")
      .attr("class", "grid")
      .call(makeGrid()
          .tickSize(-width)
          .tickFormat("")
      );

   // adiciona os eixos X e Y ao gráfico

   chart.append("g")
       .attr("transform", "translate(0," + (height+0.5) + ")")
       .attr("class", "xAxis")
       .call(xAxis)
         .selectAll(".tick text")
         .call(wrap, x.bandwidth()/x.padding());

   chart.append("g").call(yAxis);

   // adiciona as barras empilhadas ao gráfico
   chart.append("g")
      .selectAll("g")
      .data(dataStackLayout)
      .enter().append("g")
         .attr("fill", function(d) { return colors[d.key-1].color;})
      .selectAll(".stack-bar")
      .data(function(d){ return d;})
      .enter().append("rect")
      .attr("class", "stack-bar")
      .attr("x", function(d) { return x(d.data.cargo);})
      .attr("y", function(d) { return y(d[1]);})
      .attr("height", function(d) { return (y(d[0]) - y(d[1]));})
      .attr("width", x.bandwidth())
      .on("mouseover", mouseover)
      .on("mouseout", mouseout);

   // adiciona a label com valor total no topo das barras
   chart.selectAll(".labelTotal")
      .data(layers)
      .enter().append("text")
      .attr("class", "labelTotal label")
      .attr('x', function(d) {return x(d.cargo) + x.bandwidth()/2;})
      .attr('y', function(d) {return y(d[1]+d[2]) - 5;})
      .text(function(d) {return f((d[1]+d[2])/1000000) + "M";})

   // adiciona as labels laterais com valores das barras do primeiro turno
   chart.selectAll(".label1st")
      .data(layers.filter(function(d){ return d[2] != 0;}))
      .enter().append("text")
      .attr("class", "label label1st")
      .attr("transform", function(d){
         return "rotate(90," + (x(d.cargo) + x.bandwidth() + 5) + "," + y(d[1]/2) + ")";
      })
      .style("text-anchor", "middle")
      .attr('x', function(d) {return x(d.cargo) + x.bandwidth();})
      .attr('y', function(d) {return y(d[1]/2);})
      .text(function(d) {return f(d[1]/1000000) + "M";})

   // adiciona as labels laterais com valores das barras do segundo turno
   chart.selectAll(".label2nd")
      .data(layers.filter(function(d){ return d[2] != 0;}))
      .enter().append("text")
      .attr("class", "label label2nd")
      .attr("transform", function(d){
         return "rotate(90," + (x(d.cargo) + x.bandwidth() + 5) + "," + y(d[2]/2 + d[1]) + ")";
      })
      .style("text-anchor", "middle")
      .attr('x', function(d) {return x(d.cargo) + x.bandwidth();})
      .attr('y', function(d) {return y(d[2]/2 + d[1]);})
      .text(function(d) {return f(d[2]/1000000) + "M";})

   // adiciona os comportamentos "mouseover" e "mouseout" para os ticks do eixo X
   chart.selectAll("g .xAxis").selectAll(".tick")
      .on("mouseover", mouseover)
      .on("mouseout", mouseout);

   // adiciona label para explicar o eixo X
   chart.append("text")
      .attr("transform", "translate(" + (width/2) + " ," + (height + 65) + ")")
      .attr("class", "axis-label")
      .style("text-anchor", "middle")
      .text("Cargo");

   // adiciona label para explicar o eixo Y
   chart.append("text")
      .attr("transform", "rotate(-90)")
      .attr("class", "axis-label")
      .attr("y", 0 - 100)
      .attr("x", - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Votos");

   // define um SVG para as legendas
   var legend = d3.select(".chart")
      .append("svg")
      .attr("class", "legend");

   // define a adiciona os quadrados da legenda
   legend.selectAll("rect")
   .data(colors)
   .enter().append("rect")
   .attr("width", 10).attr("height", 10)
   .attr("rx", 2).attr("ry", 2)
   .attr("y", margin.top - 10)
   .attr("x", function(d, i){ return width/2 + margin.left/2 + 100*i + 20;})
   .style("fill", function(d,i){ return colors[i].color;})

   // define e adiciona os textos da legenda
   legend.selectAll("text")
   .data(colors)
   .enter().append("text")
   .attr("y", margin.top)
   .attr("x", function(d, i){ return width/2 + margin.left/2 + 100*i + 34;})
   .text(function(d, i){ return colors[i].turn + "º Turno"});
});

// gera o grid do gráfico
function makeGrid() {
    return d3.axisLeft(y).tickValues(gridTickValues);
}

// altera o valor das labels para o número completo
function mouseover(d,i) {
   d3.selectAll(".labelTotal").filter(function(g, j){ return i === j;})
      .text((layers[i][1]+layers[i][2]).toLocaleString('pt-br'));

   d3.selectAll(".label1st").filter(function(g, j){ return i === j;})
      .text(layers[i][1].toLocaleString('pt-br'));

   d3.selectAll(".label2nd").filter(function(g, j){ return i === j;})
      .text(layers[i][2].toLocaleString('pt-br'));
}

// altera o valor das labels para o número resumido
function mouseout(d, i) {
   d3.selectAll(".labelTotal").filter(function(g, j){ return i === j;})
      .text(f((layers[i][1]+layers[i][2])/1000000) + "M");

   d3.selectAll(".label1st").filter(function(g, j){ return i === j;})
      .text(f(layers[i][1]/1000000) + "M");

   d3.selectAll(".label2nd").filter(function(g, j){ return i === j;})
      .text(f(layers[i][2]/1000000) + "M");
}

// função auxiliar para quebra de linha dos itens do eixo X
function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1,
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

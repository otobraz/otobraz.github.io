// define margens e tamanho da tela
var margin = {top: 20, right: 200, bottom: 100, left: 200},
width = 1400 - margin.left - margin.right,
height = 650 - 78 - margin.top - margin.bottom;

var f = d3.format(",.2f");    // formatador dos números

// valores a serem exibidos no eixo Y do gráfico original
var tickValues = [
   5000000, 10000000, 15000000, 20000000, 25000000,
   30000000, 35000000, 40000000, 45000000
];

// valores a serem exibidos no eixo Y do gráfico auxiliar
var auxTickValues = [
   400000, 800000, 1200000, 1600000
];

// valores para grid do gráfico auxiliar
var auxGridTickValues = [
   200000, 400000, 600000, 800000, 1000000, 1200000, 1400000, 1600000
];

// definição do nome dos candidatos a serem exibidos no eixo X
var candidateNames = {
   "13": "Dilma ", "45": "Aécio Neves", "40": "Marina Silva",
   "50": "Luciana Genro", "20": "Pastor Everaldo",
   "43": "Eduardo Jorge", "28": "Levy Fidelix",
   "16": "Zé Maria", "27": "Eymael",
   "21": "Mauro Iasi", "29": "Rui Costa Pimenta",
};

// definição das escalas do gráfico original

var x = d3.scaleBand()
    .rangeRound([0, width])
    .padding(0.5);

var y = d3.scaleLinear()
    .range([height, 0]);

// definição das escalas do gráfico auxiliar

var auxCX = d3.scaleBand()
  .rangeRound([0, width*.55])
  .padding(0.5);

var auxCY = d3.scaleLinear()
  .range([height*.65, 0]);

// define e cria container para a visualização
var chart = d3.select(".chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// lê os dados e gera os gráficos de barra
d3.csv("data/presidente.csv").then(function(data){

   // leitura e processamento dos dados usando a função nest
   var votes = d3.nest()
   .key(function(d) { return d.id_candidate_num;})    // define número do candidato como chava
   .rollup(function(d) {                              // faz soma do número de votos
      return d3.sum(d, function(g) {return g.num_votes; })
   }).entries(data.filter(function(d){ return d.num_turn == 1;}));   // desconsidera votos do 2º turno

   // ordena os items de forma decrescente pelo número de votos
   votes.sort(function(x, y){ return x.value < y.value ? 1 : -1;});

   // cria variável auxiliar sem os 3 candidatos mais votados
   var auxCVotes = votes.slice(0);
   auxCVotes.splice(0,3);

   // definição dos eixos X e Y do gráfico original

   x.domain(votes.map(function(d) { return candidateNames[d.key]; }));
   y.domain([0, 50000000]);

   var xAxis = d3.axisBottom()
       .scale(x);

   var yAxis = d3.axisLeft()
       .scale(y)
       .tickFormat(d3.format("~s"))
       .ticks(5);

   // definição dos eixos X e Y do gráfico auxiliar

   auxCX.domain(auxCVotes.map(function(d) { return candidateNames[d.key]; }));
   auxCY.domain([0, 1800000]);

   var auxCXAxis = d3.axisBottom()
     .scale(auxCX);

   var auxCYAxis = d3.axisLeft()
     .scale(auxCY)
     .tickFormat(d3.format("~s"))
     .tickValues(auxTickValues);

   // // adiciona a grid ao gráfico original
   chart.append("g")
      .attr("class", "grid")
      .call(makeGrid(y, tickValues)
          .tickSize(-width)
          .tickFormat("")
      );

   // adiciona os eixos X e Y ao gráfico original

   chart.append("g")
       .attr("transform", "translate(0," + (height+0.5) + ")")
       .attr("class", "xAxis")
       .call(xAxis)
       .selectAll(".tick text")
         .call(wrap, x.bandwidth()/(x.padding()+0.2));

   chart.append("g").call(yAxis);

   // adiciona as barras ao gráfico original
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

   // adiciona a label com valor total dos votos no topo das barras
   chart.selectAll(".label")
      .data(votes)
      .enter().append("text")
      .attr("class", "label")
      .attr('x', function(d) {return x(candidateNames[d.key]) + x.bandwidth()/2;})
      .attr('y', function(d) {return y(d.value) - 5;})
      .text(function(d) {return f(d.value/1000000).toLocaleString('pt-br') + "M";});

   // adiciona label para explicar o eixo X
   chart.append("text")
      .attr("transform", "translate(" + (width/2) + " ," + (height + 65) + ")")
      .attr("class", "axis-label")
      .style("text-anchor", "middle")
      .text("Candidatos");

   // adiciona label para explicar o eixo Y
   chart.append("text")
      .attr("transform", "rotate(-90)")
      .attr("class", "axis-label")
      .attr("y", - 100)
      .attr("x", - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Votos");

   // adiciona SVG auxiliar sobre o SVG original
   d3.select(".chart")
      .append("svg")
      .attr("class", "aux-chart");

   // define posicionamento do gráfico auxiliar
   var auxChart = d3.select(".aux-chart")
     .attr("width", width + margin.left + margin.right)
     .attr("height", height + margin.top + margin.bottom)
     .append("g")
     .attr("transform", "translate(" + (width/2 + 130) + "," + (margin.top + 20) + ")");

   // adiciona retangulo branco como fundo para gráfico auxiliar
   auxChart.append("rect")
      .attr("width", width/2 + 120)
      .attr("height", height*.82)
      .attr("transform", "translate(" + -50 + "," + -10 + ")")
      .style("fill", "white")
      .style("stroke", "black");

   // adiciona grid ao gráfico auxiliar
   auxChart.append("g")
      .attr("class", "grid")
      .call(makeGrid(auxCY, auxGridTickValues)
          .tickSize(-width/2)
          .tickFormat("")
      );

   // adiciona os eixos X e Y ao gráfico auxiliar

   auxChart.append("g")
       .attr("transform", "translate(0," + (height*.65+0.5) + ")")
       .attr("class", "xAxis")
       .call(d3.axisBottom(auxCX))
       .selectAll(".tick text")
         .call(wrap, auxCX.bandwidth()/auxCX.padding());

   auxChart.append("g").call(auxCYAxis);

   // adiciona as barras ao gráfico auxiliar
   auxChart.selectAll(".bar")
      .data(auxCVotes)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return auxCX(candidateNames[d.key])})
      .attr("y", function(d) { return auxCY(d.value); })
      .attr("height", function(d) { return height*.65 - auxCY(d.value); })
      .attr("width", auxCX.bandwidth())
      .on("mouseover", mouseoverBar)
      .on("mouseout", mouseoutBar);

   // adiciona as labels com o valor total
   auxChart.selectAll(".label")
      .data(auxCVotes)
      .enter().append("text")
      .attr("class", "label")
      .attr('x', function(d) {return auxCX(candidateNames[d.key]) + auxCX.bandwidth()/2;})
      .attr('y', function(d) {return auxCY(d.value) - 5;})
      .text(function(d) {return f(d.value/1000000).toLocaleString('pt-br') + "M";});

   // adiciona título do grafo auxiliar
   auxChart.append("text")
      // .attr("transform", "rotate(-90)")
      .attr("class", "aux-title")
      .attr("y", 0)
      .attr("x", 270)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Candidatos com menos de 10M de votos");

   // adiciona label para explicar o eixo X do grafo auxiliar
   auxChart.append("text")
      .attr("transform", "translate(" + 250 + " ," + 350 + ")")
      .attr("class", "aux-axis-label")
      .style("text-anchor", "middle")
      .text("Candidatos");

   // adiciona label para explicar o eixo Y do grafo auxiliar
   auxChart.append("text")
      // .attr("transform", "rotate(-90)")
      .attr("class", "aux-axis-label")
      .attr("y", 0)
      .attr("x", -25)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Votos");

   // adiciona os comportamentos "mouseover" e "mouseout" para os ticks do eixo X
   d3.selectAll("g .xAxis").selectAll(".tick")
      .on("mouseover", mouseoverXAxis)
      .on("mouseout", mouseoutXAxis);
});

// gera as grids do gráfico
function makeGrid(y, tickValues) {
  return d3.axisLeft(y).tickValues(tickValues)
}

// altera a cor da barra para vermelho e a sua label para o número completo se o cursor passar pela barra
function mouseoverBar(d, i) {
   d3.select(this).style("fill", '#e41a1c');

   var parentNode = d3.select(this.parentNode);
   var labels = parentNode.selectAll(".label");

   labels.filter(function(g, j){ return i === j;})
      .text(d.value.toLocaleString('pt-br'));
}

// altera a cor da barra para azul e a sua label para o número resumido se o cursor sair da barra
function mouseoutBar(d, i) {
   d3.select(this).style("fill", '#377eb8');
   var parentNode = d3.select(this.parentNode);
   var labels = parentNode.selectAll(".label");
   labels.filter(function(g, j){ return i === j;})
      .text(f(d.value/1000000) + "M");
}

// se o cursor passa pelo i-ésimo item do eixo X, altera a cor da i-ésima barra para vermelho e sua label para o valor completo
function mouseoverXAxis(d,i) {
   var parentNode = d3.select(this.parentNode.parentNode);
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
      .style("fill", '#e41a1c');
}

// se o cursor passar pelo i-ésimo item do eixo X, altera a cor da i-ésima barra para azul e sua label para o valor resumido
function mouseoutXAxis(d,i) {
   var parentNode = d3.select(this.parentNode.parentNode);
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
      .style("fill", '#377eb8');

   d3.select(".chart-tooltip")
      .transition().duration(200)
      .style("opacity", 0);
}

// função auxiliar para quebra de linha dos itens do eixo X
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

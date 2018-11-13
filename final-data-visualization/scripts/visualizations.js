// define promise para que a função para gerar o mapa só seja executada após a leitura dos arquivos
var promises = [];
// Todos dados Usados
promises.push(d3.json('data/world_countries.json')); // Json com os paises
promises.push(d3.csv('data/totalEnemies.csv'));      // contem número de inimizades de cada país
promises.push(d3.csv('data/totalAllies.csv'));       // contem número de alianças de cada paísel
promises.push(d3.csv('data/nodes.csv'));               // nós do grafo
promises.push(d3.csv('data/edges.csv'));        // grafo contendo relação entre países em cada conflito

// executa a função "ready" após leitura dos arquivos
Promise.all(promises)
   .then(ready)
   .catch(function(error){
    throw error;
   });

// gera as visualizações
function ready(data) {

   /* ------ PROCESSAMENTO DE DADOS ------ */

   // monta o vetor com o número de inimizades de cada país
   data[1].forEach(function(d) { enemiesCount[d.id] = +d.amount; });

   // monta o vetor com o número de alianças de cada país
   data[2].forEach(function(d) { alliesCount[d.id] = +d.amount; });

   // inicializa o vetor de objetos de objetos para
   // contabilizar número de alianças/inimizades que cada país "d" teve com o restante dos "g" países
   data[3].forEach(function(d){
      countries[d.id] = d.country;
      enemiesByCountry[d.id] = {};
      alliesByCountry[d.id] = {};
      data[3].forEach(function(g){
         if(d.id != g.id){
            enemiesByCountry[d.id][g.id] = 0;
            alliesByCountry[d.id][g.id] = 0;
         }
      });
      countriesConflicts[d.id] = [];
      for(var i = startYear; i <= currentYear; i++){
        countriesConflicts[d.id].push({year:i, amount:0});
      }
   });
   countriesConflicts['0'] = [];
   for(var i = startYear; i <= currentYear; i++){
     countriesConflicts['0'].push({year:i, amount:0});
   }

   // faz o somatório do número de alianças e inimizades de cada país "d"
   data[4].forEach(function(d){
      if(d.relation === "-"){
         enemiesByCountry[d.source_id][d.target_id]++;
         enemiesByCountry[d.target_id][d.source_id]++;
      }else{
         alliesByCountry[d.source_id][d.target_id]++;
         alliesByCountry[d.target_id][d.source_id]++;
      }
   });

   edges = d3.nest()
   .key(function(d) { return d.conflict.trim();}).sortKeys(d3.ascending)
   .entries(data[4]);

   edges.forEach(function(conflict){
     end = conflict.values[0].end.trim();
     if(end === "Ongoing"){
        conflicts.push({source:conflict.values[0].source_id , target:conflict.values[0].target_id, conflict:conflict.key, start:+conflict.values[0].start, end:end});
     }else{
        conflicts.push({source:conflict.values[0].source_id , target:conflict.values[0].target_id, conflict:conflict.key, start:+conflict.values[0].start, end:+end});
     }
   });
   
   conflicts.forEach(function(d) {
     if(d.end === "Ongoing"){
        duration.push({conflict:d.conflict, duration: currentYear - d.start});
     }else{
        duration.push({conflict:d.conflict, duration: d.end - d.start});
     }
   });
   duration.sort(function(x, y){ return +x.duration < +y.duration ? 1 : -1;});

   for(var i = 0; i <= currentYear - startYear; i++){
     conflictsByYear.push({year:startYear+i,amount:0});
   }

   conflicts.forEach(function(conflict){
     start = conflict.start;
     if(conflict.end == "Ongoing"){
        while(start <= currentYear){
           countriesConflicts[conflict.source][start-startYear].amount++;
           countriesConflicts[conflict.target][start-startYear].amount++;
           conflictsByYear[start-startYear].amount++;
           start++;
        }
     }else{
        while(start <= conflict.end){
           countriesConflicts[conflict.source][start-startYear].amount++;
           countriesConflicts[conflict.target][start-startYear].amount++;
           conflictsByYear[start-startYear].amount++;
           start++;
        }
     }
   });

   /* ------ PROCESSAMENTO DE DADOS ------ */


   /* ------ MAPA ------ */

   // desenha o mapa inicial (estado inicial = 0)
   g = svg.append("g")
      .attr("class", "countries")
      .selectAll("path")
      .data(data[0].features)
      .enter().append("path")
      .attr("d", path)
      .style("fill", function(d){
         if(enemiesCount[d.id]){
            return d3.interpolateReds(enemiesCount[d.id]/maxEnemies); // colore os países
         }
         return "#ffffff";
      })
      .style("opacity", 1)
      .style("stroke","black")
      .style("stroke-width", 0.3)

      // atribui funções para os behaviors
      .on("mouseover", mouseOver)
      .on("mouseout", mouseOut)
      .on("mousemove", mouseMove)
      .on("click", updateMap);

   var legendHeight = 10;              // define altura da barra

   // define svg para legenda e as suas dimensões
   var lSvg = d3.select(".legend")
      .attr("width", width)
      .attr("height", 35); // altura do svg da legenda

   // define a legenda
   var legend = lSvg.append("defs")
      .append("svg:linearGradient")
      .attr("id", "gradient")
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "100%")
      .attr("y2", "100%")
      .attr("spreadMethod", "pad");

   // define os "stops" para cada parcela da barra
   legend.append("stop")
      .attr("class", "stop0")
      .attr("offset", "0%")
      .attr("stop-color", "#ffffff")
      .attr("stop-opacity", 1);

   legend.append("stop")
      .attr("class", "stop33")
      .attr("offset", "33%")
      .attr("stop-color", d3.interpolateReds(0.33))
      .attr("stop-opacity", 1);

   legend.append("stop")
      .attr("class", "stop66")
      .attr("offset", "66%")
      .attr("stop-color", d3.interpolateReds(0.66))
      .attr("stop-opacity", 1);

   legend.append("stop")
      .attr("class", "stop100")
      .attr("offset", "100%")
      .attr("stop-color", d3.interpolateReds(1))
      .attr("stop-opacity", 1);

   // gera a barra da legenda
   lSvg.append("rect")
      .attr("width", width - margin.left - margin.right)
      .attr("height", legendHeight)
      .style("fill", "url(#gradient)")
      .attr("transform", "translate(50, 7)");

   // define a escala
   var colorScale = d3.scaleLinear()
      .range([width - margin.left - margin.right, 0])
      .domain([212, 0]);

   // define eixo Y
   var colorXAxis = d3.axisBottom()
      .scale(colorScale)
      .tickValues(enemiesTickValues);

   // adiciona os ticks da escala e sua numeração
   lSvg.append("g")
      .attr("class", "colorXAxis")
      .attr("transform", "translate(49, 17)")
      .call(colorXAxis);

   /* ------ MAPA ------ */

   /* ------ GRÁFICO DE LINHAS ------ */

   yAxis = d3.axisLeft().scale(yScale);

   // configuracao dos dados
   chartData['enemies'] = data[1].sort(function(x,y){ return +x.amount < +y.amount ? 1 : -1; }).slice(0,15);
   chartData['allies'] = data[2].sort(function(x,y){ return +x.amount < +y.amount ? 1 : -1; }).slice(0,15);

   maxX = d3.max(chartData.enemies, function (d){ return +d.amount; });
   // escala X e Y
   xScale.domain([0, maxX]);
   yScale.domain(chartData.enemies.map(function (d){ return d.id; }));

   xAxisG.call(xAxis)
      .append("text")
         .attr("class", "axis-legend")
         .attr("fill", "black")
         .attr("transform", "rotate(0)")
         .attr("x", xScale(maxX))
         .attr("y", -4)
         .style("text-anchor", "end")
         .text("Amount");

   yAxisG.call(yAxis)
      .append("text")
         .attr("class", "axis-legend")
         .attr("fill", "black")
         .attr("transform", "rotate(0)")
         .attr("x", 10)
         .attr("y", -4)
         .style("text-anchor", "end")
         .text("Countries");

   //Barra e tooltip
   var bars = chartG.selectAll(".bar")
      .data(chartData.enemies)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", 1)
      .attr("y", function(d) { return yScale(d.id); })
      .attr("width", function(d) { return xScale(d.amount); })
      .attr("height", yScale.bandwidth())
      .style("fill", function(d){ return d3.interpolateReds(d.amount/212);})
      .on("mouseover", function(){
         d3.select(this).style("fill", '#377eb8');
      })
      .on("mousemove", chartMouseMove)
      .on("mouseout", barChartMouseOut);

   /* ------ GRÁFICO DE LINHAS ------ */

   /* ------ SÉRIE TEMPORAL ------ */

   lineChartXScale.domain([startYear, currentYear]);
   lineChartYScale.domain([0, d3.max(conflictsByYear, function(d){ return +d.amount})]);

   // Gera as linhas da serie temporal
   line = d3.line()
      .x(function(d) { return lineChartXScale(d.year); })
      .y(function(d) { return lineChartYScale(d.amount); })
      .curve(d3.curveMonotoneX)

   countryLine = d3.line()
      .x(function(d) { return lineChartXScale(d.year); })
      .y(function(d) { return lineChartYScale(d.amount); })
      .curve(d3.curveMonotoneX)

   // linha X
   lineChartXAxis = lineChartSVG.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + lineChartInnerHeight + ")")
   lineChartXAxis
      .call(d3.axisBottom(lineChartXScale).ticks(10).tickFormat(d3.format("d")))
      .append("text")
         .attr("class", "axis-legend")
         .attr("fill", "black")
         .attr("transform", "rotate(0)")
         .attr("x", lineChartXScale(currentYear) + 50)
         .attr("y", 5)
         .style("text-anchor", "end")
         .text("Years");

   // linha Y
   lineChartYAxis = lineChartSVG.append("g")
      .attr("class", "y axis");
   lineChartYAxis
      .call(d3.axisLeft(lineChartYScale).ticks(5))
      .append("text")
         .attr("class", "axis-legend")
         .attr("fill", "black")
         .attr("transform", "rotate(0)")
         .attr("x", -10)
         .attr("y", -10)
         .style("text-anchor", "end")
         .text("Wars");

   // seta os dados para as linhas
   lineChartSVG.append("path")
      .datum(conflictsByYear)
      .attr("class", "line")
      .attr("d", line);

   lineChartSVG.append("path")
      .datum(countriesConflicts['0'])
      .attr("class", "country-line")
      .attr("d", countryLine)
      .style("display", "none");

   var lineChartLegend = d3.select(".line-chart-legend")
      .attr("height", 15);

   lineChartLegend
      .append("rect")
      .attr("class", "linechart-legend-rect")
      .attr("width", 15).attr("height", 15)
      .attr("rx", 2).attr("ry", 2)
      .attr("y", 0)
      .attr("x", 60);

   lineChartLegend
      .append("text")
         .attr("class", "linechart-legend-text")
         .attr("transform", "rotate(0)")
         .attr("y", 13)
         .attr("x", 80)
         .text("Total");

   lineChartLegend
      .append("rect")
      .attr("class", "linechart-legend-country-rect")
      .attr("width", 15).attr("height", 15)
      .attr("rx", 2).attr("ry", 2)
      .attr("y", 0)
      .attr("x", 125);

   lineChartLegend
      .append("text")
         .attr("class", "linechart-legend-country-text")
         .attr("transform", "rotate(0)")
         .attr("y", 13)
         .attr("x", 145)
         .text("Selected Country");

   // Coloca circulos em cada ponto
   lineChartSVG.selectAll(".dot")
      .data(conflictsByYear)
      .enter().append("circle")
         .attr("class", "dot")
         .attr("cx", function(d) { return lineChartXScale(d.year) })
         .attr("cy", function(d) { return lineChartYScale(d.amount) })
         .attr("r", circleRadius)
         .on("mouseover", lineChartMouseOver)
         .on("mouseout", lineChartMouseOut);

   /* ------ SÉRIE TEMPORAL ------ */

}

// atualiza o mapa quando o usuário clicar em algum país
function updateMap(d){
   selected = d3.select(this);
   // se o mapa estiver mostrando as inimizades
   if(status == 0 || status == 2){
      // se o país já estiver selecionado, retorna o estado da visualização para "0"
      if(selected.classed("selected")){
         selected.classed("selected", false);
         toEnemies();
      }else{
         max = myMax(enemiesByCountry[d.id]);   // calcula maior quantidade de inimizades que o país teve
         var array = getTopCountries(enemiesByCountry[d.id]).slice(0,30);

         // colore os países
         d3.selectAll("g.countries path")
            .classed("selected", false)
            .transition()
            .duration(500)
            .style("fill", function(g){
               if((d.id in enemiesByCountry) && (g.id in enemiesByCountry[d.id])){
                  if(enemiesByCountry[d.id][g.id] == 0) return "#ffffff";
                  return d3.interpolateReds(enemiesByCountry[d.id][g.id]/max);
               }else if(d.id == g.id){          // colore o país selecionado de azul
                  return "#2166ac";
               }
               return "#ffffff";
         });

         // define o intervalo e domínio da escala
         var y = d3.scaleLinear()
            .range([width - margin.left - margin.right, 0])
            .domain([max, 0]);

         // gera o eixo o Y
         d3.select(".yAxis")
            .transition()
            .duration(500)
            .call(
               d3.axisBottom().
                  scale(y).ticks(Math.min(max,10))
            );

         selected.attr("class", "selected");                   // atribui a classe "selected" ao país selecionado
         status = 2;                                           // altera o estado para "2"
         selectedCountry = {name:d.properties.name, id:d.id};  // armazena id do país selecionado

         d3.select(".title a")  // atualiza título da visualização com o nome do país selecionado
            .text("Conflicts Faced by " + selectedCountry.name + " Since 1500");

         updateBarChart(max, array);
         updateLineChart();
      }
   }else{
      // se o país já estiver selecionado, retorna o estado da visualização para "1"
      if(selected.classed("selected")){
         selected.classed("selected", false);
         toAllies();
      }else{
         max = myMax(alliesByCountry[d.id]);    // calcula maior quantidade de alianças que o país teve
         var array = getTopCountries(alliesByCountry[d.id]);

         // colore os países
         d3.selectAll("g.countries path")
            .classed("selected", false)
            .transition()
            .duration(500)
            .style("fill", function(g){
               if((d.id in alliesByCountry) && (g.id in alliesByCountry[d.id])){
                  if(alliesByCountry[d.id][g.id] == 0) return "#ffffff";
                  return d3.interpolateGreens(alliesByCountry[d.id][g.id]/max);
               }else if(d.id == g.id){          // colore o país selecionado de azul
                  return "#2166ac";
               }
               return "#ffffff";
         });

         // define o intervalo e domínio da escala
         var y = d3.scaleLinear()
            .range([width - margin.left - margin.right, 0])
            .domain([max, 0]);

         // gera o eixo o Y
         d3.select(".yAxis")
            .transition()
            .duration(500)
            .call(
               d3.axisBottom().
                  scale(y).ticks(Math.min(max,10))
            );

         selected.attr("class", "selected");                   // atribui a classe "selected" ao país selecionado
         status = 3;                                           // altera o estado para "3"
         selectedCountry = {name:d.properties.name, id:d.id};  // armazena id do país selecionado

         d3.select(".title a")     // atualiza título da visualização com o nome do país selecionado
            .text("Alliances Formed by " + selectedCountry.name + " Since 1500");

         updateBarChart(max, array);
         updateLineChart();
      }
   }
}

// altera o estado do sistema para "0"
// é mostrado o número de inimizades total de cada país
function toEnemies(){
   // colore os países
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

   // atualiza cores da legenda
   d3.select(".stop33").transition().duration(500).attr("stop-color", d3.interpolateReds(0.33));
   d3.select(".stop66").transition().duration(500).attr("stop-color", d3.interpolateReds(0.66));
   d3.select(".stop100").transition().duration(500).attr("stop-color", d3.interpolateReds(1));

   // atualiza ticks da legenda
   var y = d3.scaleLinear()
      .range([width - margin.left - margin.right, 0])
      .domain([212, 0]);

   d3.select(".yAxis")
      .transition()
      .duration(500)
      .call(
         d3.axisBottom()
            .scale(y)
            .tickValues(enemiesTickValues)
      );

   selectedCountry = {};   // reseta a seleção do país selecionado

   // altera título da visualização
   d3.select(".title a").text("Number of Conflicts Faced by Each Country Since 1500");

   // atualiza classe dos botões para realçar o botão selecionado
   d3.select(".btn-enemies").classed("my-focus", true);
   d3.select(".btn-allies").classed("my-focus", false);

   var max = myMax(enemiesCount);
   xScale.domain([0, max]);
   xAxis.ticks(Math.min(max,10))
   xAxisG
      .transition()
      .duration(500)
      .call(xAxis);

   yScale.domain(chartData.enemies.map(function (d){ return d.id; }));
   var newYAxis = d3.axisLeft().scale(yScale);
   yAxisG.transition().duration(500)
      .call(newYAxis);

   // chartG.selectAll(".bar").remove();

   chartG.selectAll(".bar")
      .data(chartData.enemies)
      // .enter().append("rect")
      // .attr("class", "bar")
      // .on("mousemove", chartMouseMove)
      // .on("mouseout", barChartMouseOut)
      .transition().duration(500)
      .style("fill", function(d,i){ return d3.interpolateReds(chartData.enemies[i].amount/maxEnemies);})
      .attr("width", function(d,i) { return xScale(chartData.enemies[i].amount); })
      .attr("height", yScale.bandwidth())
      .attr("x", 1)
      .attr("y", function(d) { return yScale(d.id) });

   status = 0;    // altera estado para 0

   updateLineChart();
}

// altera o estado do sistema para "1"
// é mostrado o número de alianças total de cada país
function toAllies(){
   // colore os países
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

   // atualiza cores da legenda
   d3.select(".stop33").transition().duration(500).attr("stop-color", d3.interpolateGreens(0.33));
   d3.select(".stop66").transition().duration(500).attr("stop-color", d3.interpolateGreens(0.66));
   d3.select(".stop100").transition().duration(500).attr("stop-color", d3.interpolateGreens(1));

   // atualiza ticks da legenda
   var y = d3.scaleLinear()
      .range([width - margin.left - margin.right, 0])
      .domain([327, 0]);

   d3.select(".yAxis")
      .transition()
      .duration(500).call(
         d3.axisBottom()
            .scale(y)
            .tickValues(alliesTickValues)
      );

   selectedCountry = {};   // reseta a seleção do país selecionado

   // altera título da visualização
   d3.select(".title a").text("Number of Alliances Formed by Each Country Since 1500");

   // atualiza classe dos botões para realçar o botão selecionado
   d3.select(".btn-enemies").classed("my-focus", false);
   d3.select(".btn-allies").classed("my-focus", true);

   var max = myMax(alliesCount);
   xScale.domain([0, max]);
   xAxis.ticks(Math.min(max,10));

   xAxisG
      .transition()
      .duration(500)
      .call(xAxis);

   yScale.domain(chartData.allies.map(function (d){ return d.id; }));
   var newYAxis = d3.axisLeft().scale(yScale);
   yAxisG.transition().duration(500)
      .call(newYAxis);

   // chartG.selectAll(".bar").remove();

   chartG.selectAll(".bar")
      .data(chartData.allies)
      // .enter().append("rect")
      // .attr("class", "bar")
      // .on("mousemove", chartMouseMove)
      // .on("mouseout", barChartMouseOut)
      .transition().duration(500)
      .style("fill", function(d,i){ return d3.interpolateGreens(chartData.allies[i].amount/maxAllies);})
      .attr("width", function(d,i) { return xScale(chartData.allies[i].amount); })
      .attr("height", yScale.bandwidth())
      .attr("x", 1)
      .attr("y", function(d) { return yScale(d.id) });

   status = 1;    // altera estado para 1

   updateLineChart();
}

// atualiza o gráfico de linhas
function updateLineChart(){
   if(status == 2 || status == 3){
      var selectedCountryConflicts;
      if(selectedCountry.id in countriesConflicts){
         selectedCountryConflicts = countriesConflicts[selectedCountry.id].slice(from,to);
      }else{
         selectedCountryConflicts = countriesConflicts['0'].slice(from,to);
      }
      d3.select(".country-line")
         .datum(selectedCountryConflicts)
         .style("display", "inline")
         .transition().duration(500)
         // .style("stroke", "#ff0000")
         .attr("d", countryLine);

      lineChartSVG.selectAll(".country-dot").remove();

      var countryDot = lineChartSVG.selectAll(".country-dot")
         .data(selectedCountryConflicts)
         .enter().append("circle");
      countryDot
         .transition().duration(500)
         // .style("fill", "#ff0000")
         .attr("class", "country-dot")
         .attr("cx", function(d) { return lineChartXScale(d.year) })
         .attr("cy", function(d) { return lineChartYScale(d.amount) })
         .attr("r", circleRadius);
      countryDot
         .on("mouseover", lineChartMouseOver)
         .on("mouseout", lineChartMouseOut);
      d3.select(".linechart-legend-country-text")
         .text(selectedCountry.name)
         .transition().duration(500)
         .style("opacity", 1);
      d3.select(".linechart-legend-country-rect")
         .style("opacity", 1);
   }else{
      d3.select(".country-line")
         .datum(countriesConflicts['0'].slice(from,to))
         .transition().duration(500)
         .attr("d", countryLine)
         .transition().duration(500)
         // .style("stroke", "#33a02c")
         .style("display", "none");

      lineChartSVG.selectAll(".country-dot").remove();

      d3.select(".linechart-legend-country-text")
         .text("Selected Country")
         .transition().duration(500)
         .style("opacity", .3);
      d3.select(".linechart-legend-country-rect")
         .transition().duration(500)
         .style("opacity", .3);
   }
}

// atualiza o gráfico de barras quando um país é selecionado
function updateBarChart(max, array){
   xScale.domain([0, max]);
   xAxis.ticks(Math.min(max,10));
   xAxisG.transition().duration(500)
      .call(xAxis);

   var filteredArray = array.filter(function(d){ return d.amount > 0;}).slice(0,15);
   yScale.domain(filteredArray.map(function (d){ return d.id; }));
   var newYAxis = d3.axisLeft().scale(yScale);
   yAxisG.transition().duration(500)
      .call(newYAxis);

   // chartG.selectAll(".bar").remove();

   chartG.selectAll(".bar")
      .data(array)
      // .enter().append("rect")
      // .attr("class", "bar")
      // .on("mousemove", chartMouseMove)
      // .on("mouseout", barChartMouseOut)
      .transition().duration(500)
      .attr("width", function(d,i){
         if(i in array){
            return xScale(d.amount);
         }else{
            return xScale(0);
         }
      })
      .attr("height", yScale.bandwidth())
      .attr("x", 1)
      .attr("y", function(d,i) { return yScale(d.id) })
      .style("fill", function(d){
         if(status == 0 || status == 2){
            return d3.interpolateReds(d.amount/max);
         }
         return d3.interpolateGreens(d.amount/max);
      });
}

// aplica filtro de período à série temporal
function filterTimePeriod(){

   from = d3.select("#from").property("value");
   to = d3.select("#to").property("value");

   if (parseInt(to) > parseInt(from)  && to <= 2018 && from >= 1500){
      document.getElementById("from").style.border = "1px solid #ced4da ";
      document.getElementById("to").style.border = "1px solid #ced4da ";
      from = from - startYear;
      to = to - startYear+1;
      filteredConflicts = conflictsByYear.slice(from ,to);

      lineChartXScale.domain([d3.select("#from").property("value"), d3.select("#to").property("value")]);
      lineChartYScale.domain([0, d3.max(filteredConflicts, function(d){ return +d.amount})]);

      //linha X
      lineChartXAxis
        .transition().duration(500)
        .call(d3.axisBottom(lineChartXScale).ticks(10).tickFormat(d3.format("d")));

      // linha Y
      lineChartYAxis
        .transition().duration(500)
        .call(d3.axisLeft(lineChartYScale).ticks(5));

      lineChartSVG.selectAll(".line")
        .datum(filteredConflicts)
        .transition().duration(500)
        .attr("d", line);

      lineChartSVG.selectAll(".dot").remove();

      var countryDot = lineChartSVG.selectAll(".dot")
        .data(filteredConflicts)
        .enter().append("circle");
      countryDot
        .transition().duration(500)
        .attr("class", "dot")
        .attr("cx", function(d) { return lineChartXScale(d.year) })
        .attr("cy", function(d) { return lineChartYScale(d.amount) })
        .attr("r", circleRadius)
      countryDot
         .on("mouseover", lineChartMouseOver)
         .on("mouseout", lineChartMouseOut);

    // se houve algum país selecionado
     if(status == 2 || status == 3){
         filteredCountryConflicts = countriesConflicts[selectedCountry.id].slice(from,to);
         lineChartSVG.selectAll(".country-line")
            .datum(filteredCountryConflicts)
            .transition().duration(500)
            .attr("d", countryLine);

         lineChartSVG.selectAll(".country-dot").remove();
         var countryDot = lineChartSVG.selectAll(".country-dot")
            .data(filteredCountryConflicts)
            .enter().append("circle");
         countryDot
            .transition().duration(500)
            // .style("fill", function(){ return status == 2 ? "#ff0000" : "#33a02c";})
            .attr("class", "country-dot")
            .attr("cx", function(d) { return lineChartXScale(d.year) })
            .attr("cy", function(d) { return lineChartYScale(d.amount) })
            .attr("r", circleRadius);
         countryDot
            .on("mouseover", lineChartMouseOver)
            .on("mouseout", lineChartMouseOut);
      }
   }
   else if(parseInt(from) > parseInt(to)){
      alert("Start date should be earlier than the end date");
      document.getElementById("from").style.border = "2px solid red";
      document.getElementById("to").style.border = "2px solid red";
   }
   else if(from < 1500){
      alert("Start date should be later than 1500");
      document.getElementById("from").style.border = "2px solid red";
      document.getElementById("to").style.border = "1px solid #ced4da ";
   }
   else if(to > 2018){
      alert("End date should be earlier than 2018");
      document.getElementById("to").style.border = "2px solid red";
      document.getElementById("from").style.border = "1px solid #ced4da ";
   }
}

// Restaura escala e posicionamento padrão da visualização
function reset(){
   svg
      .transition()
      .duration(1000)
      .call(zoom.transform, d3.zoomIdentity);
}

// calcula quantida de zoom a ser dada por vez
function wheelDelta() {
  return -d3.event.deltaY * (d3.event.deltaMode ? 120 : 1) / 2000;
}

// função para calcular número de inimizades e alianças máximas de um país
function myMax(array){
   var max = 0;
   for(var key in array){
      if(array[key] > max){
         max = array[key];
      }
   };
   return max;
}

// função para calcular número de inimizades e alianças máximas de um país
function getTopCountries(array){
   var topCountries = [];
   for(var key in array){
         topCountries.push({id:key, amount:array[key]});
   }
   return topCountries.sort(function(x, y){ return x.amount < y.amount ? 1 : -1;});
}

// calcula tamanho do nome do país em pixels para definir largura da tooltip
function getTextWidth(text, font) {
    var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    var context = canvas.getContext("2d");
    context.font = font;
    var metrics = context.measureText(text);
    return metrics.width;
}

// mostra tooltip quando houver hover em um país
function mouseOver(d) {
   var n = 0;
   var tWidth = Math.max(getTextWidth(selectedCountry.name + ' - ' + d.properties.name, "bold 12pt BlinkMacSystemFont"), 100);
   d3.select(this)                     // realça país quando cursor do mouse passar por ele
      .style("opacity", 0.5)
      .style("stroke-width",1.5)
      .style("stroke", "blue");
   tooltip                             // mostra tooltip e define sua largura
      .style("display", "inline")
      .style("width", tWidth + "px")
      .style("left", (d3.event.pageX) + "px")
      .style("top", (d3.event.pageY) - 15 + "px");

   // existem tooltips específicas dependendo do estado da visualização. Elas são controladas pelo switch
   switch(status){

      // mostra o número total de inimizades que o país teve até o momento
      case '0':
         if(enemiesCount[d.id]){
            n = enemiesCount[d.id];
         }
         tooltip.html(d.properties.name + '</br>Conflicts: ' + n);
         break;

      // mostra o número total de alianças que o país formou até o momento
      case '1':
         if(alliesCount[d.id]){
            n = alliesCount[d.id];
         }
         tooltip.html(d.properties.name + '</br>Alliances: ' + n);
         break;

      // mostra número de inimizades que o país selecionado teve com os países que o cursor passar por cima
      case '2':
         if(selectedCountry.id == d.id){
            tooltip.html('Selected:</br>' + d.properties.name);
         }else{
            if((selectedCountry.id in enemiesByCountry) && (d.id in enemiesByCountry[selectedCountry.id])){
               n = enemiesByCountry[selectedCountry.id][d.id];
            }
            tooltip.html(selectedCountry.name + ' - ' + d.properties.name + '</br>Conflicts: ' + n);
         }
         break;

         // mostra número de alianças que o país selecionado teve com os países que o cursor passar por cima
         case '3':
            if(selectedCountry.id == d.id){
               tooltip.html('Selected:</br>' + d.properties.name);
            }else{
               if((selectedCountry.id in alliesByCountry) && (d.id in alliesByCountry[selectedCountry.id])){
                  n = alliesByCountry[selectedCountry.id][d.id];
               }
               tooltip.html(selectedCountry.name + ' - ' + d.properties.name + '</br>Alliances: ' + n);
            }
            break;
   }
}

// esconde a tooltip
function mouseOut() {
   tooltip.style("display", "none");
   d3.select(this)
      .style("opacity",1)
      .style("stroke","black")
      .style("stroke-width", 0.3);
}

// faz com que a tooltip siga o cursor
function mouseMove(){
   tooltip
      .style("left", (d3.event.pageX) + "px")
      .style("top", (d3.event.pageY) - 15 + "px");
}

function chartMouseMove(d,i){
   chartTooltip
      .style("left", d3.event.pageX - 2 + "px")
      .style("top", d3.event.pageY - 40 + "px")
      .style("display", "inline-block");

   switch(status){

      // mostra o número total de inimizades que o país teve até o momento
      case '0':
         chartTooltip.html((countries[d.id]) + "<br>" + "Total:" + (d.amount) + "<br>" );
         break;

      // mostra o número total de alianças que o país formou até o momento
      case '1':
         chartTooltip.html((countries[d.id]) + "<br>" + "Total:" + (d.amount) + "<br>" );
         break;

      // mostra número de inimizades que o país selecionado teve com os países que o cursor passar por cima
      case '2':
         var array = getTopCountries(enemiesByCountry[selectedCountry.id]);
         chartTooltip.html(countries[array[i].id] + "<br>" + "Total:" + array[i].amount + "<br>" );
         break;

      // mostra número de alianças que o país selecionado teve com os países que o cursor passar por cima
      case '3':
         var array = getTopCountries(alliesByCountry[selectedCountry.id]);
         chartTooltip.html(countries[array[i].id] + "<br>" + "Total:" + array[i].amount + "<br>" );
         break;
   }
}

function barChartMouseOut(d){
   switch (status) {
      case '0':
         d3.select(this).style("fill", d3.interpolateReds(d.amount/maxEnemies));
         break;
      case '1':
         d3.select(this).style("fill", d3.interpolateGreens(d.amount/maxAllies));
         break;
      case '2':
         d3.select(this).style("fill", d3.interpolateReds(d.amount/max));
         break;
      case '3':
         d3.select(this).style("fill", d3.interpolateGreens(d.amount/max));
         break;
   }
   chartTooltip.style("display", "none");
}

function lineChartMouseOver(d){
   lineChartTooltip
      .style("left", d3.event.pageX - 2 + "px")
      .style("top", d3.event.pageY - 40 + "px")
      .style("display", "inline")
      .html("Year: " + d.year + "</br> Wars: " + d.amount);
}

function lineChartMouseOut(d){
   lineChartTooltip.style("display", "none");
}

function showHelp(){

}

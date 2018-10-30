// define margens e tamanho da tela
var margin = {top: 50, right: 50, bottom: 50, left: 50},
            width = 1000,
            height = 600 - margin.top - margin.bottom;

// seleciona o SVG e define sua dimensão
var svg = d3.select("svg")
   .attr("width", width)
   .attr("height", height)
   .attr("class", "map");

// define e cria o elemento "g" para o mapa
var g = svg
   .append('g')
   .attr('class', 'map');

// adiciona tooltip
var tooltip = d3.select("body")
   .append("div")
   .attr("class", "map-tooltip")
   .style("display", "none");

// define a projeção do mapa
var projection = d3.geoEquirectangular()
   .scale(158.5)
   .translate([width / 2, 250])

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

/* mantém controle do estado atual da visualização {
   0: inimigos em geral
   1: alianças em geral
   2: inimigos de país selecionado
   3: alianças de país selecionado
}*/
var status = 0;

// define valores dos ticks das legendas pros estados 0 e 1 da visualização
var enemiesTickValues = [0,20,40,60,80,100,120,140,160,180,200,212];
var alliesTickValues = [0,30,60,90,120,150,180,210,240,270,300,327];

var selectedCountry = {};                // mantem controle do país selecionado pelo usuário

var enemiesCount = {};              // número de inimizades de cada país
var alliesCount = {};               // número de alianças de cada país
var enemiesByCountry = {};          // número de inimizades que cada país teve com os demais
var alliesByCountry = {};           // número de alianças que cada país formou com os demais

// define promise para que a função para gerar o mapa só seja executada após a leitura dos arquivos
var promises = [];
promises.push(d3.json('data/world_countries.json'));
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

// gera o mapa e seus elementos
function ready(data) {

   // monta o vetor com o número de inimizades de cada país
   data[1].forEach(function(d) { enemiesCount[d.id] = +d.enemies; });

   // monta o vetor com o número de alianças de cada país
   data[2].forEach(function(d) { alliesCount[d.id] = +d.allies; });

   // inicializa o vetor de objetos de objetos para
   // contabilizar número de alianças/inimizades que cada país "d" teve com o restante dos "g" países
   data[3].forEach(function(d){
      enemiesByCountry[d.id] = {};
      alliesByCountry[d.id] = {};
      data[3].forEach(function(g){
         if(d.id != g.id){
            enemiesByCountry[d.id][g.id] = 0;
            alliesByCountry[d.id][g.id] = 0;
         }
      });
   });

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

   // desenha o mapa inicial (estado inicial = 0)
   g = svg.append("g")
      .attr("class", "countries")
      .selectAll("path")
      .data(data[0].features)
      .enter().append("path")
      .attr("d", path)
      .style("fill", function(d){
         if(enemiesCount[d.id]){
            return d3.interpolateReds(enemiesCount[d.id]/212); // colore os países
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

   /* ------- LEGENDA ------- */

   var legendHeight = 50;              // define altura da barra

   // define svg para legenda e as suas dimensões
   var lSvg = d3.select(".legend")
      .attr("width", width)
      .attr("height", legendHeight);

   //
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

   // gera a barra da lengenda
   lSvg.append("rect")
      .attr("width", width - margin.left - margin.right)
      .attr("height", legendHeight - 30)
      .style("fill", "url(#gradient)")
      .attr("transform", "translate(50,10)");

   // define a escala
   var y = d3.scaleLinear()
      .range([width - margin.left - margin.right, 0])
      .domain([212, 0]);

   // define eixo Y
   var yAxis = d3.axisBottom()
      .scale(y)
      .tickValues(enemiesTickValues);

   // adiciona os ticks da escala e sua numeração
   lSvg.append("g")
      .attr("class", "yAxis")
      .attr("transform", "translate(49,30)")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("axis title");
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

// calcula tamanho do nome do país em pixels para definir largura da tooltip
function getTextWidth(text, font) {
    var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    var context = canvas.getContext("2d");
    context.font = font;
    var metrics = context.measureText(text);
    return metrics.width;
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
   d3.select(".title h3").html("Number of conflicts faced by each country since 1500");

   // atualiza classe dos botões para realçar o botão selecionado
   d3.select(".btn-enemies").classed("my-focus", true);
   d3.select(".btn-allies").classed("my-focus", false);

   status = 0;    // altera estado para 0
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
   d3.select(".title h3").html("Number of alliances formed by each country since 1500");

   // atualiza classe dos botões para realçar o botão selecionado
   d3.select(".btn-enemies").classed("my-focus", false);
   d3.select(".btn-allies").classed("my-focus", true);

   status = 1;    // altera estado para 1
}

// Restaura escala e posicionamento padrão da visualização
function reset(){
   svg
      .transition()
      .duration(1000)
      .call(zoom.transform, d3.zoomIdentity);
}

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

         d3.select(".title h3")  // atualiza título da visualização com o nome do país selecionado
            .html("Alliances formed by " + selectedCountry.name + " since 1500");
      }
   }else{
      // se o país já estiver selecionado, retorna o estado da visualização para "1"
      if(selected.classed("selected")){
         selected.classed("selected", false);
         toAllies();
      }else{
         max = myMax(alliesByCountry[d.id]);    // calcula maior quantidade de alianças que o país teve

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

         d3.select(".title h3")     // atualiza título da visualização com o nome do país selecionado
            .html("Conflicts faced by " + selectedCountry.name + " since 1500");
      }
   }
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

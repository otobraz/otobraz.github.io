// define margens e tamanho da tela
var margin = {top: 125, right: 50, bottom: 100, left: 50},
width = window.innerWidth / 2.5,
height = window.innerHeight - margin.top - margin.bottom;


var mostVotedByTurn = [[],[]];
var mostVoted = [];

// definição das cores para os partidos
var colors = [
   {party: 'PT', color: '#33a02c'},
   {party: 'PSDB', color: '#1f78b4'},
   {party: 'PSB', color: '#b2df8a'},
   {party: 'PMDB', color: '#a6cee3'},
];

// seleciona o SVG e define sua dimensão
var svg = d3.selectAll(".chart")
.attr("width", width)
.attr("height", height)

// define e cria containers para os dois mapas
var g = svg.append("g")
   .attr("id", function(d, i){ return ("g"+i);});

// adiciona div para o tool-tip
var div = d3.select("body").append("div")
   .attr("class", "map-tooltip")
   .style("display", "none");

// define a escala da projeção, centro e posição
var projection = d3.geoMercator()
.scale(width)
.center([-52, -15])
.translate([width / 2, height - margin.top - margin.bottom]);

// define path para desenhar o mapa
var path = d3.geoPath().projection(projection);

// define array de arquivos a serem lidos de forma assíncrona
var files = ['data/br-states.json', 'data/eleicoes_2014.csv'];

// define promise para que a função para gerar o mapa só seja executada após a leitura dos arquivos
var promises = [];
promises.push(d3.json('data/br-states.json'));
promises.push(d3.csv('data/eleicoes_2014.csv'));

Promise.all(promises)
   .then(generateMap)
   .catch(function(error){
      throw error;
   });

// função que gera os mapas
function generateMap(data) {

   // lê e faz processamento dos dados utilizando a função nest
   var votesByTurn = d3.nest()
   .key(function(d) { return d.num_turn;})   // define o turno como 1ª chave
   .key(function(d) { return d.cat_state;})  // define o estado como 2ª chave
   .key(function(d) { return d.cat_party;})  // define o partido como 3ª chave
   .rollup(function(d) {                     // faz soma do número de votos
      return d3.sum(d, function(g) {return g.num_votes;});
   }).entries(data[1].filter(function(d){ return d.cat_state != "ZZ"; }));    // remove estado "ZZ" contido nos dados

   var max = 0;
   votesByTurn.forEach(function(turn, i){
      turn.values.forEach(function(state){
         var maxParty;
         state.values.forEach(function(party){
            if(party.value > max){
               max = party.value;
               maxParty = party.key;
            }
         });
         mostVotedByTurn[i].push({state: state.key, party: maxParty, votes: max});
         max = 0;
      })
   });

   // Extrai os polígonos dos estados
   var states = topojson.feature(data[0], data[0].objects.estados);

   // Extrai os contornos dos estados
   var states_contour = topojson.mesh(data[0], data[0].objects.estados);

   // seleciona e define o tamanho da legenda
   var legend = d3.select(".legend")
      .attr("width", '100%')
      .attr("height", '100%');

   // define desenha os estados
   g.selectAll(".estado")
   .data(states.features)
   .enter().append("path")
      .attr("class", 'state')
      .attr("d", path);

   // define e desenha o contorno dos estados
   g.append("path")
   .datum(states_contour)
   .attr("d", path)
   .attr("class", "state_contour");

   // define as propriedades do mapa referente ao segundo turno
   svg.select("#g0").selectAll("path")
   .data(states.features)
   .style("fill", function(d, i){         // define cores
      return colors.find(c => c.party === mostVotedByTurn[0].find(s => s.state === d.id).party).color;
   })
   .style('fill-opacity', '1')
   .on("mouseover", mouseover)            // adiciona o comportamento "mouseover"
   .on("mousemove", function(d, i){       // define comportamento "mousemove" (tooltip segue o mouse)
      div
         .html(d.properties.nome + '</br>Votos: ' + mostVotedByTurn[0].find(s => s.state === d.id).votes.toLocaleString('pt-br'))
         .style("left", (d3.event.pageX) + "px")
         .style("top", (d3.event.pageY) + "px");
   })
   .on("mouseout", mouseout);

   // define as propriedades do mapa referente ao segundo turno
   svg.select("#g1").selectAll("path")
   .data(states.features)
   .style("fill", function(d, i){      // define cores
      return colors.find(c => c.party === mostVotedByTurn[1].find(s => s.state === d.id).party).color;
   })
   .style('fill-opacity', '1')
   .on("mouseover", mouseover)         // adiciona o comportamento "mouseover"
   .on("mousemove", function(d, i){    // define comportamento "mousemove" (tooltip segue o mouse)
      div
         .html(d.properties.nome + '</br>Votos: ' + mostVotedByTurn[1].find(s => s.state === d.id).votes.toLocaleString('pt-br'))
         .style("left", (d3.event.pageX) + "px")
         .style("top", (d3.event.pageY) + "px");
   })
   .on("mouseout", mouseout);

   // define atributos/estilos e adiciona a legenda
   legend.selectAll("rect")
   .data(colors)
   .enter().append("rect")
   .attr("width", 20).attr("height", 20)
   .attr("rx", 2).attr("ry", 2)
   .attr("y", function(d, i){ if(i>=2){ return height / 2 + 75; } return height / 2;})
   .attr("x", function(d, i) { if(i == 0 || i == 2) return 25; return 125;})
   .style("fill", function(d){ return d.color;});

   // define e adiciona os textos da legenda
   legend.selectAll("text")
   .data(colors)
   .enter().append("text")
   .attr("y", function(d, i){ if(i>=2){ return height / 2 + 90; } return height / 2 + 15;})
   .attr("x", function(d, i) { if(i == 0 || i == 2) return 50; return 150;})
   .text(function(d){ return d.party; });

}

// mostra a tooltip quando o cursor passar por algum estado
function mouseover() {
   div.style("display", "inline");
}

// esconde a tooltip quando o cursor não estiver em nenhum estado
function mouseout() {
   div.style("display", "none");
}

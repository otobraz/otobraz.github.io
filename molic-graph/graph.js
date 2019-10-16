var width = window.innerWidth,     // svg width
height = window.innerHeight - 100,     // svg height
dr = 4,      // default point radius
off = 15,    // cluster hull offset
expand = {}, // expanded clusters
data, net, force, hullg, hull, linkg, link, nodeg, node;

var curve = d3.svg.line()
.interpolate("cardinal-closed")
.tension(.85);

// adiciona div para o tool-tip
var div = d3.select("body").append("div")
   .attr("class", "tooltip")
   .style("display", "none");

var fill = d3.scale.category20();
// var fill = d3.scale.linear()
// .domain(1,30)
// .range(["#1b70fc", "#faff16", "#d50527", "#158940", "#f898fd", "#24c9d7", "#cb9b64", "#866888", "#22e67a", "#ea42fe", "#9dabfa", "#437e8a", "#b21bff", "#ff7b91", "#94aa05", "#ac5906", "#82a68d", "#ff0000", "#7a7352", "#f9bc0f", "#b65d66", "#07a2e6", "#c091ae", "#8a91a7", "#88fc07", "#1b70fc", "#9e8010", "#10b437", "#c281fe", "#f92b75"]);
var count = 0;

// var colors = [
// "#ffffff", "#ffffff", "#ffffff", "#bbbb20", "#ffffff", "#6aa2a9", "#ffffff", "#222222", "#ffffff", "#ffffff",
// "#9dabfa", "#437e8a", "#ffffff", "#ff7463", "#ffffff", "#25b3a7", "#b07270", "#ff0000", "#7a7352", "#FFA500",
// "#ffffff", "#ffffff", "#c091ae", "#cb9b64", "#BBfc07", "#1d960c", "#55ff5c", "#8a91a7", "#94aa05", "#ffffff",
// "#ffffff", "#1b70fc", "#82a68d", "#ffffff", "#ffffff", "#ffffff", "#ffff00", "#ffffff", "#d24506", "#f92b75",
// "#8bf0fc", "#f5bbf5", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#698ffc", "#678275", "#c5a121",
// "#bb59d8", "#ffffff"
// ];

var colors = [
   "#454545", "#454545", "#808000", "#454545", "#aaaaaa", "#454545", "#cbcfff", "#454545", "#454545", "#aaaaaa",
   "#aaaaaa", "#454545", "#9A6324", "#454545", "#bfef45", "#000075", "#ff0000", "#aaaaaa", "#e1c699", "#454545",
   "#454545", "#aaaaaa", "#469990", "#f5bbf5", "#1d960c", "#800000", "#aaaaaa", "#aaaaaa", "#454545", "#454545",
   "#1b70fc", "#42d4f4", "#454545", "#aaaaaa", "#454545", "#f58231", "#454545", "#f032e6", "#ffe119", "#911eb4",
   "#ff7463", "#454545", "#454545", "#454545", "#454545", "#454545", "#aaaaaa", "#aaaaaa", "#aaaaaa", "#aaffc3",
   "#454545", "#454545", "#454545"
];

var color1 = "#454545";
var color2 = "#aaaaaa";

// #07c99d #faff16 #b21bff #ee534e #6ed014 #94aa05 #07a2e6 #22e67a

// "#d24506", "#59c3fa", "#ca7b0a", "#6f7385", "#9a634a", "#48aa6f", "#ad9ad0", "#d7908c", "#6a8a53", "#8c46fc", "#8f5ab8", "#fd1105", "#7ea7cf", "#d77cd1", "#a9804b", "#0688b4", "#6a9f3e", "#ee8fba", "#a67389", "#9e8cfe", "#bd443c", "#6d63ff", "#d110d5", "#798cc3", "#df5f83", "#b1b853", "#bb59d8", "#1d960c", "#867ba8", "#18acc9", "#25b3a7", "#f3db1d", "#938c6d", "#936a24", "#a964fb", "#92e460", "#a05787", "#9c87a0", "#20c773", "#8b696d", "#78762d", "#e154c6", "#40835f", "#d73656", "#1afd5c", "#c4f546", "#3d88d8", "#bd3896", "#1397a3", "#f940a5", "#66aeff", "#d097e7", "#fe6ef9", "#d86507", "#8b900a", "#d47270", "#e8ac48", "#cf7c97", "#cebb11", "#718a90", "#e78139", "#ff7463", "#bea1fd"

function noop() { return false; }

function nodeid(n) {
   return n.size ? "_g_"+n.group : n.name;
}

function linkid(l) {
   var u = nodeid(l.source),
   v = nodeid(l.target);
   return u<v ? u+"|"+v : v+"|"+u;
}

function getGroup(n) { return n.group; }

// constructs the network to visualize
function network(data, prev, index, expand) {
   expand = expand || {};
   var gm = {},    // group map
   nm = {},    // node map
   lm = {},    // link map
   gn = {},    // previous group nodes
   gc = {},    // previous group centroids
   nodes = [], // output nodes
   links = []; // output links

   // process previous nodes for reuse or centroid calculation
   if (prev) {
      prev.nodes.forEach(function(n) {
         var i = index(n), o;
         if (n.size > 0) {
            gn[i] = n;
            n.size = 0;
         } else {
            o = gc[i] || (gc[i] = {x:0,y:0,count:0});
            o.x += n.x;
            o.y += n.y;
            o.count += 1;
         }
      });
   }

   // determine nodes
   for (var k=0; k<data.nodes.length; ++k) {
      var n = data.nodes[k],
      i = index(n),
      l = gm[i] || (gm[i]=gn[i]) || (gm[i]={group:i, size:0, nodes:[]});

      if (expand[i]) {
         // the node should be directly visible
         nm[n.name] = nodes.length;
         nodes.push(n);
         if (gn[i]) {
            // place new nodes at cluster location (plus jitter)
            n.x = gn[i].x + Math.random();
            n.y = gn[i].y + Math.random();
         }
      } else {
         // the node is part of a collapsed cluster
         if (l.size == 0) {
            // if new cluster, add to set and position at centroid of leaf nodes
            nm[i] = nodes.length;
            nodes.push(l);
            if (gc[i]) {
               l.x = gc[i].x / gc[i].count;
               l.y = gc[i].y / gc[i].count;
            }
         }
         l.nodes.push(n);
      }
      // always count group size as we also use it to tweak the force graph strengths/distances
      l.size += 1;
      n.group_data = l;
   }

   for (i in gm) { gm[i].link_count = 0; }

   // determine links
   for (k=0; k<data.links.length; ++k) {
      var e = data.links[k],
      u = index(e.source),
      v = index(e.target);
      if (u != v) {
         gm[u].link_count++;
         gm[v].link_count++;
      }
      u = expand[u] ? nm[e.source.name] : nm[u];
      v = expand[v] ? nm[e.target.name] : nm[v];
      var i = (u<v ? u+"|"+v : v+"|"+u),
      l = lm[i] || (lm[i] = {source:u, target:v, size:0});
      l.size += 1;
   }
   for (i in lm) { links.push(lm[i]); }
   return {nodes: nodes, links: links};
}

// function convexHulls(nodes, index, offset) {
//    var hulls = {};
//
//    // create point sets
//    for (var k=0; k<nodes.length; ++k) {
//       var n = nodes[k];
//       if (n.size) continue;
//       var i = index(n),
//       l = hulls[i] || (hulls[i] = []);
//       l.push([n.x-offset, n.y-offset]);
//       l.push([n.x-offset, n.y+offset]);
//       l.push([n.x+offset, n.y-offset]);
//       l.push([n.x+offset, n.y+offset]);
//    }
//
//    // create convex hulls
//    var hullset = [];
//    for (i in hulls) {
//       hullset.push({group: i, path: d3.geom.hull(hulls[i])});
//    }
//
//    return hullset;
// }

function drawCluster(d) {
   return curve(d.path); // 0.8
}

// --------------------------------------------------------

// var body = d3.select("body");

var vis = d3.select(".graph").append("svg")
.attr("width", width)
.attr("height", height);

var institutions;
var edges;
var nodes = {};
var groups = {};
var duplicatedAuthors = [3, 29, 86, 93];
var count = 0;
var expanded = false;
var gravity = 0.4, charge = -height - 1000, friction = 0.5;

// d3.csv("data/cinstitutions.csv", function(error, data) {
//    institutions = data;
// });
//
// d3.csv("data/cedges.csv", function(error, data) {
//    edges = data;
// });
//
// d3.json("data/cnodes.json", function(json) {
//    data = json;

queue()
   .defer(d3.csv, "data/cinstitutions.csv")
   .defer(d3.csv, "data/cedges.csv")
   .defer(d3.json, "data/cnodes.json")
   .awaitAll(ready);

// d3.csv("data/cinstitutions.csv", function(error, data) {
//    institutions = data;
// });
//
// d3.csv("data/cedges.csv", function(error, data) {
//    edges = data;
// });

// d3.json("data/cnodes.json", function(json) {

function ready(error, output){
   institutions = output[0];
   edges = output[1];
   data = output[2];

   // convert Nodes to a dictionary
   data.nodes.forEach(function(node){
      nodes[node.name] = {"id": node.id, "group": node.group};
   });

   // add edges to data
   edges.forEach(function(edge){
      Object.keys(edge).forEach(function(key) {
         index = Object.keys(edge).indexOf(key);
         for(i = index+1; i < 8; i++){
            var key2 = Object.keys(edge)[i];
            if(edge[key2] != ""){
               data.links.push({
                  "source": nodes[edge[key]].id,
                  "target": nodes[edge[key2]].id,
                  "value": 1
               });
            }else{
               break;
            }
         }
      });
   });

   for (var i=0; i<data.links.length; ++i) {
      o = data.links[i];
      o.source = data.nodes[o.source];
      o.target = data.nodes[o.target];
   }

   linkg = vis.append("g").attr("transform", "translate(-200,0)")
   nodeg = vis.append("g").attr("transform", "translate(-200,0)")

   init();

   vis.attr("opacity", 1e-6)
   .transition()
   .duration(1000)
   .attr("opacity", 1);
}

function init() {
   if (force) force.stop();
   net = network(data, net, getGroup, expand);
   // for(i = 0; i < expand.length; i++){
   //    expand[i] = true;
   // }
   force = d3.layout.force()
   .nodes(net.nodes)
   .links(net.links)
   .size([width, height])
   .linkDistance(function(l, i) {
      var n1 = l.source, n2 = l.target;
      // larger distance for bigger groups:
      // both between single nodes and _other_ groups (where size of own node group still counts),
      // and between two group nodes.
      //
      // reduce distance for groups with very few outer links,
      // again both in expanded and grouped form, i.e. between individual nodes of a group and
      // nodes of another group or other group node or between two group nodes.
      //
      // The latter was done to keep the single-link groups ('blue', rose, ...) close.
      return 30 +
      Math.min(20 * Math.min((n1.size || (n1.group != n2.group ? n1.group_data.size : 0)),
      (n2.size || (n1.group != n2.group ? n2.group_data.size : 0))),
      -30 +
      30 * Math.min((n1.link_count || (n1.group != n2.group ? n1.group_data.link_count : 0)),
      (n2.link_count || (n1.group != n2.group ? n2.group_data.link_count : 0))),
      100);
      //return 150;
   })
   .linkStrength(function(l, i) {
      return 1;
   })
   .gravity(gravity)   // gravity+charge tweaked to ensure good 'grouped' view (e.g. green group not smack between blue&orange, ...
      .charge(charge)    // ... charge is important to turn single-linked groups to the outside
      .friction(friction)   // friction adjusted to get dampened display: less bouncy bouncy ball [Swedish Chef, anyone?]
      .start();

      link = linkg.selectAll("line.link").data(net.links, linkid);
      link.exit().remove();
      link.enter().append("line")
      .attr("class", "link")
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; })
      .style("stroke-width", function(d) { return 1; });

      node = nodeg.selectAll("circle.node").data(net.nodes, nodeid);
      node.exit().remove();

      node.enter().append("circle")
      // if (d.size) -- d.size > 0 when d is a group node.
      .attr("class", function(d) { return "node" + (d.size?"":" leaf"); })
      .attr("r", function(d) { return d.size ? (d.size + dr) * 1.2 : 12; })
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .style("fill", function(d) {
         return colors[d.group-1];
      })
      .on("mouseover", mouseover)            // adiciona o comportamento "mouseover"
      .on("mousemove", function(d, i){  // define comportamento "mousemove" (tooltip segue o mouse)
         var maxValue = Math.max(getTextWidth(institutions[d.group-1].institution), getTextWidth(d.name));
         div
            .html(d.size ? institutions[d.group-1].institution + "</br>" + d.size + (d.size > 1 ? " autores":" autor") : d.name + "<br>" + institutions[d.group-1].institution)
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY) + "px")
            .style("width", function(){
               if(maxValue < 110){
                  return "150px";
               }else{
                  return (maxValue + 70) + "px";
               }
            });
      })
      .on("mouseout", mouseout)
      .on("click", function(d) {
         for(i = 1; i <= node.size(); i++){
            expand[i] = !expand[i];
         }
         if (d3.event.defaultPrevented) return; // dragged
         expanded = !expanded;
         if(expanded){
            gravity = 0.7;
            charge = -height - 300;
            friction = 0.5;
         }else{
            gravity = 0.4;
            charge = -height - 1000;
            friction = 0.5;
         }
         init();
         node.style("fill", function(g) {
            return colors[g.group-1];
         }).style("stroke", function(g) {
            switch(g.id){
               case 155:
                  return colors[35];
                  break;
               case 3:
                  return colors[52];
                  break;
               case 156:
                  return colors[27];
                  break;
               case 29:
                  return colors[31];
                  break;
               case 157:
                  return colors[39];
                  break;
               case 86:
                  return colors[33];
                  break;
               case 158:
                  return colors[44];
                  break;
               case 93:
                  return colors[35];
                  break;
            }
            return "#222";
            // var duplicatedAuthors = [3, 29, 86, 93];
         }).style("stroke-width", function(g){
            if(g.id >= 155 || duplicatedAuthors.includes(g.id)){
               return "5px";
            }
         })
      });

      node.call(force.drag);

      force.on("tick", function() {
         // if (!hull.empty()) {
         //    hull.data(convexHulls(net.nodes, getGroup, off))
         //    .attr("d", drawCluster);
         // }

         link.attr("x1", function(d) { return d.source.x; })
         .attr("y1", function(d) { return d.source.y; })
         .attr("x2", function(d) { return d.target.x; })
         .attr("y2", function(d) { return d.target.y; });

         node.attr("cx", function(d) { return d.x; })
         .attr("cy", function(d) { return d.y; });
      });

      var rectX = window.innerWidth / 1.5;
      var rectW = 25, rectH = 25;
      var rectHeightTotal = 21 * rectH;
      var rectGap = (height - rectHeightTotal) / 22 + rectH;

      var textX = rectX+30, textY1 = rectGap-rectH+18, textY2 = rectGap;

      filteredNodes = net.nodes.filter(function(d){ return d.size > 2;})
      .sort(function(x, y){ return +x.size < +y.size ? 1 : -1;});;

      vis.selectAll("rect")
      .data(filteredNodes).enter()
      .append("rect")
      .attr("x",rectX)
      .attr("y", function(d,i){ return rectGap-rectH + i*rectGap;})
      .attr("width", rectW).attr("height", rectH)
      .style("stroke", "#222")
      .attr("rx", 2).attr("ry", 2)
      .style("fill", function(d){
         return colors[d.group-1];
      });

      vis.append("rect").attr("x",rectX).attr("y", rectGap-rectH + rectGap*19).attr("width", 25).attr("height", 25).attr("rx", 2).attr("ry", 2)
      .style("stroke", "#222").style("fill", color2);

      vis.append("rect").attr("x",rectX).attr("y", rectGap-rectH + rectGap*20).attr("width", 25).attr("height", 25).attr("rx", 2).attr("ry", 2)
      .style("stroke", "#222").style("fill", color1);

      vis.selectAll("text")
      .data(filteredNodes).enter()
      .append("text")
      .attr("x",textX)
      .attr("y", function(d,i){ return textY1 + i*textY2;})
      .style("font-size", "18px")
      .attr("alignment-baseline","middle")
      .text(function(d){
         return institutions[d.group-1].institution + " (" + d.size + " autores)";
      });

      vis.append("text").attr("x", textX).attr("y", textY1 + textY2*19).text("Instituições com 2 autores").style("font-size", "18px").attr("alignment-baseline","middle");
      vis.append("text").attr("x", textX).attr("y", textY1 + textY2*20).text("Instituições com 1 autor").style("font-size", "18px").attr("alignment-baseline","middle");
   }

   // mostra a tooltip quando o cursor passar por algum estado
   function mouseover() {
      div.style("display", "inline");

   }

   // esconde a tooltip quando o cursor não estiver em nenhum estado
   function mouseout() {
      div.style("display", "none");
   }

function getTextWidth(text, font) {
    // re-use canvas object for better performance
    var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    var context = canvas.getContext("2d");
    context.font = font;
    var metrics = context.measureText(text);
    return metrics.width;
}

function returnMax(a, b){
   if(a > b)
      return a;
   return b;
}

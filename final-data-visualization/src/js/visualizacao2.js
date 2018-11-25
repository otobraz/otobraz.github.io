let colunaAliados;
let colunaInimigos;
let colunaPaises;

let aux;
let auxNode;

let quant = document.querySelector('#quantElementos').value;
let normaliza = document.querySelector('#checkboxNormaliza').checked;
let string = "";
let chart1;

window.onload = visPadrao;

document.addEventListener('DOMContentLoaded', function() {
  document.querySelector('#search-input').onkeyup = function (e){
    string = e.target.value;
    visFiltro(quant, string);
  }
}, false);

document.addEventListener('DOMContentLoaded', function() {
  document.querySelector('#checkboxEmpilhado').onchange = atualizaGrupo;
}, false);

document.querySelector('#quantElementos').addEventListener('change', function(e) {
  quant = e.target.value;
  visFiltro(quant, string);
}, false);

document.querySelector('#checkboxNormaliza').addEventListener('change', function(e) {
  normaliza = e.target.checked;
  visFiltro(quant, string);
}, false);

function visPadrao(){

  colunaAliados = ['Allies'];
  colunaInimigos = ['Enemies'];
  colunaPaises = [];

  aux = [];
  auxNode = null;

  for (let i = 0; i < aliados.length; i++){
    let e = 0;
    for (let j = 0; j < inimigos.length; j++){
      if (aliados[i].ID === inimigos[j].ID){
        e = inimigos[j].Enemies;
        break;
      }
    }
    if (normaliza){
      labelMsg = 'Percentage';
      auxNode = {
        "ID": aliados[i].ID,
        "Allies": 100 * (Number(aliados[i].Allies) / (Number(aliados[i].Allies) + Number(e))),
        "Enemies": 100 * (Number(e) / (Number(aliados[i].Allies) + Number(e))),
        "Tag": aliados[i].Tag,
        "Total": Number(e) + Number(aliados[i].Allies)
      }
    } else {
      labelMsg = 'Number of relations';
      auxNode = {
        "ID": aliados[i].ID,
        "Allies": Number(aliados[i].Allies),
        "Enemies": Number(e),
        "Tag": aliados[i].Tag,
        "Total": Number(e) + Number(aliados[i].Allies)
      }
    }
    aux.push(auxNode);
  }

  aux = ordena(aux);

  let max = Math.min(aux.length, quant);

  for (let i = 0; i < max; i++){
    colunaAliados.push(aux[i].Allies);
    colunaInimigos.push(aux[i].Enemies);
    colunaPaises.push(aux[i].ID);
  }

  if (normaliza){
    desenhaAgrupadoNormalizado();
    ajustaLimiteEixo();
  } else {
    desenhaAgrupado();
    ajustaLimiteEixo();
  }

};

function visFiltro(quantidade, pais){

  //let pais = e.target.value;

  colunaAliados = ['Allies'];
  colunaInimigos = ['Enemies'];
  colunaPaises = [];

  aux = [];
  auxNode = null;

  aux = preencheAux(pais);
  aux = ordena(aux);

  let max = Math.min(aux.length, quantidade);

  for (let i = 0; i < max; i++){
    colunaAliados.push(aux[i].Allies);
    colunaInimigos.push(aux[i].Enemies);
    colunaPaises.push(aux[i].ID);
  }

  let agrupado = document.querySelector('#checkboxEmpilhado').checked;
  if (agrupado){
    if (normaliza){
      desenhaAgrupadoNormalizado();
    } else {
      desenhaAgrupado();
    }
    ajustaLimiteEixo();
  } else {
    if (normaliza){
      desenhaSeparadoNormalizado();
    } else {
      desenhaSeparado();
    }
    ajustaLimiteEixo();
  }


};

function ordena(vetor){
  // Ordena pela quantidade de relacionamentos
  vetor.sort(function (a, b) {
    if (Number(a.Total) < Number(b.Total)) { return 1; }
    if (Number(a.Total) > Number(b.Total)) { return -1; }
    return 0;
  });
  return vetor;
}

function preencheAux(pais){
  let vetor = [];
  for (let i = 0; i < aliados.length; i++){
    let e = 0;
    if (aliados[i].ID.toLowerCase().includes(pais.toLowerCase())){
      for (let j = 0; j < inimigos.length; j++){
        if (aliados[i].ID === inimigos[j].ID){
          e = inimigos[j].Enemies;
          break;
        }
      }
      if (normaliza){
        labelMsg = 'Percentage';
        auxNode = {
          "ID": aliados[i].ID,
          "Allies": 100 * (Number(aliados[i].Allies) / (Number(aliados[i].Allies) + Number(e))),
          "Enemies": 100 * (Number(e) / (Number(aliados[i].Allies) + Number(e))),
          "Tag": aliados[i].Tag,
          "Total": Number(e) + Number(aliados[i].Allies)
        }
      } else {
        labelMsg = 'Number of relations';
        auxNode = {
          "ID": aliados[i].ID,
          "Allies": Number(aliados[i].Allies),
          "Enemies": Number(e),
          "Tag": aliados[i].Tag,
          "Total": Number(e) + Number(aliados[i].Allies)
        }
      }
      vetor.push(auxNode);
    }
  }
  return vetor;
}

function atualizaGrupo(e){
  let chart = document.querySelector('#visualizacao1');
  console.log(e.target.checked);
  if (e.target.checked){
    if (normaliza){
      desenhaAgrupadoNormalizado();
    } else {
      desenhaAgrupado();
    }
    ajustaLimiteEixo();
  } else {
    if (normaliza){
      desenhaSeparadoNormalizado();
    } else {
      desenhaSeparado();
    }
    ajustaLimiteEixo();
  }
}

function ajustaLimiteEixo(){
  if (normaliza){
    chart1.axis.max({y: 91});
  }
}

function desenhaAgrupado(){
  // Desenha a visualização
  chart1 = c3.generate({
    // Determina onde desenhar
    bindto: '#visualizacao1',
    // Define os dados que serão exibidos
    data: {
      // Colunas / séries de dados: [nomeDaSerie, valor1, valor2, ..., valorN]
      columns: [
        colunaAliados,
        colunaInimigos
      ],
      // Tipo de série (nomeDaSerie: tipo)
      type: 'bar',
      groups: [
        [
          colunaAliados[0],
          colunaInimigos[0]
        ]
      ]
    },
    // Define as cores
    color: {
      pattern: ['#2166ac', '#ca0020']
    },
    // Define se a legenda deve ser exibida e onde deve ser posicionada
    legend: {
      show: true,
      position: 'right'
    },
    // Informações sobre os eixos
    axis : {
      // O eixo x terá o nome dos candidatos como categorias e os nomes dos
      // candidatos podem estar quebrados em mais de uma linha
      x: {
        type: 'category',
        categories: colunaPaises,
        tick: {
          multiline: true
        },
        height: 80
      },
      y: {
        // Foi escolhido um texto e uma posição para o label do eixo y
        label: {
          text: labelMsg,
          position: 'outer-middle'
        }
      },
      rotated: true
    },
    // Definição da largura das barras (de diferença de votos)
    bar: {
      width: {
        ratio: 0.4
      }
    },
    // Customização da informação exibida ao passar o mouse sobre a visualização
    tooltip: {
      show: true
    }
  });
}

function desenhaAgrupadoNormalizado(){
  // Desenha a visualização
  chart1 = c3.generate({
    // Determina onde desenhar
    bindto: '#visualizacao1',
    // Define os dados que serão exibidos
    data: {
      // Colunas / séries de dados: [nomeDaSerie, valor1, valor2, ..., valorN]
      columns: [
        colunaAliados,
        colunaInimigos
      ],
      // Tipo de série (nomeDaSerie: tipo)
      type: 'bar',
      groups: [
        [
          colunaAliados[0],
          colunaInimigos[0]
        ]
      ]
    },
    // Define as cores
    color: {
      pattern: ['#2166ac', '#ca0020']
    },
    // Define se a legenda deve ser exibida e onde deve ser posicionada
    legend: {
      show: true,
      position: 'right'
    },
    // Informações sobre os eixos
    axis : {
      // O eixo x terá o nome dos candidatos como categorias e os nomes dos
      // candidatos podem estar quebrados em mais de uma linha
      x: {
        type: 'category',
        categories: colunaPaises,
        tick: {
          multiline: true
        },
        height: 80
      },
      y: {
        // Foi escolhido um texto e uma posição para o label do eixo y
        label: {
          text: labelMsg,
          position: 'outer-middle'
        }
      },
      rotated: true
    },
    // Definição da largura das barras (de diferença de votos)
    bar: {
      width: {
        ratio: 0.4
      }
    },
    // Customização da informação exibida ao passar o mouse sobre a visualização
    tooltip: {
      show: true,
      format: {
        value: function (value) {
          let f = d3.format('.1f');
          return (f(value) + '%');
        }
      }
    }
  });
}

function desenhaSeparado(){
  // Desenha a visualização
  chart1 = c3.generate({
    // Determina onde desenhar
    bindto: '#visualizacao1',
    // Define os dados que serão exibidos
    data: {
      // Colunas / séries de dados: [nomeDaSerie, valor1, valor2, ..., valorN]
      columns: [
        colunaAliados,
        colunaInimigos
      ],
      // Tipo de série (nomeDaSerie: tipo)
      type: 'bar'
    },
    // Oculta linhas verticais (grid)
    grid: {
      y: {
        show: false
      }
    },
    // Define as cores
    color: {
      pattern: ['#2166ac', '#ca0020']
    },
    // Define se a legenda deve ser exibida e onde deve ser posicionada
    legend: {
      show: true,
      position: 'right'
    },
    // Informações sobre os eixos
    axis : {
      // O eixo x terá o nome dos candidatos como categorias e os nomes dos
      // candidatos podem estar quebrados em mais de uma linha
      x: {
        type: 'category',
        categories: colunaPaises,
        tick: {
          multiline: true
        },
        height: 80
      },
      y: {
        // Foi escolhido um texto e uma posição para o label do eixo y
        label: {
          text: labelMsg,
          position: 'outer-middle'
        }
      },
      rotated: true
    },
    // Definição da largura das barras (de diferença de votos)
    bar: {
      width: {
        ratio: 0.4
      }
    },
    // Customização da informação exibida ao passar o mouse sobre a visualização
    tooltip: {
      show: true
    }
  });
}

function desenhaSeparadoNormalizado(){
  // Desenha a visualização
  chart1 = c3.generate({
    // Determina onde desenhar
    bindto: '#visualizacao1',
    // Define os dados que serão exibidos
    data: {
      // Colunas / séries de dados: [nomeDaSerie, valor1, valor2, ..., valorN]
      columns: [
        colunaAliados,
        colunaInimigos
      ],
      // Tipo de série (nomeDaSerie: tipo)
      type: 'bar'
    },
    // Oculta linhas verticais (grid)
    grid: {
      y: {
        show: false
      }
    },
    // Define as cores
    color: {
      pattern: ['#2166ac', '#ca0020']
    },
    // Define se a legenda deve ser exibida e onde deve ser posicionada
    legend: {
      show: true,
      position: 'right'
    },
    // Informações sobre os eixos
    axis : {
      // O eixo x terá o nome dos candidatos como categorias e os nomes dos
      // candidatos podem estar quebrados em mais de uma linha
      x: {
        type: 'category',
        categories: colunaPaises,
        tick: {
          multiline: true
        },
        height: 80
      },
      y: {
        // Foi escolhido um texto e uma posição para o label do eixo y
        label: {
          text: labelMsg,
          position: 'outer-middle'
        }
      },
      rotated: true
    },
    // Definição da largura das barras (de diferença de votos)
    bar: {
      width: {
        ratio: 0.4
      }
    },
    // Customização da informação exibida ao passar o mouse sobre a visualização
    tooltip: {
      show: true,
      format: {
        value: function (value) {
          let f = d3.format('.1f');
          return (f(value) + '%');
        }
      }
    }
  });
}

let duracaoConflitos = ['Duration'];
let quantidadePaises = ['Number of countries'];
let nomesConflitos = [];

let quant = document.querySelector('#quantElementos').value;

document.querySelector('#quantElementos').addEventListener('change', function(e) {
  if (document.querySelector('#information-duration').value){
    document.querySelector('h2').innerText
      = "Longest Wars";
    rankingDuracao(e.target.value);
  } else {
    document.querySelector('h2').innerText
      = "Wars with most Participant Countries";
    rankingPaises(e.target.value);
  }
}, false);

document.querySelector('#information-duration').addEventListener('change', function(e) {
  if (e.target.checked){
    document.querySelector('h2').innerText
      = "Longest Wars";
    rankingDuracao(document.querySelector('#quantElementos').value);
  }
}, false);

document.querySelector('#information-country').addEventListener('change', function(e) {
  if (e.target.checked){
    document.querySelector('h2').innerText
      = "Wars with most Participant Countries";
    rankingPaises(document.querySelector('#quantElementos').value);
  }
}, false);

window.onload = rankingDuracao(quant);
document.querySelector('h2').innerText = "Longest Wars";

function rankingDuracao(quantidade){

  duracaoConflitos = ['Duration'];
  nomesConflitos = [];

  let dataFim;
  let dataInicio;

  let novoVetor = [];
  let aux = null;

  for (let i = 0; i < edges.length; i++){
    dataInicio = Number(edges[i].start);
    if (edges[i].end == "Ongoing"){
      dataFim = 2018;
    } else {
      dataFim = edges[i].end;
    }
    let d = Number(dataFim) - dataInicio;
    aux = {
      "nomeConflito": edges[i].conflict,
      "duracao": d
    }
    novoVetor.push(aux);
  }

  novoVetor = ordenaDuracao(novoVetor);
  novoVetor = agrupaConflitos(novoVetor);

  let max = Math.min(quantidade, novoVetor.length);

  for (let i = 0; i < quantidade; i++){
    duracaoConflitos.push(novoVetor[i].duracao);
    nomesConflitos.push(novoVetor[i].nomeConflito);
  }

  desenhaDuracao();

}

function rankingPaises(quantidade){

  quantidadePaises = ['Number of countries'];
  nomesConflitos = [];

  let novoVetor = [];
  let aux = null;

  for (let i = 0; i < edges.length; i++){
    let index = nomesConflitos.indexOf(edges[i].conflict);
    if (index == -1){
      aux = {
        conflict: edges[i].conflict,
        total: 2,
        paises: [edges[i].source_id, edges[i].target_id]
      };
      nomesConflitos.push(edges[i].conflict);
      novoVetor.push(aux);
    } else {
      let dif = 0;
      let indexAux = novoVetor[index].paises.indexOf(edges[i].source_id);
      if (indexAux == -1){
        novoVetor[index].total += 1;
        novoVetor[index].paises.push(edges[i].source_id);
      }
      indexAux = novoVetor[index].paises.indexOf(edges[i].target_id);
      if (indexAux == -1){
        novoVetor[index].total += 1;
        novoVetor[index].paises.push(edges[i].target_id);
      }
    }
  }

  novoVetor = ordenaPaises(novoVetor);

  let max = Math.min(quantidade, novoVetor.length);

  nomesConflitos = [];
  for (let i = 0; i < quantidade; i++){
    quantidadePaises.push(novoVetor[i].total);
    nomesConflitos.push(novoVetor[i].conflict);
    //console.log("Conflito: ");
    //console.log(novoVetor[i].conflict + ': ' + novoVetor[i].total);
    //console.log("Países: ");
    //console.log(novoVetor[i].paises);
  }

  desenhaPaises();

}

function agrupaConflitos(vetor){

  let conflitos = [];

  let aux = {
    duracao: vetor[0].duracao,
    nomeConflito: vetor[0].nomeConflito
  };

  conflitos.push(aux);

  let repetido = false;
  for (let i = 1; i < vetor.length; i++){
    aux = null;
    repetido = false;
    for (let j = 0; j < conflitos.length; j++){
      if (vetor[i].nomeConflito == conflitos[j].nomeConflito){
        repetido = true;
      }
    }
    if (!repetido){
      aux = {
        duracao: vetor[i].duracao,
        nomeConflito: vetor[i].nomeConflito
      };
      conflitos.push(aux);
    }
  }

  return conflitos;

}

function ordenaDuracao(vetor){
  // Ordena pelo tempo de duração do conflito
  vetor.sort(function (a, b) {
    if (Number(a.duracao) < Number(b.duracao)) { return 1; }
    if (Number(a.duracao) > Number(b.duracao)) { return -1; }
    return 0;
  });
  return vetor;
}

function ordenaPaises(vetor){
  // Ordena pela quantidade de países envolvidos
  vetor.sort(function (a, b) {
    if (Number(a.total) < Number(b.total)) { return 1; }
    if (Number(a.total) > Number(b.total)) { return -1; }
    return 0;
  });
  return vetor;
}

function desenhaDuracao(){
  // Desenha a visualização
  let chart1 = c3.generate({
    // Determina onde desenhar
    bindto: '#visualizacao2',
    // Define os dados que serão exibidos
    data: {
      // Colunas / séries de dados: [nomeDaSerie, valor1, valor2, ..., valorN]
      columns: [
        duracaoConflitos
      ],
      // Tipo de série (nomeDaSerie: tipo)
      type: 'bar'
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
        categories: nomesConflitos,
        tick: {
          multiline: true
        }
      },
      y: {
        // Foi escolhido um texto e uma posição para o label do eixo y
        label: {
          text: 'Duration (in years)',
          position: 'outer-middle'
        }
      },
      rotated: true
    },
    // Definição da largura das barras (de diferença de votos)
    bar: {
      width: {
        ratio: 0.7
      }
    },
    // Customização da informação exibida ao passar o mouse sobre a visualização
    tooltip: {
      show: true,
      format: {
        value: function (value) {
          return (value + ' years');
        }
      }
    }
  });

}

function desenhaPaises(){
  // Desenha a visualização
  let chart1 = c3.generate({
    // Determina onde desenhar
    bindto: '#visualizacao2',
    // Define os dados que serão exibidos
    data: {
      // Colunas / séries de dados: [nomeDaSerie, valor1, valor2, ..., valorN]
      columns: [
        quantidadePaises
      ],
      // Tipo de série (nomeDaSerie: tipo)
      type: 'bar'
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
        categories: nomesConflitos,
        tick: {
          multiline: true
        }
      },
      y: {
        // Foi escolhido um texto e uma posição para o label do eixo y
        label: {
          text: 'Number of countries',
          position: 'outer-middle'
        }
      },
      rotated: true
    },
    // Definição da largura das barras (de diferença de votos)
    bar: {
      width: {
        ratio: 0.7
      }
    },
    // Customização da informação exibida ao passar o mouse sobre a visualização
    tooltip: {
      show: true,
      format: {
        value: function (value) {
          return (value);
        }
      }
    }
  });

}

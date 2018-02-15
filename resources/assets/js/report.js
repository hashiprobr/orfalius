var convert = function(grade) {
  switch(grade) {
    case 'A+':
      return 100;
    case 'A':
      return 90;
    case 'B+':
      return 80;
    case 'B':
      return 70;
    case 'C+':
      return 60;
    case 'C':
      return 50;
    case 'D':
      return 25;
    case 'I':
      return 0;
  }
};

var meanFromLetters = function(grades) {
  var sum = 0;

  for(var grade of grades) {
    sum += convert(grade);
  }

  return sum / grades.length;
};


var meanAtLeast45 = {
  name: 'Média',
  check: function(grades) {
    var mean = meanFromLetters(grades);

    return [mean, mean >= 45];
  },
};


var build_report = function(schema, raw) {
  var grade;
  var grades;

  var sum = 0;
  var num = 0;

  var result;
  var className;

  var subtags;
  var tags = ['<h2>Situação em cada objetivo</h2><p>Se uma linha estiver vermelha, o objetivo não foi atingido. Para aprovação nesta disciplina, <strong>nenhuma linha pode estar vermelha no final do semestre</strong>.</p>'];

  for(var code in schema.goals) {
    var goal = schema.goals[code];

    grades = [];

    subtags = [];
    tags.push('<p><em>' + goal.name + '</em></p>');

    for(var instrument in goal.weights) {
      var weight = goal.weights[instrument];

      grade = raw[instrument][code];
      grades.push(grade);

      sum += convert(grade) * weight;
      num += weight;

      subtags.push('<li>' + instrument + ': ' + grade + '</li>');
    }

    result = schema.condition.check(grades);
    className = result[1] ? 'positive' : 'negative';

    subtags.push('<li class="' + className + '">' + schema.condition.name + ': ' + result[0] + '</li>');
    tags.push('<ul>' + subtags.join('') + '</ul>');
  }

  tags.push('<h2>Situação no conjunto de objetivos</h2><p>Se a linha estiver vermelha, o desempenho mínimo não foi atingido. Para aprovação nesta disciplina, <strong>a linha não pode estar vermelha no final do semestre</strong>.</p>');

  result = sum / num;
  className = result >= 45 ? 'positive' : 'negative';

  tags.push('<ul><li class="' + className + '">Média Parcial: ' + result + '</li></ul><p>A Média Parcial é uma média ponderada de todos os instrumentos. Para saber qual é o peso de cada um, basta <a href="matriz.pdf">baixar a matriz</a>.</p>');

  var partial_mean = result;

  tags.push('<h2>Bônus em caso de aprovação</h2><p>Os conceitos e médias abaixo são ignorados se alguma linha acima estiver vermelha.</p>');

  sum = 0;
  num = 0;

  for(var instrument in schema.bonus) {
    var weight = schema.bonus[instrument];

    grades = [];

    subtags = [];
    tags.push('<p><em>' + instrument + '</em></p>');

    for(var piece in raw[instrument]) {
      grade = raw[instrument][piece];
      grades.push(grade);

      subtags.push('<li>' + piece + ': ' + grade + '</li>');
    }

    result = meanFromLetters(grades);

    sum += result * weight;
    num += weight;

    subtags.push('<li class="highlight">Média: ' + result + ' (peso ' + weight + '%)</li>');
    tags.push('<ul>' + subtags.join('') + '</ul>');
  }

  tags.push('<h2>Nota que será registrada no Blackboard</h2><p>Se alguma linha acima estiver vermelha, o bônus é ignorado e a Média Final é o menor valor dentre 4.0 e a Média Parcial. Caso contrário, a Média Final é o maior valor dentre 5.0 e uma média ponderada da Média Parcial (peso 90%) e do bônus (pesos acima).</p>');

  var weight = 90;

  sum += partial_mean * weight;
  num += weight;

  tags.push('<ul><li class="highlight">Média Final: ' + result + '</li></ul>');

  return tags.join('');
};


var print_report = function(schema) {
  $('input[type=file]').change(function(event) {
    var files = event.target.files;

    var $section = $('section');

    if(files.length) {
      var reader = new FileReader();

      reader.onload = function() {
        var html;

        try {
          var raw = JSON.parse(reader.result);

          html = build_report(schema, raw);
        }
        catch(error) {
          html = '<p class="negative">' + error + '</p>';
        }

        $section.html(html);

        show($section);
      };

      reader.readAsText(files[0]);
    }
    else {
      hide($section);
    }
  });
};

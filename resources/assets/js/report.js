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
}

var meanAtLeast45 = {
  name: 'Média',
  check: function(grades) {
    sum = 0;

    for(grade of grades) {
      sum += grade;
    }

    mean = sum / grades.length;

    return [mean, mean >= 45];
  }
};

var report = function(callback) {
  var $section = $('section');

  $('input[type=file]').change(function($event) {
    var files = $event.target.files;

    if(files.length) {
      var reader = new FileReader();

      reader.onload = function() {
        var html;

        try {
          var object = JSON.parse(reader.result);

          html = callback(object);
        }
        catch(error) {
          html = error;
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

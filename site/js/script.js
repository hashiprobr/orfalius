$(document).ready(function() {
  var revealOne = function($curr) {
      $curr.css('display', 'block');
      $curr.animate({opacity: 1}, 250);
  }

  var revealAll = function($curr) {
    while($curr.length) {
      if(!$curr.is('h3')) {
        revealOne($curr);
      }

      $curr = $curr.next();
    }
  };

  var reveal = function($curr) {
    while($curr.length) {
      revealOne($curr);

      if($curr.is('h3')) {
        break;
      }

      $curr = $curr.next();
    }
  };

  $curr = $('.container').children(':first');

  if(window.location.hash) {
    revealAll($curr);
  }
  else {
    reveal($curr);
  }

  $('h3 a').click(function() {
    finish = $(this).is(':nth-child(2)');

    $parent = $(this).parent();

    $parent.animate({opacity: 0}, 250, function() {
      $parent.css('display', 'none');

      $curr = $parent.next();

      if(finish) {
        revealAll($curr);
      }
      else {
        reveal($curr);
      }
    });

    return false;
  });
});

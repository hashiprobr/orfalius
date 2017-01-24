$(document).ready(function() {
  var displayFrom = function($curr) {
    while($curr.length) {
      $curr.css('display', 'block');
      $curr.animate({opacity: 1}, 250);

      if($curr.is('h3')) {
        break;
      }

      $curr = $curr.next();
    }
  };

  // display first elements

  $curr = $('.container').children(':first');

  displayFrom($curr);

  // display next elements

  $('h3 a:nth-child(1)').click(function() {
    $parent = $(this).parent();

    $parent.animate({opacity: 0}, 250, function() {
      $parent.css('display', 'none');

      $curr = $parent.next();

      displayFrom($curr);
    });

    return false;
  });

  // display all elements

  $('h3 a:nth-child(2)').click(function() {
    $parent = $(this).parent();

    $parent.animate({opacity: 0}, 250, function() {
      $parent.css('display', 'none');

      $curr = $parent.next();

      while($curr.length) {
        if(!$curr.is('h3')) {
          $curr.css('display', 'block');
          $curr.animate({opacity: 1}, 250);
        }

        $curr = $curr.next();
      }
    });

    return false;
  });
});

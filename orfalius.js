var fs = require('fs');
var Handlebars = require('handlebars');
var through = require('through2');
var markdown = require('markdown').markdown;
var path = require('path');


const PLUGIN_NAME = 'orfalius';


module.exports = function(templatePath, darkMode = false) {
  var templateSource = fs.readFileSync(templatePath).toString();
  var template = Handlebars.compile(templateSource);

  return through.obj(function(file, encoding, callback) {
    if(file.isBuffer()) {
      var markdownSource = file.contents.toString();
      var markdownTree = markdown.parse(markdownSource);
      var htmlTree = markdown.toHTMLTree(markdownTree);

      htmlTree.slice(1).forEach(function(element) {

        /* subsubheading */

        if(element[0] == 'h3') {
          element.splice(1, element.length - 1, ['a', {href: ''}, 'continuar'], ' ou ', ['a', {href: ''}, 'terminar']);
        }

        /* paragraph */

        else if(element[0] == 'p') {
          var subElement = element[1];

          // anchor

          if(typeof subElement == 'string' && subElement.startsWith('@')) {
            element.splice(0, element.length, 'a', {id: subElement.slice(1)});
          }

          // image

          else if(subElement instanceof Array && subElement[0] == 'img') {
            element.splice(1, 0, {class: 'figure'});

            subElement[1].title = subElement[1].alt;

            var src = subElement[1].src;

            if(src.startsWith('/')) {
              subElement[1].src = '/img'  + src;
            }
            else {
              subElement[1].src = 'img/'  + src;
            }

            if(src.slice(-3) != 'svg') {
              subElement[1].class = 'raster';
            }
          }

          // text

          else {
            element.slice(1).forEach(function(subElement) {
              if(subElement instanceof Array) {

                // link

                if(subElement[0] == 'a') {
                  if(subElement[1].href.startsWith('http')) {
                    subElement[1].target = '_blank';
                  }
                }

                // code

                if(subElement[0] == 'code') {
                  var subSubElement = subElement[1];

                  var subClassName = 'prettybox prettyprint';

                  if(subSubElement.startsWith('>')) {
                    subElement[1] = subSubElement.slice(1);

                    subClassName = 'nostalbox nostalprint';
                  }

                  subElement.splice(1, 0, {class: subClassName});
                }
              }
            });
          }
        }

        /* preformatted */

        else if(element[0] == 'pre') {
          var subElement = element[1];

          if(darkMode) {
            subElement[1] = subElement[1].replace(/\n/g, '\n>');
          }

          var subSubElement = subElement[1];

          var className = 'prettybox';
          var subClassName = 'prettyprint';

          if(subSubElement.startsWith('>')) {
            subElement[1] = subSubElement.slice(1);

            className = 'nostalbox';
            subClassName = 'nostalprint';
          }

          element.splice(1, 0, {class: className});
          subElement.splice(1, 0, {class: subClassName});
        }
      });

      var depth = -1;

      for(var c of path.relative('.', file.path)) {
        if(c == '/') {
          depth += 1;
        }
      }

      var prefix = '../'.repeat(depth);

      var title = htmlTree[1][1];
      var contents = markdown.renderJsonML(htmlTree);
      var html = template({title: title, prefix: prefix, contents: contents});

      file.contents = new Buffer(html);
      file.path = file.path.slice(0, -2) + 'html';
    }

    return callback(null, file);
  });
};

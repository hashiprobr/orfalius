var fs = require('fs');
var Handlebars = require('handlebars');
var through = require('through2');
var PluginError = require('gulp-util').PluginError;
var markdown = require('markdown').markdown;

const PLUGIN_NAME = 'orfalius';

module.exports = function(templatePath) {
  var source = fs.readFileSync(templatePath).toString();
  var template = Handlebars.compile(source);

  return through.obj(function(file, encoding, callback) {
    if(file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streams not supported!'));
    }

    if(file.isBuffer()) {
      var source = file.contents.toString();
      var mdTree = markdown.parse(source);
      var htmlTree = markdown.toHTMLTree(mdTree);

      htmlTree.slice(1).forEach(function(element) {
        if(element[0] == 'h3') {
          element.push(['a', {href: ''}, 'continuar']);
          element.push(' ou ');
          element.push(['a', {href: ''}, 'terminar']);
          element.push(['small', 'não tenha pressa, pense na resposta com calma']);
        }
        else if(element[0] == 'pre') {
          element[1].splice(1, 0, {class: 'prettyprint'});
        }
      });

      var title = htmlTree[1][1];
      var contents = markdown.renderJsonML(htmlTree);
      var html = template({title: title, contents: contents});

      file.contents = new Buffer(html);
      file.path = file.path.slice(0, -3) + '.html';
      return callback(null, file);
    }

    return callback(null, file);
  });
};

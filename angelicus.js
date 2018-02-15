var fs = require('fs');
var Handlebars = require('handlebars');
var through = require('through2');
var path = require('path');


const PLUGIN_NAME = 'angelicus';


module.exports = function(templatePath) {
  var templateSource = fs.readFileSync(templatePath).toString();
  var template = Handlebars.compile(templateSource);

  return through.obj(function(file, encoding, callback) {
    if(file.isBuffer()) {
      var contents = file.contents.toString();

      var depth = -1;

      for(var c of path.relative('.', file.path)) {
        if(c == '/' || c == '\\') {
          depth += 1;
        }
      }

      var prefix = '../'.repeat(depth);

      var openIndex = contents.indexOf('<h1>') + 4;
      var closeIndex = contents.indexOf('</h1>', openIndex);
      var title = contents.substring(openIndex, closeIndex);
      var html = template({title: title, prefix: prefix, contents: contents});

      file.contents = new Buffer(html);
    }

    return callback(null, file);
  });
};

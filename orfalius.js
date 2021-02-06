const through = require('through2');
const PluginError = require('plugin-error');
const fs = require('fs');
const Handlebars = require('handlebars');
const MarkdownIt = require('markdown-it');
const MarkdownItMathJax = require('markdown-it-mathjax');
const container = require('markdown-it-container');
const kbd = require('markdown-it-kbd');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const path = require('path');


const PLUGIN_NAME = 'orfalius';


const warningOptions = {
    validate: function (params) {
        return true;
    },
    render: function (tokens, idx) {
        let tail = tokens[idx].info.trim();
        let title = tail ? tail.split(/\s+/).join(' ') : 'Aviso';
        if (tokens[idx].nesting === 1) {
            return '<blockquote class="warning">\n<p>' + title + '</p>\n';
        } else {
            return '</blockquote>\n';
        }
    },
    marker: '!',
};

const questionOptions = {
    validate: function (params) {
        return true;
    },
    render: function (tokens, idx) {
        let tail = tokens[idx].info.trim();
        let title = tail ? tail.split(/\s+/).join(' ') : 'Pergunta';
        if (tokens[idx].nesting === 1) {
            return '<blockquote class="question">\n<p>' + title + '</p>\n';
        } else {
            return '</blockquote>\n';
        }
    },
    marker: '?',
};

const answerOptions = {
    validate: function (params) {
        return true;
    },
    render: function (tokens, idx) {
        let tail = tokens[idx].info.trim();
        let title = tail ? tail.split(/\s+/).join(' ') : 'Resposta';
        if (tokens[idx].nesting === 1) {
            return '<details class="answer">\n<summary>' + title + '</summary>\n';
        } else {
            return '</details>\n';
        }
    },
    marker: ':',
};

const sectionOptions = {
    validate: function (params) {
        return params.trim();
    },
    render: function (tokens, idx) {
        let tail = tokens[idx].info.trim();
        let title = tail.split(/\s+/).join(' ');
        if (tokens[idx].nesting === 1) {
            return '<details class="section">\n<summary>' + title + '</summary>\n';
        } else {
            return '</details>\n';
        }
    },
    marker: ';',
};

const slideOptions = {
    validate: function (params) {
        return params.trim();
    },
    render: function (tokens, idx) {
        let words = tokens[idx].info.trim().split(/\s+/);
        let timestamp = words[0];
        let title = words.slice(1).join(' ');
        if (tokens[idx].nesting === 1) {
            return '<div class="slide">\n<span class="slide-timestamp">' + timestamp + '</span>\n<div class="slide-container">\n<div class="slide-header">\n' + title + '\n</div>\n<div class="slide-main">\n';
        } else {
            return '</div>\n</div>\n</div>\n';
        }
    },
    marker: '+',
};


function replace(reference, element) {
    let parent = reference.parentElement;
    parent.insertBefore(element, reference);
    parent.removeChild(reference);
}

function wrapFigure(document, element, className) {
    let figure = document.createElement('figure');
    figure.setAttribute('class', className);
    figure.appendChild(element);
    return figure;
}

function createVideo(document, src, poster) {
    let video = document.createElement('video');
    video.setAttribute('src', src);
    if (poster) {
        video.setAttribute('poster', poster);
    }
    return video;
}

function processImage(element, prefix) {
    let src = '/' + element.src;
    if (prefix !== '/') {
        src = 'img' + src;
    }
    element.setAttribute('src', src);
}

function processChildren(document, element, prefix, dirName, name) {
    if (!element.children) {
        return;
    }
    for (let child of element.children) {
        switch (child.tagName) {
            case 'P':
                processParagraph(document, child, prefix, dirName, name);
                break;
            case 'UL':
            case 'OL':
                for (let grandChild of child.children) {
                    processChildren(document, grandChild, prefix, dirName, name);
                }
                break;
            case 'TABLE':
                let figure = document.createElement('figure');
                replace(child, figure);
                figure.setAttribute('class', 'table');
                figure.appendChild(child);
                break;
            case 'BLOCKQUOTE':
            case 'DETAILS':
            case 'DIV':
                processChildren(document, child, prefix, dirName, name);
                break;
            case 'PRE':
                let code = child.querySelector('code');
                if (!code.hasAttribute('class')) {
                    code.setAttribute('class', 'terminal nohighlight');
                }
                break;
            case 'CODE':
                let className = 'terminal nohighlight';
                let innerHTML = child.innerHTML;
                if (innerHTML.startsWith('!')) {
                    let index = innerHTML.search(/\s/);
                    if (index > 1) {
                        className = 'language-' + innerHTML.slice(1, index);
                        child.innerHTML = innerHTML.slice(index + 1);
                    }
                } else if (innerHTML.startsWith('\\!')) {
                    child.innerHTML = innerHTML.slice(1);
                }
                child.setAttribute('class', className);
                break;
            case 'A':
                if (child.href.startsWith('http')) {
                    child.setAttribute('target', '_blank');
                }
                break;
            case 'IMG':
                processImage(child, prefix);
                break;
            default:
        }
    }
}


function processParagraph(document, element, prefix, dirName, name) {
    let innerHTML = element.innerHTML;

    if (innerHTML.startsWith('.')) {
        // LECTURE
        let src = name + innerHTML.trim();
        let video = createVideo(document, src);
        video.setAttribute('class', 'reader-lecture');
        replace(element, video);
    } else if (innerHTML.startsWith(',')) {
        // ANIMATION
        let tail = innerHTML.trim().slice(1);
        if (tail) {
            let folder = 'img/' + tail;
            let imgs = [];
            for (let fileName of fs.readdirSync(dirName + '/' + folder)) {
                let img = document.createElement('img');
                img.setAttribute('src', folder + '/' + fileName);
                img.setAttribute('alt', fileName);
                imgs.push(img);
            }
            if (imgs.length > 0) {
                let animation = document.createElement('div');
                animation.setAttribute('class', 'animation');
                for (let img of imgs) {
                    animation.appendChild(img);
                }
                replace(element, animation);
            }
        }
    } else if (innerHTML.startsWith('@')) {
        // ANCHOR
        let a = document.createElement('a');
        a.setAttribute('id', innerHTML.slice(1));
        replace(element, a);

    } else if (innerHTML.startsWith('%')) {
        // VIDEO
        let words = innerHTML.trim().slice(1).split('%');
        let src = 'vid/' + words[0];
        let video;
        if (words.length < 2) {
            video = createVideo(document, src);
        } else {
            video = createVideo(document, src, 'vid/' + words[1]);
        }
        video.setAttribute('controls', '');
        let figure = wrapFigure(document, video, 'video');
        replace(element, figure);

    } else if (innerHTML.startsWith('&amp;')) {
        // CODEPEN
        let words = innerHTML.trim().slice(1).split('&amp;');
        element.setAttribute('class', 'codepen');
        element.setAttribute('data-theme-id', 'dark');
        element.setAttribute('data-user', words[0]);
        element.setAttribute('data-slug-hash', words[1]);
        element.setAttribute('data-default-tab', words[2]);
        element.innerHTML = '';

    } else {
        let child = element.firstChild;

        if (element.children.length === 1 && child.tagName === 'IMG') {
            // IMAGE
            element.removeChild(child);
            let figure = wrapFigure(document, child, 'img');
            replace(element, figure);
            processImage(child, prefix);

        } else {
            // P
            if (innerHTML.startsWith('\\.') ||
                innerHTML.startsWith('\\,') ||
                innerHTML.startsWith('\\@') ||
                innerHTML.startsWith('\\%') ||
                innerHTML.startsWith('\\&amp;')) {
                element.innerHTML = innerHTML.slice(1);
            }
            processChildren(document, element, prefix, dirName, name);
        }
    }
}


function orfalius(templatePath) {
    return through.obj(function (file, encoding, callback) {
        if (file.isStream()) {
            this.emit('error', new PluginError(PLUGIN_NAME, 'Streams not supported!'));
        }

        if (file.isBuffer()) {
            let templateContents = fs.readFileSync(templatePath);
            let template = Handlebars.compile(templateContents.toString());

            let md = MarkdownIt({ html: true }).
                use(MarkdownItMathJax()).
                use(container, 'warning', warningOptions).
                use(container, 'question', questionOptions).
                use(container, 'answer', answerOptions).
                use(container, 'section', sectionOptions).
                use(container, 'slide', slideOptions).
                use(kbd);

            let htmlString = md.render(file.contents.toString());
            let document = (new JSDOM(htmlString)).window.document;
            let body = document.querySelector('body');

            let title = body.querySelector('h1').innerHTML;

            let dirName = path.dirname(file.path);
            let name = path.basename(file.path).slice(0, -3);

            let prefix;
            if (path.basename(dirName) === 'error') {
                prefix = '/';
            } else {
                let paths = path.relative('.', file.path).split(path.sep);
                prefix = '../'.repeat(paths.length - 2);
            }

            processChildren(document, body, prefix, dirName, name);

            let contents = body.innerHTML;

            let fileString = template({
                title: title,
                prefix: prefix,
                contents: contents,
            });

            file.contents = new Buffer.from(fileString);
            file.path = file.path.slice(0, -2) + 'html';
        }

        callback(null, file);
    });
}


module.exports = orfalius;

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
        let time = words[0];
        let title = words.slice(1).join(' ');
        if (tokens[idx].nesting === 1) {
            return '<div class="slide">\n<span class="slide-time">' + time + '</span>\n<div class="slide-container">\n<div class="slide-header">\n' + title + '\n</div>\n<div class="slide-main">\n';
        } else {
            return '</div>\n</div>\n</div>\n';
        }
    },
    marker: '+',
};

const itemOptions = {
    validate: function (params) {
        return params.trim();
    },
    render: function (tokens, idx) {
        let tail = tokens[idx].info.trim();
        let title = tail.split(/\s+/).join(' ');
        if (tokens[idx].nesting === 1) {
            return '<div class="item">\n<span class="item-marker">' + title + '</span>\n';
        } else {
            return '</div>\n';
        }
    },
    marker: '|',
};


function replace(reference, element) {
    let parent = reference.parentElement;
    parent.insertBefore(element, reference);
    parent.removeChild(reference);
}

function wrapFigure(document, element, className) {
    let figure = document.createElement('figure');
    figure.setAttribute('class', className);
    figure.append(element);
    return figure;
}

function processImage(element, prefix) {
    let src = element.src;
    let re = /(?<!%7C)(\%7C\%7C)*(\%7C)(?!%7C)/g;
    let match = re.exec(src);
    if (match && !re.exec(src)) {
        element.setAttribute('style', 'max-height: ' + src.slice(match.index + 3) + 'em;');
        src = src.slice(0, match.index);
    }
    if (prefix === '/') {
        src = '/' + src;
    } else {
        src = 'img/' + src;
    }
    element.setAttribute('src', src);
}

function processChildren(document, element, prefix, dirName, name) {
    let removable = [];
    if (element.children) {
        for (let child of element.children) {
            switch (child.tagName) {
                case 'P':
                    removable.push(...processParagraph(document, child, prefix, dirName, name));
                    break;
                case 'UL':
                case 'OL':
                    for (let grandChild of child.children) {
                        removable.push(...processChildren(document, grandChild, prefix, dirName, name));
                    }
                    break;
                case 'TABLE':
                    let figure = document.createElement('figure');
                    replace(child, figure);
                    figure.setAttribute('class', 'table');
                    figure.append(child);
                    break;
                case 'BLOCKQUOTE':
                case 'DETAILS':
                case 'DIV':
                    removable.push(...processChildren(document, child, prefix, dirName, name));
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
                    if (innerHTML.startsWith('.')) {
                        let index = innerHTML.search(/\s/);
                        if (index > 1) {
                            className = 'language-' + innerHTML.slice(1, index);
                            child.innerHTML = innerHTML.slice(index + 1);
                        }
                    } else if (innerHTML.startsWith('\\.')) {
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
    return removable;
}


function processParagraph(document, element, prefix, dirName, name) {
    let removable = [];

    let innerHTML = element.innerHTML;

    if (innerHTML.startsWith('.')) {
        // LECTURE
        let src = name + innerHTML.trim();
        let lecture = document.querySelector('video.reader-lecture');
        if (lecture) {
            removable.push(element);
        } else {
            lecture = document.createElement('video');
            lecture.setAttribute('class', 'reader-lecture');
            replace(element, lecture);
        }
        let source = document.createElement('source');
        source.setAttribute('src', src);
        lecture.append(source);

    } else if (innerHTML.startsWith(',')) {
        // ANIMATION
        let tail = innerHTML.trim().slice(1);
        if (tail) {
            let folder = 'img/' + tail;
            let fileNames = fs.readdirSync(dirName + '/' + folder);
            fileNames.sort();
            let imgs = [];
            for (let [i, fileName] of fileNames.entries()) {
                let img = document.createElement('img');
                img.setAttribute('src', tail + '/' + encodeURI(fileName.replace(/\|/g, '||')));
                img.setAttribute('alt', i + 1);
                imgs.push(img);
            }
            if (imgs.length > 0) {
                let animation = document.createElement('div');
                animation.setAttribute('class', 'animation');
                for (let img of imgs) {
                    animation.append(img);
                    processImage(img, prefix);
                }
                replace(element, animation);
            }
        }

    } else if (innerHTML.startsWith('@')) {
        // ANCHOR
        let id = innerHTML.slice(1);
        let a = document.createElement('a');
        a.setAttribute('id', id);
        replace(element, a);

    } else if (innerHTML.startsWith('%')) {
        // VIDEO
        let words = innerHTML.trim().slice(1).split('%');
        let video = document.createElement('video');
        video.setAttribute('src', 'vid/' + words[0]);
        if (words.length > 1) {
            video.setAttribute('poster', 'vid/' + words[1]);
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
        let child = element.firstElementChild;

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
            removable.push(...processChildren(document, element, prefix, dirName, name));
        }
    }

    return removable;
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
                use(container, 'item', itemOptions).
                use(kbd);

            let htmlString = md.render(file.contents.toString());
            let document = (new JSDOM(htmlString)).window.document;
            let body = document.querySelector('body');

            let h1s = body.querySelectorAll('h1');

            if (h1s.length !== 1) {
                throw new SyntaxError('Must have exactly one H1!');
            }

            let first = body.firstElementChild;

            if (first.tagName !== 'H1') {
                if (first.tagName !== 'P' || first.nextElementSibling.tagName !== 'H1') {
                    throw new SyntaxError('Must start with H1 or P followed by H1!');
                }
            }

            let title = h1s[0].innerHTML;

            let dirName = path.dirname(file.path);
            let name = path.basename(file.path).slice(0, -3);

            let prefix;
            if (path.basename(dirName) === 'error') {
                prefix = '/';
            } else {
                let paths = path.relative('.', file.path).split(path.sep);
                prefix = '../'.repeat(paths.length - 2);
            }

            for (let element of processChildren(document, body, prefix, dirName, name)) {
                element.remove();
            }

            let contents = body.innerHTML;

            let fileString = template({
                title: title,
                prefix: prefix,
                contents: contents,
            });

            file.contents = Buffer.from(fileString);
            file.path = file.path.slice(0, -2) + 'html';
        }

        callback(null, file);
    });
}


module.exports = orfalius;

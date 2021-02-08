const SLIDE_WIDTH = 704;
const SLIDE_HEIGHT = 396;


function hide(element) {
    element.style.display = 'none';
}

function disable(button) {
    button.classList.add('disabled');
}

function enable(button) {
    button.classList.remove('disabled');
}

function createButton(controls, symbol) {
    let button = document.createElement('a');
    button.setAttribute('class', 'button');
    button.href = '';
    button.innerHTML = symbol;
    controls.append(button);
    return button;
}

function updateScale(slides, index, lecture) {
    slides[index].updateScale(lecture);
}

function updateTime(slides, index, lecture) {
    if (lecture) {
        let time = slides[index].time;
        if (!isNaN(time)) {
            lecture.setAttribute('automatic', '');
            lecture.currentTime = time;
        }
    }
}

function updateReader(slides, index, lecture, prevButton, nextButton, footer) {
    slides[index].element.style.display = 'block';
    updateScale(slides, index, lecture);
    if (index === 0) {
        disable(prevButton);
    } else {
        enable(prevButton);
    }
    if (index === slides.length - 1) {
        disable(nextButton);
    } else {
        enable(nextButton);
    }
    footer.innerHTML = (index + 1) + '/' + slides.length;
}

function updateAnimation(imgs, index, leftButton, span, rightButton) {
    imgs[index].style.display = 'inline';
    if (index === 0) {
        disable(leftButton);
    } else {
        enable(leftButton);
    }
    span.innerHTML = (index + 1) + '/' + imgs.length;
    if (index === imgs.length - 1) {
        disable(rightButton);
    } else {
        enable(rightButton);
    }
}


class Slide {
    constructor(element) {
        this.element = element;
        this.time = parseFloat(element.querySelector('span.slide-time').innerHTML);
        this.content = element.querySelector('div.slide-container');
        this.width = null;
    }

    transform(element, scale) {
        element.style.transform = 'scale(' + scale + ')';
    }

    updateScale(lecture) {
        let rect = this.element.getBoundingClientRect();
        if (this.width !== rect.width) {
            this.width = rect.width;
            let scale = Math.min(rect.width / SLIDE_WIDTH, rect.height / SLIDE_HEIGHT);
            if (scale > 0) {
                this.transform(this.content, scale);
                if (lecture) {
                    this.transform(lecture, scale);
                }
            }
        }
    }
}


document.addEventListener('DOMContentLoaded', function () {
    let page = (new URLSearchParams(window.location.search)).get('open');

    for (let code of document.querySelectorAll('code')) {
        hljs.highlightBlock(code);
    }

    let a = document.querySelector('header > a');

    a.addEventListener('click', function (event) {
        event.preventDefault();
        for (let details of document.querySelectorAll('details')) {
            details.setAttribute('open', '');
        }
    });

    let slides = [];
    let index = 0;
    let lecture = document.querySelector('video.reader-lecture');

    for (let element of document.querySelectorAll('div.slide')) {
        slides.push(new Slide(element));
    }

    if (slides.length > 0) {
        let h1 = document.querySelector('h1');

        let details = document.createElement('details');
        details.setAttribute('class', 'reader');
        h1.parentElement.insertBefore(details, h1.nextElementSibling);

        let summary = document.createElement('summary');
        summary.innerHTML = 'Slides';
        if (lecture) {
            summary.innerHTML += '/Vídeo';
        }
        details.append(summary);

        let controls = document.createElement('div');
        controls.setAttribute('class', 'reader-controls');
        details.append(controls);

        let prevButton = createButton(controls, '⏮');
        let playButton = createButton(controls, '▶');
        let pauseButton = createButton(controls, '⏸');
        let nextButton = createButton(controls, '⏭');
        let fullButton = createButton(controls, '⛶');

        let footer = document.createElement('span');
        footer.setAttribute('class', 'reader-footer');
        controls.append(footer);

        let display = document.createElement('div');
        display.setAttribute('class', 'reader-display');
        details.append(display);

        for (let slide of slides) {
            slide.element.remove();
            display.append(slide.element);
        }

        let value = parseInt(page);

        if (!isNaN(value) && value > 0 && value <= slides.length) {
            index = value - 1;
        }

        if (lecture) {
            display.append(lecture);

            lecture.addEventListener('timeupdate', function () {
                if (!lecture.seeking) {
                    if (index < slides.length - 1) {
                        let nextTime = slides[index + 1].time;
                        if (!isNaN(nextTime) && lecture.currentTime >= nextTime) {
                            hide(slides[index].element);
                            index++;
                            updateReader(slides, index, lecture, prevButton, nextButton, footer);
                        }
                    }
                }
            });

            lecture.addEventListener('seeked', function () {
                if (lecture.hasAttribute('automatic')) {
                    lecture.removeAttribute('automatic');
                } else {
                    if (!lecture.seeking) {
                        let i;
                        for (i = 0; i < slides.length && slides[i].time > lecture.currentTime; i++);
                        if (i < slides.length) {
                            hide(slides[index].element);
                            index = i;
                            updateReader(slides, index, lecture, prevButton, nextButton, footer);
                        }
                    }
                }
            });

            lecture.addEventListener('pause', function () {
                if (!lecture.seeking) {
                    hide(lecture);
                    hide(pauseButton);
                    playButton.style.display = 'inline';
                }
            });

            lecture.addEventListener('ended', function () {
                if (!lecture.seeking) {
                    hide(lecture);
                    hide(pauseButton);
                    playButton.style.display = 'inline';
                    hide(slides[index].element);
                    index = 0;
                    updateReader(slides, index, lecture, prevButton, nextButton, footer);
                }
            });

            document.addEventListener('keydown', function (event) {
                switch (event.key) {
                    case 'ArrowLeft':
                        prevButton.click();
                        break;
                    case 'ArrowRight':
                        nextButton.click();
                        break;
                    default:
                }
            });
        } else {
            hide(playButton);

            let start = Date.now();
            let shift = 0;
            let times = [0];

            document.addEventListener('keydown', function (event) {
                switch (event.key) {
                    case 'ArrowLeft':
                        prevButton.click();
                        if (times.length > 1) {
                            start = Date.now();
                            shift = times[times.length - 2];
                            times.pop();
                        }
                        break;
                    case 'ArrowRight':
                        nextButton.click();
                        if (times.length === slides.length) {
                            console.log('end');
                            for (let time of times) {
                                console.log(time);
                            }
                        } else {
                            let time = shift + (Date.now() - start) / 1000;
                            times.push(time);
                            console.log(time);
                        }
                        break;
                    case 'r':
                        if (times.length < slides.length) {
                            start = Date.now();
                            shift = times[times.length - 1];
                            console.log('retry');
                        }
                        break;
                    default:
                }
            });
        }

        hide(pauseButton);
        updateTime(slides, index, lecture);
        updateReader(slides, index, lecture, prevButton, nextButton, footer);

        window.addEventListener('resize', function () {
            updateScale(slides, index, lecture);
        });

        details.addEventListener('toggle', function () {
            updateScale(slides, index, lecture);
        });

        playButton.addEventListener('click', function (event) {
            event.preventDefault();
            hide(playButton);
            pauseButton.style.display = 'inline';
            if (lecture) {
                lecture.style.display = 'block';
                lecture.play();
            }
        });

        pauseButton.addEventListener('click', function (event) {
            event.preventDefault();
            if (lecture) {
                lecture.pause();
                hide(lecture);
            }
            hide(pauseButton);
            playButton.style.display = 'inline';
        });

        prevButton.addEventListener('click', function (event) {
            event.preventDefault();
            if (index > 0) {
                hide(slides[index].element);
                index--;
                updateTime(slides, index, lecture);
                updateReader(slides, index, lecture, prevButton, nextButton, footer);
            }
        });

        nextButton.addEventListener('click', function (event) {
            event.preventDefault();
            if (index < slides.length - 1) {
                hide(slides[index].element);
                index++;
                updateTime(slides, index, lecture);
                updateReader(slides, index, lecture, prevButton, nextButton, footer);
            }
        });

        fullButton.addEventListener('click', function (event) {
            event.preventDefault();
            if (display.requestFullscreen) {
                display.requestFullscreen();
            } else if (display.mozRequestFullScreen) {
                display.mozRequestFullScreen();
            } else if (display.webkitRequestFullScreen) {
                display.webkitRequestFullScreen();
            } else if (display.msRequestFullscreen) {
                display.msRequestFullscreen();
            }
        });
    }

    for (let animation of document.querySelectorAll('div.animation')) {
        let imgs = animation.querySelectorAll('img');
        let index = 0;

        let controls = document.createElement('div');
        controls.setAttribute('class', 'animation-controls');
        animation.append(controls);

        let leftButton = createButton(controls, '🡄');
        let span = document.createElement('span');
        controls.append(span);
        let rightButton = createButton(controls, '🡆');

        updateAnimation(imgs, index, leftButton, span, rightButton);

        leftButton.addEventListener('click', function (event) {
            event.preventDefault();
            hide(imgs[index]);
            index--;
            updateAnimation(imgs, index, leftButton, span, rightButton);
        });

        rightButton.addEventListener('click', function (event) {
            event.preventDefault();
            hide(imgs[index]);
            index++;
            updateAnimation(imgs, index, leftButton, span, rightButton);
        });
    }

    if (page || window.location.hash) {
        a.click();
    }
});

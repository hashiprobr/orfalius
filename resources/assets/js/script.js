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

function createOverlay(slides, display, times, timeline) {
    if (timeline.length > 0 && times.length === slides.length) {
        let overlay = document.createElement('pre');
        overlay.setAttribute('class', 'reader-overlay');
        let data = {
            'times': times,
            'timeline': timeline,
        };
        overlay.innerHTML = JSON.stringify(data, null, 4);
        display.append(overlay);
    }
}

function updateScale(slides, index, lecture) {
    slides[index].updateScale(lecture);
}

function updateTime(lecture, time) {
    lecture.setAttribute('automatic', '');
    lecture.currentTime = time;
}

function updateReader(slides, index, lecture, playButton, prevButton, nextButton, counter) {
    slides[index].element.style.display = 'block';
    updateScale(slides, index, lecture);
    if (isNaN(slides[index].time)) {
        if (lecture) {
            lecture.pause();
        }
        disable(playButton);
    } else {
        enable(playButton);
    }
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
    counter.innerHTML = (index + 1) + '/' + slides.length;
}

function updateAnimation(imgs, index, leftButton, rightButton, counter) {
    imgs[index].style.display = 'inline';
    if (index === 0) {
        disable(leftButton);
    } else {
        enable(leftButton);
    }
    if (index === imgs.length - 1) {
        disable(rightButton);
    } else {
        enable(rightButton);
    }
    counter.innerHTML = (index + 1) + '/' + imgs.length;
}


class Slide {
    constructor(element) {
        this.element = element;
        this.time = parseFloat(element.querySelector('span.slide-time').innerHTML);
        this.container = element.querySelector('div.slide-container');
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
                this.transform(this.container, scale);
                if (lecture) {
                    this.transform(lecture, scale);
                }
            }
        }
    }
}


document.addEventListener('DOMContentLoaded', function () {
    let page = (new URLSearchParams(window.location.search)).get('slide');

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

        let recIndicator = document.createElement('span');
        recIndicator.setAttribute('class', 'indicator');
        recIndicator.innerHTML = '⏺';
        controls.append(recIndicator);

        let prevButton = createButton(controls, '⏮');
        let playButton = createButton(controls, '▶');
        let pauseButton = createButton(controls, '⏸');
        let nextButton = createButton(controls, '⏭');
        let fullButton = createButton(controls, '⛶');

        let counter = document.createElement('span');
        counter.setAttribute('class', 'reader-counter');
        controls.append(counter);

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

            lecture.addEventListener('play', function () {
                hide(playButton);
                pauseButton.style.display = 'inline';
                lecture.style.display = 'block';
            });

            lecture.addEventListener('pause', function () {
                hide(lecture);
                hide(pauseButton);
                playButton.style.display = 'inline';
            });

            lecture.addEventListener('timeupdate', function () {
                if (!lecture.seeking) {
                    let time = slides[index].time;
                    if (isNaN(time)) {
                        lecture.pause();
                        let i = index - 1;
                        while (i > -1) {
                            time = slides[i].time;
                            if (!isNaN(time)) {
                                break;
                            }
                            i--;
                        }
                        if (i === -1) {
                            updateTime(lecture, 0);
                        } else {
                            updateTime(lecture, time);
                        }
                    } else {
                        if (lecture.currentTime >= time) {
                            if (index === slides.length - 1) {
                                lecture.pause();
                                updateTime(lecture, time);
                            } else {
                                hide(slides[index].element);
                                index++;
                                updateReader(slides, index, lecture, playButton, prevButton, nextButton, counter);
                            }
                        }
                    }
                }
            });

            lecture.addEventListener('seeked', function () {
                if (lecture.hasAttribute('automatic')) {
                    lecture.removeAttribute('automatic');
                } else {
                    if (!lecture.seeking) {
                        let i = 0;
                        let last = 0;
                        while (i < slides.length) {
                            let time = slides[i].time;
                            if (!isNaN(time)) {
                                last = time;
                                if (time > lecture.currentTime) {
                                    break;
                                }
                            }
                            i++;
                        }
                        if (i === slides.length) {
                            if (!lecture.paused) {
                                lecture.pause();
                            }
                            updateTime(lecture, last);
                        } else {
                            hide(slides[index].element);
                            index = i;
                            updateReader(slides, index, lecture, playButton, prevButton, nextButton, counter);
                        }
                    }
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

            let shift = 0;
            let times = [];
            let start = null;

            let subtimes;
            let timeline = [];

            document.addEventListener('keydown', function (event) {
                switch (event.key) {
                    case 'ArrowLeft':
                        let length = times.length;
                        if (length > 0) {
                            if (!start && isNaN(times[length - 1])) {
                                times.pop();
                            } else {
                                break;
                            }
                        }
                        prevButton.click();
                        break;
                    case 'ArrowRight':
                        if (times.length < slides.length) {
                            if (start) {
                                let now = Date.now();
                                shift += (now - start) / 1000;
                                times.push(shift);
                                start = now;
                                subtimes.push(shift);
                            } else {
                                times.push(NaN);
                                createOverlay(slides, display, times, timeline);
                            }
                        }
                        nextButton.click();
                        break;
                    case 'R':
                        if (start) {
                            hide(recIndicator);
                            timeline.push(subtimes);
                            start = null;
                            createOverlay(slides, display, times, timeline);
                        } else {
                            start = Date.now();
                            subtimes = [];
                            recIndicator.style.display = 'inline';
                        }
                        break;
                    default:
                }
            });
        }

        hide(pauseButton);
        updateReader(slides, index, lecture, playButton, prevButton, nextButton, counter);

        window.addEventListener('resize', function () {
            updateScale(slides, index, lecture);
        });

        details.addEventListener('toggle', function () {
            updateScale(slides, index, lecture);
        });

        playButton.addEventListener('click', function (event) {
            event.preventDefault();
            if (lecture) {
                lecture.play();
            }
        });

        pauseButton.addEventListener('click', function (event) {
            event.preventDefault();
            if (lecture) {
                lecture.pause();
            }
        });

        prevButton.addEventListener('click', function (event) {
            event.preventDefault();
            if (index > 0) {
                if (lecture) {
                    let i = index - 2;
                    let time;
                    while (i > -1) {
                        time = slides[i].time;
                        if (!isNaN(time)) {
                            break;
                        }
                        i--;
                    }
                    if (i === -1) {
                        updateTime(lecture, 0);
                    } else {
                        updateTime(lecture, time);
                    }
                }
                hide(slides[index].element);
                index--;
                updateReader(slides, index, lecture, playButton, prevButton, nextButton, counter);
            }
        });

        nextButton.addEventListener('click', function (event) {
            event.preventDefault();
            if (index < slides.length - 1) {
                if (lecture) {
                    let time = slides[index].time;
                    if (!isNaN(time)) {
                        updateTime(lecture, time);
                    }
                }
                hide(slides[index].element);
                index++;
                updateReader(slides, index, lecture, playButton, prevButton, nextButton, counter);
            }
        });

        fullButton.addEventListener('click', function (event) {
            event.preventDefault();
            if (display.requestFullscreen) {
                display.requestFullscreen();
            } else if (display.webkitRequestFullScreen) {
                display.webkitRequestFullScreen();
            } else if (display.mozRequestFullScreen) {
                display.mozRequestFullScreen();
            } else if (display.msRequestFullscreen) {
                display.msRequestFullscreen();
            }
        });
    }

    for (let animation of document.querySelectorAll('div.animation')) {
        let imgs = animation.querySelectorAll('img.frame');
        let index = 0;

        let controls = document.createElement('div');
        controls.setAttribute('class', 'animation-controls');
        animation.append(controls);

        let leftButton = createButton(controls, '🡄');
        let counter = document.createElement('span');
        counter.setAttribute('class', 'animation-counter');
        controls.append(counter);
        let rightButton = createButton(controls, '🡆');

        updateAnimation(imgs, index, leftButton, rightButton, counter);

        leftButton.addEventListener('click', function (event) {
            event.preventDefault();
            if (index > 0) {
                hide(imgs[index]);
                index--;
                updateAnimation(imgs, index, leftButton, rightButton, counter);
            }
        });

        rightButton.addEventListener('click', function (event) {
            event.preventDefault();
            if (index < imgs.length - 1) {
                hide(imgs[index]);
                index++;
                updateAnimation(imgs, index, leftButton, rightButton, counter);
            }
        });
    }

    if (page || window.location.hash) {
        a.click();
    }
});

/**
 * LabelBox class constructor
 * @param {Object} options
 *  - options.arrowLocation {google.maps.LatLng}
 *  - options.labelOffset {Object}
 *  - options.text {String}
 *  - options.maxW {Number}
 *  - options.maxH {Number}
 */
function LabelBox (options) {
    function extend(a, b){
        for(var key in b)
            if(b.hasOwnProperty(key) && !a.hasOwnProperty(key)) {
                a[key] = b[key];
            }
        return a;
    }

    this.options = extend(options || {}, {
        labelOffset: { x: 0, y: 200 },
        text: 'This is a text, inside a label, ponting somewhere.',
        minW: 150,
        minH: 20,
        maxW: 300,
        maxH: 0,
        padding: 10
    });

    // Create the label
    this.box = new fabric.Rect({
        fill: '#2c91a9',
        width: this.options.minW + this.options.padding * 2,
        height: this.options.minH + this.options.padding * 2,
        rx: 4,
        ry: 4,
        shadow: { color: 'rgba(0,0,0,0.2)', blur: 6, offsetX: 1, offsetY: 1 }
    });
    this.box.hasControls = false;
    this.box.hasBorders = false;

    // Create the text
    this.text = new fabric.Text('', {
        fill: 'white',
        fontFamily: 'Helvetica, Arial',
        fontSize: 14,
        fontWeight: 100
    });
    //this.text.hasControls = false;
    this.text.hasBorders = false;

    // Group the box and the text in a group
    this.label = new fabric.Group([this.box, this.text], {});
    this.label.hasControls = false;
    this.label.hasBorders = false;

    // Create the arrow
    this.arrow = new fabric.Triangle({
        fill: '#2c91a9',
        width: 22,
        height: 22,
        shadow: { color: 'rgba(0,0,0,0.2)', blur: 6, offsetX: 1, offsetY: 1 },
        originX: 'center',
        originY: 'top'
    });
    this.arrow.hasControls = false;
    this.arrow.hasBorders = false;

    // Create the line
    this.line = new fabric.Line(
        [],
        {
            fill: 'black',
            stroke: '#2c91a9',
            strokeWidth: 7,
            originX: 'center',
            originY: 'center',
            shadow: { color: 'rgba(0,0,0,0.2)', blur: 6, offsetX: 1, offsetY: 1 },
            hasRotatingpoint: true
        }
    );
    this.line.hasControls = false;
    this.line.hasBorders = false;
}

LabelBox.prototype = {
    setCanvas: function (canvas, map, projection) {
        if (!canvas) {
            // Let's remove the objects from the canvas
            this.canvas.remove(this.line, this.arrow, this.label);
            this.canvas = null;

            return;
        }

        // Let's add the objects to the canvas
        this.canvas = canvas;
        this.map = map;
        this.projection = projection;

        // Add the event listeners
        if (!this.options.readOnly) {
            canvas.on('mouse:down', function (e) {
                if (e.target === this.label || e.target === this.arrow) {
                    this.map.setOptions({draggable: false});
                }
            }.bind(this));
            canvas.on('mouse:up', function () {
                this.map.setOptions({draggable: true});
            }.bind(this));
            canvas.on('object:moving', function (e) {
                if (e.target === this.label || e.target === this.arrow) {
                    this.updateLine();
                    this.updateArrow();
                }
            }.bind(this));
            canvas.on('object:modified', function (e) {
                if (e.target === this.label || e.target === this.arrow) {
                    this.savePosition();
                    if (this.options.changedCallback) {
                        this.options.changedCallback.apply(this, [this.getState()]);
                    }
                }
            }.bind(this));
        }

        // Set the initial position
        this.updatePosition();
        this.savePosition();

        // Set the initial text
        this.setText(this.options.text);

        // Add the components to the canvas
        canvas.add(this.line, this.label, this.arrow);
    },

    setText: function (t) {
        var words = t.split(' ');
        var formatted = '';

        var context = this.canvas.getContext('2d');

        context.font = this.text.fontSize + 'px ' + this.text.fontFamily;
        var currentLine = '';
        var breakLineCount = 0;

        var n = 0;
        while (n < words.length) {
            var isNewLine = currentLine === '';
            var testOverlap = currentLine + ' ' + words[n];

            // are we over width?
            var w = context.measureText(testOverlap).width;

            if (w < this.options.maxW) { // if not, keep adding words
                if (currentLine !== '') {
                    currentLine += ' ';
                }
                currentLine += words[n];
            } else {
                // if this hits, we got a word that need to be hypenated
                if (isNewLine) {
                    var wordOverlap = '';

                    // test word length until its over maxW
                    for (var i = 0; i < words[n].length; ++i) {

                        wordOverlap += words[n].charAt(i);
                        var withHypeh = wordOverlap + '-';

                        if (context.measureText(withHypeh).width >= this.options.maxW) {
                            // add hyphen when splitting a word
                            withHypeh = wordOverlap.substr(0, wordOverlap.length - 2) + '-';
                            // update current word with remainder
                            words[n] = words[n].substr(wordOverlap.length - 1, words[n].length);
                            formatted += withHypeh; // add hypenated word
                            break;
                        }
                    }
                }

                formatted += currentLine + '\n';
                breakLineCount++;
                currentLine = '';

                continue; // restart cycle
            }
            n++;
        }

        if (currentLine !== '') {
            formatted += currentLine + '\n';
            breakLineCount++;
            currentLine = '';
        }

        // get rid of empy newline at the end
        formatted = formatted.substr(0, formatted.length - 1);

        // Get the dimensions by using the formatted text on a new
        // fabric.Text object.
        var fText = new fabric.Text(formatted, {
            fontFamily: this.text.fontFamily,
            fontSize: this.text.fontSize
        });

        this.text.setText(formatted);

        // Small hack to get the witdth as fText.width always returns 0 on IE8
        var textWidth = fText.width === 0 ?
            context.measureText(formatted).width : fText.width;
        this.updateLabel(textWidth, fText.height);
        this.canvas.renderAll();
    },

    updatePosition: function () {
        var arrowPositionPx = this.projection
            .fromLatLngToContainerPixel(this.options.arrowLocation);

        this.label.set({
            left: arrowPositionPx.x + this.options.labelOffset.x,
            top: arrowPositionPx.y + this.options.labelOffset.y
        });
        this.label.setCoords();

        this.arrow.set({
            left: arrowPositionPx.x,
            top: arrowPositionPx.y
        });
        this.arrow.setCoords();
        this.updateLine();
        this.updateArrow();
    },

    updateLine: function () {
        var x1 = this.label.left + this.label.width / 2,
            y1 = this.label.top + this.label.height / 2,
            x2 = this.arrow.left,
            y2 = this.arrow.top,
            dx = x2 - x1,
            dy = y2 - y1;
        x2 -= 15 * Math.cos(Math.atan2(dy, dx));
        y2 -= 15 * Math.sin(Math.atan2(dy, dx));

        this.line.set({
            'x1': x1,
            'y1': y1,
            'x2': x2,
            'y2': y2
        });
        this.line.setCoords();
    },

    updateArrow: function () {
        var dx = this.line.x2 - this.line.x1;
        var dy = this.line.y2 - this.line.y1;

        var angle = Math.atan2(dy, dx);
        angle *= 180 / Math.PI;
        angle += 90;

        this.arrow.set({
            angle: angle
        });
    },

    updateLabel: function (width, height) {
        if (width < this.options.minW) {
            width = this.options.minW;
        }
        if (height < this.options.minH) {
            height = this.options.minH;
        }

        this.label.set({
            width: width + this.options.padding * 2,
            height: height + this.options.padding * 2
        });
        this.label.set({
            left: this.line.x1 - this.label.width / 2,
            top: this.line.y1 - this.label.height / 2
        });
        this.label.setCoords();
        this.box.set({
            width: width + this.options.padding * 2,
            height: height + this.options.padding * 2,
            left: -this.label.width / 2,
            top: -this.label.height / 2
        });
        this.box.setCoords();
        this.text.set({
            width: width,
            height: height,
            left: -this.label.width / 2 + this.options.padding,
            top: -this.label.height / 2 + this.options.padding
        });
        this.text.setCoords();

        this.savePosition();
    },

    savePosition: function () {
        this.options.arrowLocation = this.projection.fromContainerPixelToLatLng(
            new google.maps.Point(this.arrow.left, this.arrow.top)
        );
        this.options.labelOffset = {
            x: this.label.left - this.arrow.left,
            y: this.label.top - this.arrow.top,
        };

    },

    getState: function () {
        return this.options;
    }
};

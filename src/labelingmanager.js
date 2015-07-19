function LabelingManager (map, options) {
    this.labels = [];
    this.map = map;

    this.canvasLayer = new CanvasLayer({
        map: map,
        animate: false,
        updateHandler: this.update.bind(this),
        paneName: 'overlayMouseTarget'
    });
    this.canvasLayer.canvas.id = 'label-canvas';
    this.canvasLayer.canvas.style.pointerEvents = 'all';
}

LabelingManager.prototype = {

    update: function () {
        if (!this.canvas) {
            // Create the fabricJS canvas abstraction
            this.canvas = new fabric.Canvas('label-canvas');
            this.canvas.selection = false;
        }

        this.canvas.upperCanvasEl.style.transform = this.canvas.lowerCanvasEl.style.transform;
        for (var i = 0; i < this.labels.length; ++i) {
            this.labels[i].updatePosition();
        }
        this.canvas.renderAll();
        this.canvas.calcOffset();

        this.isOnTheMap = true;
    },

    addLabelBox: function (labelBox, options) {
        if (!this.isOnTheMap) {
            return window.setTimeout(function () {
                this.addLabelBox.apply(this, [labelBox, options]);
            }.bind(this), 500);
        }

        if(labelBox instanceof LabelBox === false) {
            return;
        }

        this.labels.push(labelBox);

        // Add the components to the canvas
        labelBox.setCanvas(this.canvas, this.map, this.canvasLayer.getProjection());
    }
};

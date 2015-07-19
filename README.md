# Labels and arrows on a Google Map

This is a very simple library which helps you putting some labels with arrows on top of a Google Map, jus like this:

![An example](https://cldup.com/9VptmryaR6.png)

## Usage

First, you add an instance of `LabelingManager` to your instance of `google.maps.Map`. After that you can create as many `LabelBox` instances as you want and add it to the `LabelingManager`.

```javascript
var map = new google.maps.Map(document.getElementById('map-canvas'), {
    center: {lat: 46.285318, lng: -1.868843},
    zoom: 4
});

var lm = new LabelingManager(map);
var lb = new LabelBox({
    arrowLocation: new google.maps.LatLng(39, -9),
    labelOffset: {
        x: 100,
        y: -100
    },
    text: 'This is a text, insite a label, pointing somewhere.'
});
lm.addLabelBox(lb);
```

And that's it.

## Dependencies

* [CanvasLayer](https://github.com/brendankenny/CanvasLayer)
* [Fabric.js](http://fabricjs.com/)

## Future

The library is pretty bare right now and undocumented. On the positive side, the code is so small that you should be able to pick everything up just by giving it a read. Things I (or you?) might add in the future:

 * Ability to move the labels between the map's panes. This is needed you you have a complex map and want your markers as well as labels to receive events;
 * Provide events for clicks, hovers, etc.;
 * Get rid of fabric.js. Although a great library, it may be too much to include just to display some simple shapes;
 * You tell me?;
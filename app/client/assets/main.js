(function(window, document, L) {
    "use strict";

    const map = L.map('main-map', {});

    // create a base layer and add it to the map
    const baseLayer = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        attribution: `Map data &copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors,
          &copy; <a href="http://cartodb.com/attributions" target="_blank">CartoDB</a>`
    }).addTo(map);

    // set the center and zoom level of the map
    map.setView([13, 122], 6);

})(window, document, window.L);



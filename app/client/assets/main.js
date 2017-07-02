(function(window, document, L, undefined) {
    "use strict";

    const http = {
        request: function(url, options) {
            if (typeof options === 'undefined') {
                options = {};
            }

            let xhr = new XMLHttpRequest();

            // set the default http verb to get
            let method = 'get';
            if (typeof options.method !== 'undefined') {
                method = options.method;
            }

            // The last parameter must be set to true to make an asynchronous request
            xhr.open(method.toUpperCase(), url, true);

            // apply the headers dynamically
            if (typeof options.headers !== 'undefined' ) {
                Object.keys(options.headers).forEach(function(headerKey) {
                    xhr.setRequestHeader(headerKey, options.headers[headerKey]);
                });
            }

            // process the onload event
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    if (typeof options.success !== 'undefined') {
                        options.success(xhr.response);
                    }
                } else {
                    if (typeof options.fail !== 'undefined') {
                        options.fail(xhr.status, "Error");
                    }
                }
            };

            // send the request
            xhr.send();

            return xhr;
        }
    }

    const map = L.map('main-map', {});

    // create a base layer and add it to the map
    const baseLayer = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        attribution: `Map data &copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors,
          &copy; <a href="http://cartodb.com/attributions" target="_blank">CartoDB</a>`
    }).addTo(map);

    // set the center and zoom level of the map
    map.setView([13, 122], 6);

    // dynamically create markers
    let marker      = null;
    let httpRequest = null;
    map.on('click', function(evt) {
        const mapInstance = this;

        // abort the current http request
        if (httpRequest !== null) {
            httpRequest.abort();
        }

        // remove the old marker and its popup before creating a new one
        if (marker !== null) {
            marker.unbindPopup();
            marker.removeFrom(mapInstance);
            marker = null;
        }

        // create new marker and add it to the map where it is clicked
        marker = L.marker([
            evt.latlng.lat,
            evt.latlng.lng
        ]).addTo(map);

        marker.bindPopup("<span>Loading data... Please wait..</span>").openPopup();

        showInformation(evt.latlng.lat, evt.latlng.lng);
    });

    function showInformation(lat, lng) {
        getAddress(lat, lng);
    }

    function getAddress(lat, lng) {
        const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyAi4LDku4WJGIC2f7xQJuRixTrwB3QL0yQ`;
        const result   = {};

        httpRequest = http.request(endpoint, {
            method: 'get',
            headers: {
                'Accept': 'application/json'
            },
            success: function(data) {
                result.geocoding = JSON.parse(data);

                getSunriseSunset(lat, lng, result);

                // remove the reference to the XHR instance
                httpRequest = null;
            },
            fail: function(status, msg) {
                console.log(`Geocoding Error: ${status} - ${msg}`);

                // remove the reference to the XHR instance
                httpRequest = null;
            }
        });
    }

    function getSunriseSunset(lat, lng, result) {
        // get time of sunset and sunrise
        httpRequest = http.request(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}`, {
            method: 'get',
            headers: {
                'Accept': 'application/json'
            },
            success: function(data) {
                result.sunriseAndSunset = JSON.parse(data);

                onFinish(result);

                // remove the reference to the XHR instance
                httpRequest = null;
            },
            fail: function(status, msg) {
                console.log(`Sunset APi Error: ${status} - ${msg}`);

                // remove the reference to the XHR instance
                httpRequest = null;
            }
        });
    }

    function onFinish(data) {
        let template =  `<dl>`;

        // assemble the template based on the data
        if (data.geocoding.results.length > 0) {
            template += `
                <dt>Address</dt>
                <dd>${data.geocoding.results[0].formatted_address}</dd>
            `;
        } else {
            template += `
                <dt>Address</dt>
                <dd>N/A</dd>
            `;
        }

        if (data.sunriseAndSunset.status === 'OK') {
            template += `
                <dt>Today's Sunrise</dt>
                <dd>${data.sunriseAndSunset.results.sunrise}</dd>
            `;

            template += `
                <dt>Today's Sunset</dt>
                <dd>${data.sunriseAndSunset.results.sunset}</dd>
            `;
        } else {
            template += `
                <dt>Today's Sunrise</dt>
                <dd>N/A</dd>
            `;

            template += `
                <dt>Today's Sunset</dt>
                <dd>N/A</dd>
            `;
        }

        template += '</dl>';

        // update marker's content
        marker.setPopupContent(template);
    }

})(window, document, window.L);



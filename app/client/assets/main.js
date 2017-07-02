(function(window, document, L, undefined) {
    "use strict";

    const http = {
        request: function(url, options) {
            let xhr        = new XMLHttpRequest();
            let xhrPromise = new Promise((resolve, reject) => {
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

                        // resolve the promise
                        resolve(xhr.response);
                    } else {
                        if (typeof options.fail !== 'undefined') {
                            options.fail(xhr.status, "Error");
                        }

                        // reject the promise
                        reject({
                            error: xhr.response,
                            message: "Error"
                        });
                    }
                };

                // send the request
                xhr.send();
            });

            // add abort method to promise since cancellable promises are under discussion of tc39
            // <https://github.com/tc39/proposal-cancelable-promises>
            xhrPromise.abort = function() {
                xhr.abort();
            };

            return xhrPromise;
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

        // abort the current http request and remove any references to it
        if (httpRequest !== null) {
            httpRequest.abort();
            httpRequest = null;
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

        // show add default marker content indicating status
        marker.bindPopup("<span>Loading data... Please wait..</span>").openPopup();

        // store the reference to the xhr-based promise to prevent from getting the value from the last `.then`
        httpRequest = getAddress(evt.latlng.lat, evt.latlng.lng);

        // invoke the promise chain
        httpRequest
            .then(geocodingResult => {
                httpRequest = getSunriseSunset(evt.latlng.lat, evt.latlng.lng);

                return Promise.all([geocodingResult, httpRequest]);
            })

            // parse the results to convert them to json
            .then(result => {
                let [geocodingResult, sunriseAndSunsetResult] = result;

                // convert responses to json
                geocodingResult        = JSON.parse(geocodingResult);
                sunriseAndSunsetResult = JSON.parse(sunriseAndSunsetResult);

                return [
                    geocodingResult,
                    sunriseAndSunsetResult
                ];
            })

            // assemble the template for the marker popup
            .then(jsonData => {
                const [geocodingResult, sunriseAndSunsetResult] = jsonData;

                return compileTemplate({
                    geocoding: geocodingResult,
                    sunriseAndSunset: sunriseAndSunsetResult
                });
            })

            // update marker's content
            .then(template => marker.setPopupContent(template))

            // handle all possible errors that might occur along the way
            .catch((err) => {
                console.log(`Aborting promise. Error occured: ${err.message}`);

                // notify the user about the situation
                marker.setPopupContent("We have experienced some issues please try again later.");

                // abort any running http request
                if (httpRequest !== null) {
                    httpRequest.abort();
                }
            })
            ;
    });

    function getAddress(lat, lng) {
        const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyAi4LDku4WJGIC2f7xQJuRixTrwB3QL0yQ`;

        return http.request(endpoint, {
            method: 'get',
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    function getSunriseSunset(lat, lng) {
        const endpoint = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}`;

        return http.request(endpoint, {
            method: 'get',
            headers: {
                'Accept': 'application/json'
            }
        });
    }

    function compileTemplate(data) {
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

        return template;
    }

})(window, document, window.L);



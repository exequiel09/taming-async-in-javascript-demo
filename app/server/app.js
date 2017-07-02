/**
 * app.js
 *
 * Copyright(c) Exequiel Ceasar Navarrete <exequiel.navarrete09@gmail.com>
 *Licensed under MIT
 */

const path    = require('path');
const express = require('express');

const app  = express();
const port = 3000;

// serve the html file
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/index.html'));
});

// serve the assets required by the demo application
app.use('/assets', express.static(path.resolve(__dirname, '../client/assets')));

// we need to proxy the APIs required by the demo application
app.get('/api', (req, res) => {
    res.send('API Endpoint!');
});

// <http://localhost:3000/leaflet/leaflet.css>
// <http://localhost:3000/leaflet/leaflet.js>
app.use('/leaflet', express.static(path.resolve(__dirname, '../../node_modules/leaflet/dist/')));

// <http://localhost:3000/normalize/normalize.css>
app.use('/normalize', express.static(path.resolve(__dirname, '../../node_modules/normalize.css/')));

// make the application serve and listen on the port
app.listen(port, () => {
    console.log(`Access the server on http://localhost:3000`);
});



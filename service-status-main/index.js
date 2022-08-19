var Ping = require('./pinger');

let express = require('express');
let app = express();
let path = require("path");

let config = require("./config.json");

let services_status = {
    last_checked: "",
    services: []
};

function perform_ping() {
    services_status.last_checked = new Date();
    config.services.forEach((s, i) => {
        Ping.check(s.address).then(res => {
            services_status.services[i] = {
                name: s.name,
                title: s.title,
                up: res.up,
                ping_time: res.responseTime,
                server_error: res.serverError,
            };
        }).catch(err => {
            services_status.services[i] = {
                name: s.name,
                title: s.title,
                up: false
            };
        });
    })
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

let a = require("./status.json");

app.get('/', (req, res) => {
    res.render('status', {
        services: services_status
    });
});

perform_ping();
setInterval(perform_ping, 1000 * config.poll_time);

app.listen(9384, () => console.log('Status Server listening on port 9384!'));
// crude http/https pinger

const http = require('http');
const https = require('https');
const url = require('url');

function check(url_target) {
    const startTime = process.hrtime();

    return new Promise((a, r) => {
        function onResponse() {
            let diff = process.hrtime(startTime);
            a({
                responseTime: Math.floor((diff[0] * 1e9 + diff[1]) / 1e6),
                up: true,
                serverError: false
            })
        }

        let url_parsed = url.parse(url_target);

        const options = {
            website: url_parsed,
            address: url_parsed,
            method: "GET"
        };

        let req = (url_target.startsWith("https://") ? https : http).request(options, onResponse);

        req.on('error', e => {
            let diff = process.hrtime(startTime);
            a({
                responseTime: Math.floor((diff[0] * 1e9 + diff[1]) / 1e6),
                up: true,
                serverError: true
            })
        })

        req.on('timeout', e => {
            let diff = process.hrtime(startTime);
            a({
                responseTime: Math.floor((diff[0] * 1e9 + diff[1]) / 1e6),
                up: false,
                serverError: false
            })
        })

        req.end();
    });

}

module.exports = {
    check
}
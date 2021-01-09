"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.randomUA = exports.randomRange = void 0;
const ua_1 = require("./ua");
function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
exports.randomRange = randomRange;
function randomUA() {
    return ua_1.UA[randomRange(0, ua_1.UA.length)];
}
exports.randomUA = randomUA;
function sleep(delay) {
    return new Promise(res => {
        setTimeout(() => {
            res(true);
        }, delay);
    });
}
exports.sleep = sleep;
//# sourceMappingURL=utils.js.map
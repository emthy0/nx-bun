"use strict";
// https://github.com/rayepps/radash/blob/03dd3152f560414e933cedcd3bda3c6db3e8306b/src/curry.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounce = void 0;
const debounce = ({ delay }, func) => {
    let timer = undefined;
    let active = true;
    const debounced = (...args) => {
        if (active) {
            clearTimeout(timer);
            timer = setTimeout(() => {
                active && func(...args);
                timer = undefined;
            }, delay);
        }
        else {
            func(...args);
        }
    };
    debounced.isPending = () => {
        return timer !== undefined;
    };
    debounced.cancel = () => {
        active = false;
    };
    debounced.flush = (...args) => func(...args);
    return debounced;
};
exports.debounce = debounce;
//# sourceMappingURL=debounce.js.map
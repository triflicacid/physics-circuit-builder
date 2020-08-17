import Page from './page/index.js';
import __setup__ from './page/setup.js';
import __main__ from './page/main.js';

window.Page = Page;

if (typeof __setup__ === 'function') {
    __setup__(Page);
} else {
    throw new TypeError(`main.js: expected __setup__ function, got ${typeof __setup__}`);
}

if (typeof __main__ === 'function') {
    __main__(Page);
} else {
    throw new TypeError(`main.js: expoected __main__ function, got ${typeof __main__}`);
}
/**
 * Target for controls
 * @type HTMLElement
 */
var target;

/**
 * The wrapper for the current circuit
 * @type Control
 */
var control;

window.onload = function() {
    target = document.getElementById('target');

    target.insertAdjacentText('afterBegin', 'Debug ');

    const debugCheckbox = document.createElement('input');
    debugCheckbox.setAttribute('type', 'checkbox');
    target.appendChild(debugCheckbox);

    target.insertAdjacentHTML('beforeEnd', `<br /><button onclick='control.save();'>Save</button>&nbsp;`);
    target.insertAdjacentHTML('beforeEnd', `<button onclick='control.terminate(function() { target.innerHTML = ""; });'>Terminate</button>`);

    new Control()
        .load('main', undefined, function(ns, circuit) {
            circuit.wires.forEach(w => w._debug = debugCheckbox.checked);
            circuit.forEach(c => c._debug = debugCheckbox.checked);
        })
        .then(obj => {
            control = obj;
        });
};

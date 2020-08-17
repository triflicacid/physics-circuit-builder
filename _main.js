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

    target.insertAdjacentText('beforeEnd', 'Running ');
    const runCheckbox = document.createElement('input');
    runCheckbox.setAttribute('type', 'checkbox');
    runCheckbox.checked = 1;
    target.appendChild(runCheckbox);

    target.insertAdjacentText('beforeEnd', ' | Show Info ');
    const showInfoCheckbox = document.createElement('input');
    showInfoCheckbox.setAttribute('type', 'checkbox');
    showInfoCheckbox.checked = 1;
    target.appendChild(showInfoCheckbox);

    target.insertAdjacentText('beforeEnd', ' | Debug ');
    const debugCheckbox = document.createElement('input');
    debugCheckbox.setAttribute('type', 'checkbox');
    target.appendChild(debugCheckbox);

    const table_voltage = document.getElementById('circuit-voltage');
    const table_resistance = document.getElementById('circuit-resistance');
    const table_current = document.getElementById('circuit-current');
    const table_power = document.getElementById('circuit-power');


    // target.insertAdjacentHTML('beforeEnd', `<br /><button onclick='control.save();'>Save</button>&nbsp;`);
    // target.insertAdjacentHTML('beforeEnd', `<button onclick='control.terminate(function() { target.innerHTML = ""; });'>Terminate</button>`);

    Sounds.Init();
    window.control = new Control()
        .setup('container', 800, 800, function(ns, control) {
                let tmp;
                let power = control.createComponent(Circuit.Cell, 100, 300);
                control._head = power;

                tmp = control.createComponent(Circuit.Switch, 400, 300);
                tmp.open();

                tmp = control.createComponent(Circuit.VariableResistor, 500, 300);

                tmp = control.createComponent(Circuit.Buzzer, 700, 300);
                tmp.setMaxVoltage(power.voltage);

                control.connectAll();
            },
            function(ns, control) {
                let date = new Date();
                document.getElementById('lastUpdate').innerText = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}; Frames: ${ns.frameCount} (${ns.frameRate()})fps`;

                control.forEach(c => c._debug = debugCheckbox.checked);
                control.forEachWire(w => w._debug = debugCheckbox.checked);
                if (runCheckbox.checked) {
                    control._showInfo = showInfoCheckbox.checked;
                    control.eval();
                } else {
                    control.stopEval();
                }

                table_voltage.innerText = control._circuit.getVoltage() + ' V';
                table_resistance.innerText = control._circuit.getResistance() + ' ' + Circuit.OHM;
                table_current.innerText = control._circuit.getCurrent() + ' A';
                table_power.innerText = control._circuit.getWatts() + ' W';
            })
        .draw(function(control) {
            control.frameRate(25);
        });
};

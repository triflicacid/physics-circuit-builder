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


    // target.insertAdjacentHTML('beforeEnd', `<br /><button onclick='control.save();'>Save</button>&nbsp;`);
    // target.insertAdjacentHTML('beforeEnd', `<button onclick='control.terminate(function() { target.innerHTML = ""; });'>Terminate</button>`);

    Sounds.Init();
    window.control = new Control()
        .setup('container', 800, 800, function(ns, control) {
                let power = control.createComponent(Circuit.Cell, 100, 100);
                control._head = power;

                let vr = control.createComponent(Circuit.VariableResistor, 200, 100);
                power.connectTo(vr);

                let outerBulb = control.createComponent(Circuit.Bulb, 300, 100);
                outerBulb.setMaxVoltage(power.voltage / 2);
                vr.connectTo(outerBulb);

                let outerBulb2 = control.createComponent(Circuit.Bulb, 400, 100);
                outerBulb2.setMaxVoltage(power.voltage / 2);
                outerBulb.connectTo(outerBulb2);

                let junctionS = control.createComponent(Circuit.Junction, 500, 100);
                outerBulb2.connectTo(junctionS);

                let bulb1 = control.createComponent(Circuit.Bulb, 500, 200);
                bulb1._angle = Degrees._90;
                bulb1.setMaxVoltage(power.voltage / 2);
                junctionS.connectTo(bulb1);

                let bulb1_1 = control.createComponent(Circuit.Bulb, 500, 300);
                bulb1_1._angle = Degrees._90;
                bulb1_1.setMaxVoltage(power.voltage / 2);
                bulb1.connectTo(bulb1_1);

                let toggle2 = control.createComponent(Circuit.Switch, 550, 100);
                junctionS.connectTo(toggle2);

                let bulb2 = control.createComponent(Circuit.Bulb, 600, 200);
                bulb2._angle = Degrees._90;
                bulb2.setMaxVoltage(power.voltage / 2);
                toggle2.connectTo(bulb2);

                let junctionE = control.createComponent(Circuit.Junction, 500, 400);
                bulb1_1.connectTo(junctionE);
                bulb2.connectTo(junctionE);

                junctionE.connectTo(power, Circuit.LOOP);
            },
            function(ns, control) {
                let date = new Date();
                document.getElementById('lastUpdate').innerText = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}; Frames: ${ns.frameCount} (${roundTo(ns.frameRate(), 1)} fps)`;

                control.forEach(c => c._debug = debugCheckbox.checked);
                control.forEachWire(w => w._debug = debugCheckbox.checked);
                if (runCheckbox.checked) {
                    control._showInfo = showInfoCheckbox.checked;
                    control.eval();
                } else {
                    control.stopEval();
                }
            })
        .draw(function(control) {
            control.frameRate(25);
        });
};

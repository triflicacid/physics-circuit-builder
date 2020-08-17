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

    const runCheckbox = document.getElementById('s-running');
    runCheckbox.addEventListener('change', (event) => {
        if (event.target.checked)
            control.start();
        else
            control.stop();
    });

    const showInfoCheckbox = document.getElementById('s-showInfo');
    const debugCheckbox = document.getElementById('s-debug');
    const wireCreationCheckbox = document.getElementById('s-wireCreation');


    // target.insertAdjacentHTML('beforeEnd', `<br /><button onclick='control.save();'>Save</button>&nbsp;`);
    // target.insertAdjacentHTML('beforeEnd', `<button onclick='control.terminate(function() { target.innerHTML = ""; });'>Terminate</button>`);

    Sounds.Init();
    control = new Control()
        .setup('container', 800, 800, function(ns, control) {
                let power = control.createComponent(Circuit.DCPowerSupply, 80, 300);
                power._voltage = Circuit.logic.HIGH;
                control._head = power;

                let toggle = control.createComponent(Circuit.Switch, 160, 300);
                toggle.open();
                power.connectTo(toggle);

                let cS = control.createComponent(Circuit.Connector, 250, 300);
                toggle.connectTo(cS);

                let r1 = control.createComponent(Circuit.Bulb, 300, 300);
                // r1._resistance = 2;
                r1.setMaxVoltage(power.voltage);
                cS.connectTo(r1);

                let logic1 = control.createComponent(Circuit.Logicmeter, 300, 200);
                cS.connectTo(logic1);

                let cE = control.createComponent(Circuit.Connector, 350, 300);
                r1.connectTo(cE);
                logic1.connectTo(cE);

                let gate = control.createComponent(Circuit.LogicalNot, 440, 300);
                gate._units = 1;
                cE.connectTo(gate);

                // let bulb = control.createComponent(Circuit.Bulb, 600, 300);
                // bulb.setMaxVoltage(power.voltage);

                cS = control.createComponent(Circuit.Connector, 550, 300);
                gate.connectTo(cS);

                let r2 = control.createComponent(Circuit.Bulb, 600, 300);
                // r2._resistance = 2;
                r2.setMaxVoltage(power.voltage);
                cS.connectTo(r2);

                let logic2 = control.createComponent(Circuit.Logicmeter, 600, 200);
                cS.connectTo(logic2);

                cE = control.createComponent(Circuit.Connector, 650, 300);
                // power.connectTo(cS);
                r2.connectTo(cE);
                logic2.connectTo(cE);

                cE.connectTo(power, Circuit.LOOP);
            },
            function(ns, control) {
                let date = new Date();
                document.getElementById('lastUpdate').innerText = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}; Frames: ${ns.frameCount} (${roundTo(ns.frameRate(), 1)} fps)`;

                control.forEach(c => c._debug = debugCheckbox.checked);
                control.forEachWire(w => w._debug = debugCheckbox.checked);
                control._showInfo = showInfoCheckbox.checked;
                control._enableCreateWire = wireCreationCheckbox.checked;
                control.eval();
            })
        .start(20);
};

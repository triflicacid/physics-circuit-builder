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
        .setup('container', 1000, 800, function(_ns, control) {
                // let tmp;
                // let power = control.createComponent('cell', 100, 300);
                //
                // tmp = control.createComponent('switch', 200, 300);
                // tmp.open();
                //
                // // tmp = control.createComponent('variable resistor', 300, 300);
                //
                // tmp = control.createComponent('bulb', 300, 300);
                // tmp.wattage(1);
                //
                // tmp = control.createComponent('thermometer', 740, 300);
                //
                // tmp = control.createComponent('heater', 800, 300);
                // tmp.maxTemp(100);
                // tmp._efficiency = 2e3;
                // // tmp.setMaxVoltage(power.voltage);
                //
                // control.connectAll();

                // let power = control.createComponent('cell', 100, 600);
                // power._voltage = 5;
                //
                // let res = control.createComponent('resistor', 200, 600);
                // res._resistance = 0.08;
                // power.connectTo(res);
                //
                // let meter = control.createComponent('thermo-meter', 300, 600);
                // meter._min = 0;
                // res.connectTo(meter);
                //
                // let connS = control.createComponent('connector', 400, 600);
                // meter.connectTo(connS);
                //
                // let ldr = control.createComponent('thermistor', 500, 600);
                // connS.connectTo(ldr);
                //
                // let bulb = control.createComponent('bulb', 500, 100);
                // bulb.wattage(10);
                // connS.connectTo(bulb);
                //
                // let connE = control.createComponent('connector', 600, 600);
                // ldr.connectTo(connE);
                // bulb.connectTo(connE);
                //
                // connE.connectTo(power, Circuit.LOOP);

                let tmp;
                tmp = control.createComponent('cell', 100, 300);

                tmp = control.createComponent('motor', 200, 300);

                tmp = control.createComponent('bulb', 300, 300);
                tmp._efficiency = 2e3;
                // tmp.setMaxVoltage(power.voltage);

                control.connectAll();
            },
            function(ns, control) {
                let date = new Date();
                document.getElementById('lastUpdate').innerText = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}; Frames: ${ns.frameCount} (${roundTo(ns.frameRate(), 1)} fps)`;

                control.debug(debugCheckbox.checked);
                control._showInfo = showInfoCheckbox.checked;
                control._enableCreateWire = wireCreationCheckbox.checked;
                control.eval();
            })
        .start(20);
};

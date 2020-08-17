<?php
require 'log/fn.php';
log_init('log/log.json');
define('CURRENT_VER', log_latest_version());
?>

<!DOCTYPE html>
<html lang="en" dir="ltr">

<head>
    <meta charset="utf-8">
    <title>Circuit | Components</title>
    <link rel="stylesheet" href="master.css">
    <link rel="shortcut icon" href="favicon.ico" />
</head>

<body>
    <center>
        <h1 id='top'>About Components</h1>
        <a href="./">Back to Home Page</a>
        <br>
        <b>Current Release: <?php echo CURRENT_VER; ?><br>Components: 28</b>
        <br>
    </center>
    <ol>
        <li><a href='#power'>Power Sources</a></li>
        <li><a href='#analytical'>Analytical Components</a></li>
        <li><a href='#output'>Output Components</a></li>
        <li><a href='#flow'>Flow-Managing Components</a></li>
        <li><a href='#resistors'>Resistors</a></li>
        <li><a href='#wire'>Wire</a></li>
    </ol>
    <p>
        <b>[G]</b> - present in GCSE physics<br>
        <b>[!]</b> - theoretical or abstracted (e.g. wattmeter)
    </p>

    <!-- POWER SOURCES -------------------------------->
    <hr>
    <center>
        <h2 id='power'>Power Sources (4)</h2>
    </center>
    <a href="#top">Back to Top</a>
    <h2>AC Power Supply</h2>
    <i>Added r1.2.2</i>
    <p>
        Produces a voltage which reverses (Hz)
    </p>
    <b>Toggle Command</b>: reverse direction.<br>
    <b>Scroll Command</b>: change voltage.
    <h2>[G] Battery</h2>
    <i>Added r1.2.1</i>
    <p>
        Multiple cells stacked up in a container<br>
        <b>NB the rendering of the battery is not finished, so it looks odd.</b>
    </p>
    <b>Toggle Command</b>: Toggle direction.<br>
    <b>Scroll Command</b>: Add / Subtract number of cells in battery
    <h2>[G] Cell</h2>
    <i>Added r1.0.0</i>
    <p>
        Produces a current with a certain voltage in one direction.
    </p>
    <b>Toggle Command</b>: Toggle direction<br>
    <b>Scroll Command</b>: <i>None</i>
    <h2>DC Power Supply</h2>
    <i>Added r1.3.0</i>
    <p>
        Produces a current in one direction. Voltage of component is adjustable within a range.
    </p>
    <b>Toggle Command</b>: Toggle Direction<br>
    <b>Scroll Command</b>: Increase / Decrease voltage

    <!-- ANALYTICAL COMPONENTS -------------------------------->
    <hr>
    <center>
        <h2 id='analytical'>Measuring Components (5)</h2>
    </center>
    <a href="#top">Back to Top</a>
    <h2>[G] Ammeter</h2>
    <i>Added r1.0.4</i>
    <p>
        Measures current flowing through it. Must be placed in <b>series</b>.
    </p>
    <b>Toggle Command</b>: Change units (e.g. milli-amps, micro-amps ...)<br>
    <b>Scroll Command</b>: Change units (e.g. milli-amps, micro-amps ...)
    <h2>[!] Lightmeter</h2>
    <i>Added r3.1.4</i>
    <p>
        Measures the light (in lumens) that the component is recieving.
    </p>
    <b>Toggle Command</b>: Change units (e.g. milli-lumens, micro-lumens ...)<br>
    <b>Scroll Command</b>: Change units (e.g. milli-lumens, micro-lumens ...)
    <h2>Thermometer</h2>
    <i>Added r3.2.3</i>
    <p>
        Measures the external temperature (in degrees celcius).
    </p>
    <b>Toggle Command</b>: <i>None</i><br>
    <b>Scroll Command</b>: <i>None</i>
    <h2>[G] Voltmeter</h2>
    <i>Added r2.0.2</i>
    <p>Measures voltage accross a wire. Must be placed in <b>parallel</b>.</p>
    <b>Toggle Command</b>: <i>None</i><br>
    <b>Scroll Command</b>: <i>None</i>
    <h2>[!] Watt-meter</h2>
    <i>Added r2.0.3</i>
    <p>Measure power consumed in circuit (theoretical).</p>
    <b>Toggle Command</b>: <i>None</i><br>
    <b>Scroll Command</b>: <i>None</i>

    <!-- OUTPUT COMPONENTS -------------------------------->
    <hr>
    <center>
        <h2 id='output'>Output Components (5)</h2>
    </center>
    <a href="#top">Back to Top</a>
    <h2>[G] Bulb</h2>
    <i>Added r1.0.0</i>
    <p>
        Lights up when a current is passed through it (brightness varies with current). Assign a maximum current. If this current is exceeded, the bulb will blow and break the circuit.
    </p>
    <b>Toggle Command</b>: Old / new circuit symbol<br>
    <b>Scroll Command</b>: <i>None</i>
    <h2>Buzzer</h2>
    <i>Added r1.3.2</i>
    <p>Buzzes when a current is passed through it (volume varies with current). Assign a maximum current.</p>
    <b>Toggle Command</b>: Mute / Unmute<br>
    <b>Scroll Command</b>: Change frequency<br>
    <i>BUG: still plays when global "isRunning" is false</i>
    <h2>[G] Heater</h2>
    <i>Added r3.2.2</i>
    <p>
        Slowly heats the surroundings over time. Cannot heat over a certain temperature.
    </p>
    <b>Toggle Command</b>: <i>None</i><br>
    <b>Scroll Command</b>: <i>None</i>
    <h2>[G] Light-Emitting Diode </h2>
    <i>Added r1.2.1</i>
    <p>A diode which lights up when a current is passed through. May be different colours. Either on or off (one brightness).</p>
    <b>Toggle Command</b>: Reverse diode direction<br>
    <b>Scroll Command</b>: Change hue of colour
    <h2>Motor</h2>
    <i>Added r3.1.3</i>
    <p>
        Spins. Speed varied with current. In our model, the 'M' spins and the current:speed ratio is linear.
    </p>
    <b>Toggle Command</b>: <i>None</i><br>
    <b>Scroll Command</b>: Adjust current:speed ratio

    <!-- FLOW COMPONENTS -------------------------------->
    <hr>
    <center>
        <h2 id='flow'>Flow Components (8)</h2>
    </center>
    <a href="#top">Back to Top</a>
    <h2>Capacitor</h2>
    <i>Added 3.0.0</i>
    <p>
        When connected to power, will charge up to a target voltage exponentially. (electrons collect on plates, generating an electric field)<br>
        When disconnected from power but has a route back to itself, will discharge. (electrons flow to the other plate, neutralising the charge)
    </p>
    <b>Toggle Command</b>: <i>None</i><br>
    <b>Scroll Command</b>: <i>None</i>
    <h2>Connector</h2>
    <i>Added r1.0.1. Utilised in v2.0.0</i>
    <p>
        Either split circuit to parallel circuits, or join back to series.<br>
        <b>Split</b> - split a circuit into two circuits in parallel with each other.<br>
        <b>Join</b> - join two parallel circuits back into original series from which they were split from.
    </p>
    <b>Toggle Command</b>: <i>None</i><br>
    <b>Scroll Command</b>: <i>None</i>
    <h2>[G] Diode</h2>
    <i>Added r1.2.1</i>
    <p>
        Only allows current to flow one way. Breaks the circuit if current is recieved in opposite direction.
    </p>
    <b>Toggle Command</b>: Toggle direction of diode<br>
    <b>Scroll Command</b>: <i>None</i>

    <h2>[G] Fuse</h2>
    <i>Added r1.1.4</i>
    <p>Set a maximum current. Blows if the current exceeds this maximum, breaking the circuit.</p>
    <b>Toggle Command</b>: One-time right-click to blow the fuse<br>
    <b>Scroll Command</b>: <i>None</i>

    <h2>Push Switch (Button)</h2>
    <i>Added r5.13.1</i>
    <p>Switch, but only closed when pressed (mouse button is pressed)</p>
    <b>Toggle Command</b>: Closed when mouse is pressed, then opend switch again<br>
    <b>Scroll Command</b>: <i>None</i>

    <h2>[G] Switch</h2>
    <i>Added r1.1.5</i>
    <p>Togglable wire. If open, breaks the circuit</p>
    <b>Toggle Command</b>: Toggle open/closed<br>
    <b>Scroll Command</b>: <i>None</i>

    <h2>Touch Switch</h2>
    <i>Added r5.13.1</i>
    <p>Switch, but only closed when touched (mouse is over the component)</p>
    <b>Toggle Command</b>: <i>None</i><br>
    <b>Scroll Command</b>: <i>None</i>

    <h2>Two-Way Switch</h2>
    <i>Added r2.1.3 (as ToggleConnector; renamed to TwoWaySwitch in r2.10.1)</i>
    <p>
        Branches series circuit to two other circuits (like connector), but only executes one at any time.
    </p>
    <b>Toggle Command</b>: Toggle between outputs<br>
    <b>Scroll Command</b>: <i>None</i>

    <!-- RESISTORS -------------------------------->
    <hr>
    <center>
        <h2 id='resistors'>Resistors (5)</h2>
    </center>
    <a href="#top">Back to Top</a>
    <h2>[G] Light-Dependant Resistor (aka photoresistor, LDR)</h2>
    <i>Added r3.2.0</i>
    <p>
        Resistance is dependant upon light levels. Smaller the light level, larger the resistance.<br>
        <b>NB our light:resistance ratio is linear, but in real life it should be exponential-ish.</b>
    </p>
    <b>Toggle Command</b>: Toggle between American/British circuit symbols<br>
    <b>Scroll Command</b>: <i>None</i>

    <h2>Material Container</h2>
    <i>Added r5.0.0</i>
    <p>
        A container which holds a "material". There are currently <b>38</b> materials this may hold.<br>
        Each material has a vlue in ohm-metres, but we interpret this as ohm-centimetres to make the value noticeable. The resistance depends on the material and the length of the container, as well as the external "Environment &gt; Pixels per centimetre" value.<br>
    </p>
    <b>Toggle Command</b>: Toggle scroll command between "change material" [default] and "change length"<br>
    <b>Scroll Command</b>: Flip through materials list; change material in container, or change length of container.

    <h2>[G] (Fixed) Resistor</h2>
    <i>Added r1.0.2</i>
    <p>Set a fixed resistance.</p>
    <b>Toggle Command</b>: Toggle between American/British circuit symbols<br>
    <b>Scroll Command</b>: <i>None</i>

    <h2>[G] Thermistor</h2>
    <i>Added r3.2.5</i><br>
    <i>The thermistor known at GCSE is the NTC type.</i>
    <p>
        Resistance is dependant upon temperature of surroundings.<br>
        <ul>
            <li>[G] <b>NTC</b> (default) - Negative temp:resistance correlation. Resistance increases while temperature decreases. Smaller temp, bigger resistance.</li>
            <li><b>PTC</b> - Positive temp:resistance correlation. Resistance increases with decreases. Smaller temp, smaller resistance.</li>
        </ul>
    </p>
    <b>Toggle Command</b>: Toggle between NTC and PTC types<br>
    <b>Scroll Command</b>: <i>None</i>

    <h2>[G] Variable Resistor</h2>
    <i>Added r1.1.1</i>
    <p>Set a resistance which may be changed.</p>
    <b>Toggle Command</b>: Toggle between American/British circuit symbols<br>
    <b>Scroll Command</b>: Change resistance

    <!-- WIRE -------------------------------->
    <hr>
    <center>
        <h2 id='wire'>Wire</h2>
    </center>
    <a href="#top">Back to Top</a>
    <p>
        A wire connects components together, and is fundamental to the circuit.<br>
        By default, the wire is simple a connection, but it from v5.1.1, wires can also have a resistance.
    </p>
    <p>
        A wire will only have a resistance if the "Has Resistance" setting is on. If it is, the wire's material, cross-section radius (thickness) and length will effect its resistance.<br>
        Each material has a resistance value of ohm-metres (ohms of resistance per metre cubed). Of course, this would be way to small to have any effect, so the value is interpreted as ohm-centimetres.<br>
        This value may be externally influenced by changing the "Environment &gt; Pixels per centimetre" value. The smaller the value, the higher the resistance.
    </p>
    <b>There are currently 26 different wire materials</b>

    <h2>Wire Container</h2>
    <i>Added r5.1.3</i>
    <p>
        A container which holds a wire of a certain material. See above for number of materials available.<br>
        Each material has a value in ohm-metres, but we interpret this as ohm-centimetres to make the value noticeable. The resistance depends on the material and the length of the container, as well as the external "Environment &gt; Pixels per centimetre" value.<br>
        To make the resistance more noticable, the resistance is multiplied by a constant (around 1,000).
    </p>
    <b>Toggle Command</b>: Toggle scroll command between "change length" [default] and "change material"<br>
    <b>Scroll Command</b>: Change length/material of wire inside container.
</body>

</html>
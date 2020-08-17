<?php
    require 'log/fn.php';
    log_init('log/log.json');
    define('CURRENT_VER', log_latest_version());
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
    <head>
        <meta charset="utf-8">
        <title>Circuit | Ideas</title>
        <link rel="stylesheet" href="master.css" />
        <link rel="shortcut icon" href="favicon.ico" />
    </head>
    <body>
        <center>
            <h1>Circuit Ideas</h1>
            <a href='./'>Back to Home Page</a><br>
            <b>Current Release: <?php echo CURRENT_VER; ?></b>
        </center>

        <h2>Transitor</h2>
        <i>Proposed 16/07/2020</i><br>
        <b>Rating: 1/10</b>
        <pre>
(research needed)
        </pre>
        <hr>

        <h2>Magnetism</h2>
        <i>Proposed 20/07/2020</i><br>
        <b>Rating: 5/10</b>
        <pre>
Magnetic coil - more current, more flux.
Magno-resistor.
Magnetic switch - opens only when certain flux is present.
        </pre>
        <hr>

        <h2>Motor-Generator</h2>
        <i>Proposed 20/07/2020</i><br>
        <b>Rating: 5/10</b>
        <pre>
Add generator which can be connected via "rod" to motor.
Faster the motor, more current produced (like DCPowerSupply)
        </pre>
        <hr>

        <h2>Multi-circuits</h2>
        <i>Proposed 20/07/2020</i><br>
        <b>Rating: 3/10</b>
        <pre>
Multiple circuits which can interact e.g. via magnetism, motor.
        </pre>
        <hr>

        <h2>Snapping</h2>
        <i>Proposed 02/08/2020</i><br>
        <b>Rating: 8/10</b>
        <pre>
Optional snapping:
- Components "snap" into a grid (10 * 10)
- Wires "snap" into a grid (5 * 5)
        </pre>
        <hr>
    </body>
</html>

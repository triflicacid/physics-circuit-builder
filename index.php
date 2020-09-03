<?php
require 'log/fn.php';
log_init('log/log.json');
define('CURRENT_VER', log_latest_version());
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">

<head>
    <meta charset="utf-8">
    <title>Circuit</title>
    <link rel="stylesheet" href="./master.css" />
    <link rel="shortcut icon" href="./favicon.ico" />
</head>

<body>
    <center>
        <h1>Circuit Builder</h1>
        <p>This project is designed to model (simple) circuits, and as a learning tool for GCSE. It is still in development</p>
        <b>Current Release: <?php echo CURRENT_VER; ?></b>
        <br><br>
        <h3>Circuit</h3>
        <a target="_blank" href="app/dist/">Latest</a>
        <br><br>
        <i><a target="_blank" href="https://github.com/ruben4447/physics-circuit-builder">GitHub repo</a></i>
        <h3>Other</h3>
        <a href="log/">Release Log</a><br>
        <a href="ideas.php">Upcoming Ideas</a><br>
        <a href="components.php">About Components</a><br>
        <a href="keyboard.html">Keyboard / Mouse Control</a><br>
    </center>
</body>

</html>
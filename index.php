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
        <h2>NOTE: The code base is being refactored with major changes. For the latest stable version, see v5.5.0. 04/08/2020</h2>
        <br><br>
        <h3>Circuit</h3>
        <a target="_blank" href="__versions__/30062020/">v0.0.0 (30/06/2020)</a><br>
        <a target="_blank" href="__versions__/06072020_1/">v1.4.1 (06/07/2020)</a><br>
        <a target="_blank" href="__versions__/06072020_2/">v2.0.1 (06/07/2020)</a><br>
        <a target="_blank" href="__versions__/07072020/">v2.1.3 (07/07/2020)</a><br>
        <a target="_blank" href="__versions__/14072020/">v2.8.0 (14/07/2020)</a><br>
        <a target="_blank" href="__versions__/19072020/">v3.3.5 (19/07/2020)</a><br>
        <a target="_blank" href="__versions__/02082020/">v5.2.2 (02/08/2020)</a><br>
        <a target="_blank" href="__versions__/04082020/">v5.5.0 (04/08/2020)</a><br>
        <mark>
            <a target="_blank" href="app/dist/"><?php echo "v" . CURRENT_VER . " (" . date('d/m/Y') . ")"; ?></a>
        </mark>
        <h3>Other</h3>
        <a href="log/">Release Log</a><br>
        <a href="ideas.php">Upcoming Ideas</a><br>
        <a href="components.php">About Components</a><br>
        <a href="keyboard.html">Keyboard / Mouse Control</a><br>
    </center>
</body>

</html>
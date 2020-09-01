<?php
require 'log/fn.php';
log_init('log/log.json');
define('CURRENT_VER', log_latest_version());

define("COMPONENTS_PATH", "./app/dist/assets/data/components.json");
$components = file_get_contents(COMPONENTS_PATH);
$components = json_decode($components);

$keys = [];
foreach ($components as $a => $b) $keys[] = $a;
sort($keys);
?>

<!DOCTYPE html>
<html lang="en" dir="ltr">

<head>
    <meta charset="utf-8">
    <title>Circuit | Components</title>
    <link rel="stylesheet" href="master.css">
    <link rel="shortcut icon" href="favicon.ico" />

    <style>
        component>name {
            font-size: 1.6em;
            font-weight: bold;
        }

        component>tags {
            font-size: small;
            font-style: italic;
            color: #878787;
        }

        component>null {
            font-style: italic;
            color: gray;
        }

        component>null::after {
            content: "None";
        }
    </style>
</head>

<body>
    <center>
        <h1 id='top'>About Components</h1>
        <a href="./">Back to Home Page</a>
        <br>
        <b>Current Release: <?php echo CURRENT_VER; ?><br>Components: <?php echo count($keys); ?></b>
        <br>
        <i>NB For more advanced help (searching etc...) view the integrated help in the circuit app. (Components &gt; Help for list, or Analyse &gt; Help for one component)</i>
    </center>

    <?php
    foreach ($keys as $key) {
        $data = $components->$key;

        echo "<component id='{$key}' data-name='{$data->name}'";
        echo " data-tags='" . ($data->tags == null ? "" : implode(" ", $data->tags)) . "'";
        echo ">";

        echo "<name>{$data->name}</name>";
        if ($data->tags != null) echo "&nbsp; <small>🏷️ (" . count($data->tags) . ") &nbsp; <tags>" . implode(", ", $data->tags) . "</tags></small><br>";

        echo "<i>Added in {$data->added}</i><br>";
        echo "<p>" . implode("<br>", $data->about) . "</p>";

        echo "<p>&nbsp; &nbsp; <b>Actions</b><br>";
        echo "<b>Left-Click: </b>" . ($data->left == null ? "<null></null>" : $data->left) . "<br>";
        echo "<b>Right-Click: </b>" . ($data->right == null ? "<null></null>" : $data->right) . "<br>";
        echo "<b>Scroll: </b>" . ($data->scroll == null ? "<null></null>" : $data->scroll) . "</p>";

        if ($data->config != null) {
            echo "<p><b>Config</b><br>";
            foreach ($data->config as $config) {
                echo "&nbsp; &bull; <b>{$config[0]}</b>: {$config[1]}<br>";
            }
            echo "</p>";
        }
        echo "</component><hr><br>";
    }
    ?>
</body>

</html>
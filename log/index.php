<?php
    require 'fn.php';
    log_init('log.json');
    $releases = $log_json->releases;

    define('CURRENT_VER', log_latest_version());
?>

<!DOCTYPE html>
<html lang="en" dir="ltr">
    <head>
        <meta charset="utf-8">
        <title>Circuit | Release Log</title>
        <link rel="stylesheet" href="../master.css">
        <link rel="shortcut icon" href="../favicon.ico" />
    </head>
    <body>
        <center>
            <h1 id='top'>Release Log</h1>
            <a href="../">Back to Home Page</a>
            <br>
        </center>
        <?php
            $latest = CURRENT_VER;
            echo "<h3>Current Version: $latest</h3>";

            echo "<ul>";
            $rNo = 1;
            foreach ($releases as $release) {
                echo "<li><a href='#r$rNo'>Release $rNo";
                if (strlen($release->name) !== 0) echo " : <i>" . $release->name . "</i>";
                echo "</a></li>";
                echo "<ul><li>Patch &nbsp;";

                for ($srNo = 0; $srNo < count($release->releases); $srNo++) {
                    if (count($release->releases[$srNo]) === 0) continue;
                    echo "<a href='#p$rNo.$srNo'>$srNo</a> |&nbsp;";
                }

                echo "</li></ul>";
                $rNo++;
            }
            echo "</ul>";
        ?>
        <br>
        <hr>
        <?php
            for ($rn = 1; $rn <= count($releases); $rn++):
                $release = $releases[$rn - 1];

                echo "<h1 id='r$rn'>Release $rn";
                if (strlen($release -> name) !== 0) echo " : <i>{$release -> name}</i>";
                echo "</h1>";
                echo "<div class='indent'>";

                $date = DateTime::createFromFormat('d/m/Y', $release -> started);

                echo "<a href='#top'>&uarr;</a> &nbsp;<i>Started " . $date->format('d/m/Y') . "</i>";

                for ($srn = 0; $srn < count($release->releases); $srn++, $date = $date->modify('+1 day')):
                    $subRelease = $release->releases[$srn];

                    if (count($subRelease) === 0) continue;
                    echo "<h2 id='p$rn.$srn'>Patch $rn.$srn</h2>";
                    echo "<div class='indent'>";
                    echo "<a href='#top'>&uarr;</a> &nbsp;<i>Released " . $date->format('d/m/Y') . "</i><br>";

                    for ($ssrn = 0; $ssrn < count($subRelease); $ssrn++):
                        $subSubRelease = $subRelease[$ssrn];

                        echo "<b>Preview $rn.$srn.$ssrn</b> (" . $subSubRelease[0] . ")";
                        echo "<div class='indent'>";
                        echo "<i>" . implode('<br>', array_splice($subSubRelease, 1)) . "</i>";
                        echo "</div>";
                        echo "<br>";
                    endfor;

                    echo "</div>";
                endfor;

                echo "<br>";
                $date = $date->modify('-1 day');
                if ($rn < count($releases)):
                    echo "<i>Released on " . $date->format('d/m/Y') . "</i>";
                else:
                    echo "<i>Last updated " . $date->format('d/m/Y') . "</i>";
                endif;
                echo "</div><hr>";
            endfor;
        ?>
    </body>
</html>

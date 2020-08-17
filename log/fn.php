<?php
function log_init($path = 'log.json')
{
    global $log_json;

    $log_json = file_get_contents($path);
    $log_json = json_decode($log_json);
}

function log_latest_version()
{
    global $log_json;

    $array = $log_json->releases;
    $maxRelease = is_countable($array) ? count($array) - 1 : 0;

    $array = $array[$maxRelease]->releases;
    $maxPatch = is_countable($array) ? count($array) - 1 : 0;

    $array = $array[$maxPatch];
    $maxPreview = is_countable($array) ? count($array) - 1 : 0;

    if ($maxPatch === -1) {
        return ($maxRelease + 1) . ".x.x";
    }
    return ($maxRelease + 1) . ".$maxPatch.$maxPreview";
}

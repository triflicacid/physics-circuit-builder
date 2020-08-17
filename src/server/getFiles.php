<?php
    define('AUTH', preg_replace("/\r|\n|\r\n|\n\r|\s/", '', (string)file_get_contents('auth.cab')));
    $authcode = (string)$_POST['auth'];
    if (!password_verify($authcode, AUTH)) die('E401');
    define('BIN_PATH', (string)file_get_contents('bin.path'));

    $filetype = $_POST['filetype'];
    $glob = '';

    switch ($filetype) {
        case 'json': $glob = '*.json'; break;
        default: die('E400');
    }
    $glob = BIN_PATH . $glob;

    $files = glob($glob);

    $data = array();

    foreach($files as $file) {
        $data[] = str_replace(BIN_PATH, '', $file);
    }

    echo json_encode($data);
?>

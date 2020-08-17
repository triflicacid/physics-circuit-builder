<?php
    define('AUTH', preg_replace("/\r|\n|\r\n|\n\r|\s/", '', (string)file_get_contents('auth.cab')));
    define('BIN_PATH', (string)file_get_contents('bin.path'));

    $name = (string)$_POST['filename'];
    $authcode = (string)$_POST['auth'];

    if (!password_verify($authcode, AUTH)) die('E401');

    $path = BIN_PATH . basename($name);

    if (strlen($name) !== 0 && !file_exists($path)) {
        $contents = (string)$_POST['contents'];
        file_put_contents($path, $contents);
        echo $name;
    } else {
        die('E400');
    }
?>

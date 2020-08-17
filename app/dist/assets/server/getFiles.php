<?php
define('AUTH', preg_replace("/\r|\n|\r\n|\n\r|\s/", '', (string)file_get_contents('auth.cab')));
$authcode = (string)$_POST['auth'];
if (!password_verify($authcode, AUTH)) die('E401');
define('PATH', (string)file_get_contents('.path'));

$filetype = $_POST['filetype'];
$glob = '';

switch ($filetype) {
    case 'json':
        $glob = '*.json';
        break;
    default:
        die('E400');
}
$glob = PATH . $glob;

$files = glob($glob);

$data = array();

foreach ($files as $file) {
    $data[] = str_replace(PATH, '', $file);
}

echo json_encode($data);

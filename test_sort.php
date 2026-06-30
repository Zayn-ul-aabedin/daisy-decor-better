<?php
$sc_dir = 'assets/service-cards/';
$sc_images = is_dir($sc_dir) ? array_diff(scandir($sc_dir), array('..', '.')) : [];
natsort($sc_images);
print_r($sc_images);
?>

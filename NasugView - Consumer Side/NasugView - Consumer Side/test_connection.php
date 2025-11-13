<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

echo json_encode([
    "success" => true,
    "message" => "PHP server is working!",
    "timestamp" => date('Y-m-d H:i:s'),
    "post_data" => $_POST,
    "files" => $_FILES
]);
?>

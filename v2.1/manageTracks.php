<?php
    require "configuration_my.php";
    
    header("Access-Control-Allow-Origin: *");
    header('Content-Type: application/json');

    // If true, include also hidden tracks. Requires secret key $key
    $key = isset($_GET['key']) ? $_GET['key'] : null;
    $track_uid = isset($_GET['track_uid']) ? $_GET['track_uid'] : null;
    $action = isset($_GET['action']) ? $_GET['action'] : null;
    $newname = isset($_GET['newname']) ? $_GET['newname'] : null;


    if (!isset($key) || $key != $secretKey)
        die('{"error": "The key is not set or invalid"}');
    if (!isset($track_uid))
        die('{"error": "track_uid is a mandatory field"}');
    if (!isset($action))
        die('{"error": "action is a mandatory field"}');

    // Connect to database
    $conn = new mysqli($dbHost, $dbUser, $dbPassword, $dbName);
    if ($conn->connect_error) {
        // die('{"error": "Failed to connect to DB: ' . $conn->connect_error . '"}');
        die('{"error": "Failed to connect to Database"}');
    }

    // Enable/Disable action
    if (strtolower($action) == 'enable' || strtolower($action) == 'disable') {
        $hiddenVal = strtolower($action) == 'disable' ? 'true' : 'false';
        $sql = 'UPDATE `osmand_tracks` SET `hidden`='.$hiddenVal.' WHERE `uid`=' . $track_uid;
        $res = $conn->query($sql);
        if ($conn->affected_rows === 1) {
            if (is_object($res)) $res->close();
            die('{"result": "success"}');
        } else if ($conn->affected_rows === 0) {
            if (is_object($res)) $res->close();
            die('{"error": "0 tracks updated. Please check provided `track_uid` field."}');
        } else {
            if (is_object($res)) $res->close();
            die('{"error": "0 tracks updated. Internal error occurred."}');
        }
    }

    // Rename action
    if (strtolower($action) == 'rename') {
        if (!isset($newname))
            die('{"error": "newname is a mandatory field if `action`==\'rename\'"}');
        $sql = "UPDATE `osmand_tracks` SET `name`='".$newname."' WHERE `uid`=" . $track_uid;
        $res = $conn->query($sql);
        if ($conn->affected_rows === 1) {
            if (is_object($res)) $res->close();
            die('{"result": "success"}');
        } else if ($conn->affected_rows === 0) {
            if (is_object($res)) $res->close();
            die('{"error": "0 tracks updated. Please check provided `track_uid` field."}');
        } else {
            if (is_object($res)) $res->close();
            die('{"error": "0 tracks updated. Internal error occurred."}');
        }
    }

    die('{"error": "field `action` is not recognized"}');
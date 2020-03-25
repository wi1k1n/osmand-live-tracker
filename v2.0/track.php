<?php
    require "configuration.php";

    $key = isset($_GET['key']) ? $_GET['key'] : null;
    if (!isset($key) || $key == 'CHANGEME') {
        die('[Error] Key not set');
    }

    if ($key != $secretKey) {
        print '[Error] Invalid key';
        return;
    }

    $data = array(
        'lat' => isset($_GET['lat']) ? "'".floatval($_GET['lat'])."'" : 'NULL',
        'lon' => isset($_GET['lon']) ? "'".floatval($_GET['lon'])."'" : 'NULL',
        'timestamp' => isset($_GET['timestamp']) ? "'".date('Y-m-d H:i:s', time()-intval($_GET['timestamp'])/1000.0)."'" : 'NULL',
        'hdop' => isset($_GET['hdop']) ? "'".floatval($_GET['hdop'])."'" : 'NULL',
        'altitude' => isset($_GET['altitude']) ? "'".floatval($_GET['altitude'])."'" : 'NULL',
        'speed' => isset($_GET['speed']) ? "'".floatval($_GET['speed'])."'" : 'NULL',
        'sender' => isset($_GET['sender']) ? "'".$_GET['sender']."'" : 'NULL',
        'track_uid' => isset($_GET['track_uid']) ? "'".$_GET['track_uid']."'" : 0
    );

    if (!isset($data['lat']) || !isset($data['lon'])) {
        print '[Error] \'lon\' and \'lat\' arguments are mandatory!';
        return;
    }

    // var_dump($data);

    $conn = new mysqli($dbHost, $dbUser, $dbPassword, $dbName);
    if ($conn->connect_error) {
        die("[Error] Failed to connect to DB");//: " . $conn->connect_error);
    }

    $query = "INSERT INTO `osmand_online`(`timestamp_server`, `timestamp_log`, `lat`, `lon`, `hdop`, `altitude`, `speed`, `sender`, `track_uid`) VALUES(current_timestamp(), ".$data['timestamp'].", ".$data['lat'].", ".$data['lon'].", ".$data['hdop'].", ".$data['altitude'].", ".$data['speed'].", ".$data['sender'].", ".$data['track_uid'].")";
    $res = $conn->query($query);
    if (!$res) {
        // echo "[Error] Failed to insert data to DB.";
        echo "[Error] Failed to insert data to DB. Query: " . $query;
    }
    if (is_object($res)) {
        $res->close();
    }

    $conn -> close();
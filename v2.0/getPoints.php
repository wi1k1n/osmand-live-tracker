<?php
    require "configuration_my.php";

    // Track uid to filter all entries in DB
    $track_uid = isset($_GET['track_uid']) ? $_GET['track_uid'] : null;

    // Whether the whole table should be sent or only few last updates
    $starting = isset($_GET['starting']) ? $_GET['starting'] : null;
    $ending = isset($_GET['ending']) ? $_GET['ending'] : null;

    // Connect to database
    $conn = new mysqli($dbHost, $dbUser, $dbPassword, $dbName);
    if ($conn->connect_error) {
        // die('{"error": "Failed to connect to DB: ' . $conn->connect_error . '"}');
        die('{"error": "Failed to connect to Database"}');
    }

    // >>> Get datapoints
    $sql = "SELECT * FROM `osmand_online`    ";

    // Handle $starting, $ending $_GET variables
    if ($starting != null || $ending != null || $track_uid != null) $sql .= " WHERE";
    if ($track_uid != null) $sql .= " track_uid = " . $track_uid . ' AND';
    if ($starting != null) $sql .= " uid > " . $starting . ' AND';
    if ($ending != null) $sql .= " uid < " . $ending . ' AND';
    $sql = substr($sql, 0, strlen($sql) - 4);

    $res = $conn->query($sql);
    if (!$res) die('{"error": "Failed to get data (points) from Database"}');
    $points = '[]';
	if ($res->num_rows > 0) {
        $points = '[';
        while ($row = $res->fetch_assoc()) {
        	$points = $points . '{"uid": ' . $row['uid']
        					 . ', "timestamp_server": ' . ($row['timestamp_server'] ? ('"'.$row['timestamp_server'].'"') : 'null')
                             . ', "timestamp_log": ' . ($row['timestamp_log'] ? ('"'.$row['timestamp_log'].'"') : 'null')
                             . ', "lat": ' . ($row['lat'])
                             . ', "lon": ' . ($row['lon'])
                             . ', "hdop": ' . ($row['hdop'] ? $row['hdop'] : 'null')
                             . ', "altitude": ' . ($row['altitude'] ? $row['altitude'] : 'null')
                             . ', "speed": ' . ($row['speed'] ? $row['speed'] : 'null')
                             . ', "sender": ' . ($row['sender'] ? ('"'.$row['sender'].'"') : 'null')
                             . ', "track_uid": ' . ($row['track_uid'] ? ('"'.$row['track_uid'].'"') : 'null')
                             . '},';
        }
        if (is_object($res)) $res->close();
        $points = substr($points, 0, strlen($points) - 1) . "]";
    }

    $output = '{"points": '.$points.'}';

    header("Access-Control-Allow-Origin: *");
    header('Content-Type: application/json');
    echo $output;
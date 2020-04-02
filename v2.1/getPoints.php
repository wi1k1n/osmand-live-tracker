<?php
    require "configuration_my.php";

    header("Access-Control-Allow-Origin: *");
    header('Content-Type: application/json');

    // Track uid to filter all entries in DB
    $track_uid = isset($_GET['track_uid']) ? $_GET['track_uid'] : null;
    $key = isset($_GET['key']) ? $_GET['key'] : null; // for ignoring `hidden` field

    // Whether the whole table should be sent or only few last updates
    $startingWithUid = isset($_GET['startingWithUid']) ? $_GET['startingWithUid'] : null;
    $offset = isset($_GET['offset']) ? $_GET['offset'] : null;
    $limit = isset($_GET['limit']) ? $_GET['limit'] : null;

    // Validation part
    if (!isset($track_uid))
    	die('{"error": "track_uid field must be specified"');
    if (isset($startingWithUid)) {
    	$startingWithUid = intval($startingWithUid);
    }
    if (isset($limit)) {
    	$limit = intval($limit);
    	if ($limit < 0) die('{"error": "limit field is invalid"}');
    }
    if (isset($offset)) {
    	$offset = intval($offset);
    	if ($offset < 0) die('{"error": "offset field is invalid"}');
    }

    // Connect to database
    $conn = new mysqli($dbHost, $dbUser, $dbPassword, $dbName);
    if ($conn->connect_error) {
        // die('{"error": "Failed to connect to DB: ' . $conn->connect_error . '"}');
        die('{"error": "Failed to connect to Database"}');
    }

    // >>> Check if track is available
    $sql = "SELECT * FROM `osmand_tracks` WHERE `uid`=".$track_uid;
    if (!isset($key) || $key != $secretKey)
    	$sql .= " AND `hidden`<>1";

    // echo $sql;
    $res = $conn->query($sql);
    if (!$res) die('{"error": "Failed to get data (tracks) from Database"}');
    if ($res->num_rows === 0) die('{"error": "Track with provided `track_uid` does not exist"}');
    if (is_object($res)) $res->close();


    // >>> Get datapoints
    $sql = "SELECT * FROM `osmand_online` WHERE `track_uid`=".$track_uid;
    if (isset($startingWithUid))
    	$sql .= ' AND `uid` > '.$startingWithUid;

    // Handle $offset, $limit variables
    $manualOffsetting = false; // because of stupid MySQL limitation on using OFFSET only together with LIMIT
    if (isset($limit)) {
    	$sql .= " LIMIT " . $limit;
    	if (isset($offset)) {
    		$sql .= " OFFSET " . $offset;
    	}
    } else {
    	$manualOffsetting = true;
    }

    $res = $conn->query($sql);
    if (!$res) die('{"error": "Failed to get data (points) from Database"}');
    $points = '[]';
	if ($res->num_rows > 0) {
        $points = '[';
        if ($manualOffsetting) {
        	for ($i = 0; $i < $offset; $i++)
        		$res->fetch_array(MYSQLI_NUM);
        }
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
        if (strlen($points) > 1)
        	$points = substr($points, 0, strlen($points) - 1);
        $points = $points . "]";
    }

    $output = '{"points": '.$points.'}';

    echo $output;
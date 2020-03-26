<?php
    require "configuration.php";

    // Whether the whole table should be sent or only few last updates
    $starting = isset($_GET['starting']) ? $_GET['starting'] : null;
    $ending = isset($_GET['ending']) ? $_GET['ending'] : null;

    header("Access-Control-Allow-Origin: *");
    header('Content-Type: application/json');

    // Connect to database
    $conn = new mysqli($dbHost, $dbUser, $dbPassword, $dbName);
    if ($conn->connect_error) {
        // die('{"error": "Failed to connect to DB: ' . $conn->connect_error . '"}');
        die('{"error": "Failed to connect to Database"}');
    }

    // TODO: better behaviour is a separate request for tracks and separate request for only corresponding points
    // >>> Get table of tracks
    $tracks = '[';
    $sql = "SELECT * FROM `osmand_tracks`";
    $res = $conn->query($sql);
    if (!$res) die('{"error": "Failed to get data (tracks) from Database"}');
    if ($res->num_rows === 0) die('{"tracks": [], "points": []}');
    while ($row = $res->fetch_assoc()) {
        $tracks = $tracks . '{"uid": ' . $row['uid']
                         . ', "name": ' . ($row['name'] ? ('"'.$row['name'].'"') : 'null')
                         . ', "from_lon": ' . ($row['from_lon'] ? ('"'.$row['from_lon'].'"') : 'null')
                         . ', "from_lat": ' . ($row['from_lat'] ? ('"'.$row['from_lat'].'"') : 'null')
                         . ', "to_lon": ' . ($row['to_lon'] ? ('"'.$row['to_lon'].'"') : 'null')
                         . ', "to_lat": ' . ($row['to_lat'] ? ('"'.$row['to_lat'].'"') : 'null')
                         . '},';
    }
    if (is_object($res)) $res->close();
    $tracks = substr($tracks, 0, strlen($tracks) - 1) . "]";


    // >>> Get datapoints
    $sql = "SELECT * FROM `osmand_online`";

    // Handle $starting, $ending $_GET variables
    if ($starting || $ending) $sql .= " WHERE";
    if ($starting) $sql .= " uid > " . $starting . ' AND';
    if ($ending) $sql .= " uid < " . $ending . ' AND';
    if ($starting || $ending) $sql = substr($sql, 0, strlen($sql) - 4);

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

    $output = '{"tracks": '.$tracks.', "points": '.$points.'}';
    echo $output;
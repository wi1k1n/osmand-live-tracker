<?php
    require "configuration_my.php";

    // Connect to database
    $conn = new mysqli($dbHost, $dbUser, $dbPassword, $dbName);
    if ($conn->connect_error) {
        // die('{"error": "Failed to connect to DB: ' . $conn->connect_error . '"}');
        die('{"error": "Failed to connect to Database"}');
    }

    // >>> Get table of tracks
    $tracks = '[';
    $sql = "SELECT * FROM `osmand_tracks`";
    $res = $conn->query($sql);
    if (!$res) die('{"error": "Failed to get data (tracks) from Database"}');
    if ($res->num_rows === 0) die('{"tracks": []');
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

    header("Access-Control-Allow-Origin: *");
    header('Content-Type: application/json');
    echo '{"tracks": '.$tracks.'}';
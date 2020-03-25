<?php
    require "configuration.php";

    // Whether the whole table should be sent or only few last updates
    $starting = isset($_GET['starting']) ? $_GET['starting'] : null;
    $ending = isset($_GET['ending']) ? $_GET['ending'] : null;

    // Connect to database
    $conn = new mysqli($dbHost, $dbUser, $dbPassword, $dbName);
    if ($conn->connect_error) {
        die("[Error] Failed to connect to DB: " . $conn->connect_error);
        //die("[Error] Failed to connect to DB");
    }

    $sql = "SELECT * FROM osmand_online";

    if ($starting || $ending) $sql .= " WHERE";
    if ($starting) $sql .= " uid > " . $starting . ' AND';
    if ($ending) $sql .= " uid < " . $ending . ' AND';
    if ($starting || $ending) $sql = substr($sql, 0, strlen($sql) - 4);
	
    $res = $conn->query($sql);

	if ($res->num_rows === 0) {
	    echo "[]";
	    exit;
	}

	$output = "[";
    while ($row = $res->fetch_assoc()) {
    	$output = $output . '{"uid": ' . $row['uid']
    					 . ', "timestamp_server": ' . ($row['timestamp_server'] ? ('"'.$row['timestamp_server'].'"') : 'null')
                         . ', "timestamp_log": ' . ($row['timestamp_log'] ? ('"'.$row['timestamp_log'].'"') : 'null')
                         . ', "lat": ' . ($row['lat'])
                         . ', "lon": ' . ($row['lon'])
                         . ', "hdop": ' . ($row['hdop'] ? $row['hdop'] : 'null')
                         . ', "altitude": ' . ($row['altitude'] ? $row['altitude'] : 'null')
                         . ', "speed": ' . ($row['speed'] ? $row['speed'] : 'null')
                         . ', "sender": ' . ($row['sender'] ? $row['sender'] : 'null')
                         . '},';
    }
    $res->close();

    header('Content-Type: application/json');
    echo substr($output, 0, strlen($output) - 1) . "]";
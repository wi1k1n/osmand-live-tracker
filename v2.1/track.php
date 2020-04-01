<?php
    require "configuration_my.php";

    // Check secret key
    $key = isset($_GET['key']) ? $_GET['key'] : null;
    if (!isset($key) || $key == 'CHANGEME') die('[Error] Key not set');
    if ($key != $secretKey) die('[Error] Invalid key');

    // Parse $_GET values
    // TODO: add 'bearing' field
    $data = array(
        'lat' => isset($_GET['lat']) ? "'".floatval($_GET['lat'])."'" : 'NULL',
        'lon' => isset($_GET['lon']) ? "'".floatval($_GET['lon'])."'" : 'NULL',
        'timestamp' => isset($_GET['timestamp']) ? "'".date('Y-m-d H:i:s', time()-intval($_GET['timestamp'])/1000.0)."'" : "current_timestamp()",
        'hdop' => isset($_GET['hdop']) ? "'".floatval($_GET['hdop'])."'" : 'NULL',
        'altitude' => isset($_GET['altitude']) ? "'".floatval($_GET['altitude'])."'" : 'NULL',
        'speed' => isset($_GET['speed']) ? "'".floatval($_GET['speed'])."'" : 'NULL',
        'sender' => isset($_GET['sender']) ? "'".$_GET['sender']."'" : 'NULL',
        'track' => isset($_GET['track']) ? "'".$_GET['track']."'" : null
    );

    // Longitude and Latitude values are mandatory
    if (!isset($data['lat']) || !isset($data['lon'])) die('[Error] \'lon\' and \'lat\' arguments are mandatory!');

    // Connect to database
    $conn = new mysqli($dbHost, $dbUser, $dbPassword, $dbName);
    if ($conn->connect_error) {
        die("[Error] Failed to connect to DB");//: " . $conn->connect_error);
    }

    // Makes query to DB and returns null if track was not found, or DB-row otherwise
    function getTrackEntry($conn, $trackName) {
        $sql = "SELECT * FROM `osmand_tracks` WHERE name=".$trackName;
        $res = $conn->query($sql);
        if ($res && is_object($res)) {
            if ($res->num_rows === 0) {
                $res->close();
                return null;
            }
            else {
                $row = $res->fetch_assoc();
                $res->close();
                return $row;
            }
        }
        if (is_object($res)) $res->close();
        return null;
    }

    $track_uid = 0; // 0 corresponds to Unknown entry in DB
    // Get track_uid from DB if track name is specified in $_GET
    if (isset($data['track'])) {
        $track = getTrackEntry($conn, $data['track']);
        if (isset($track['uid']))
            $track_uid = $track['uid'];
        else { // Track was not found in DB
            // Then create new entry ourselves
            $sql = "INSERT INTO `osmand_tracks`(`name`) VALUES(".$data['track'].")";
            $res = $conn->query($sql);
            if ($res) {
                // Insertion of new track entry successfull
                $track_new = getTrackEntry($conn, $data['track']);
                if (isset($track_new) && isset($track_new['uid']))
                    $track_uid = $track_new['uid'];
            }
            // If failed, then leave everything as it is. UID of 'Unknown' is already stored in $track_uid
            if (is_object($res)) $res->close();
        }
    }

    $query = "INSERT INTO `osmand_online`(`timestamp_server`, `timestamp_log`, `lat`, `lon`, `hdop`, `altitude`, `speed`, `sender`, `track_uid`) VALUES(current_timestamp(), ".$data['timestamp'].", ".$data['lat'].", ".$data['lon'].", ".$data['hdop'].", ".$data['altitude'].", ".$data['speed'].", ".$data['sender'].", ".$track_uid.")";
    $res = $conn->query($query);
    if (!$res) {
        // echo "[Error] Failed to insert data to DB.";
        echo "[Error] Failed to insert data to DB. Query: " . $query;
    }
    if (is_object($res)) {
        $res->close();
    }
    $conn -> close();
    echo '';
const URL_GETPOINTS = 'http://batukah.000webhostapp.com/osholm/v2.0/getPoints.php';
const URL_GETTRACKS = 'http://batukah.000webhostapp.com/osholm/v2.0/getTracks.php';
const CURSOR_TOLERANCE = 15;
const HDOP_TITLES = ['Excellent accuracy', 'Average accuracy', 'Poor accuracy', ''];
const HDOP_CLASSNAMES = ['hdop-excellent', 'hdop-average', 'hdop-poor', 'hdop-none'];
const TIMESTAMP_CLASSNAMES = ['timestamp-log', 'timestamp-server'];
const TIMESTAMP_SERVER_TITLE = 'This is a timestamp of request (not measurement)';

const DEBUG = true;
const DEBUG_DATABATCH = 50;
const _ = require('lodash');
const fs = require('fs');

const PATH_TO_DAEMON = '../../daemon-build';

module.exports = {
    logFileExists: () => {
        // Log file is generated by Daemon in /daemon folder
        return _.filter(logDirContent('/output'), file => _.includes(file, '.log'))[0];
    },
    logFileMoved: logFileName => {
        // Log file is moved to /daemon/logs after Daemon is stopped
        return _.filter(logDirContent('/output/logs'), files => _.includes(files, logFileName))[0];
    },
    readFile: (dirPath, logFileName) => {
        return fs.readFileSync(PATH_TO_DAEMON + dirPath + logFileName, 'utf8');
    }
};

const logDirContent = path =>
    fs.readdirSync(PATH_TO_DAEMON + path);

var exec = require('child_process').execSync;
var cordovaProjects = [
    'cordova-amazon-fireos',
    'cordova-android',
    'cordova-app-harness',
    'cordova-app-hello-world',
    'cordova-bada',
    'cordova-blackberry',
    'cordova-browser',
    'cordova-cli',
    'cordova-coho',
    'cordova-docs',
    'cordova-firefoxos',
    'cordova-ios',
    'cordova-js',
    'cordova-labs',
    'cordova-lib',
    'cordova-medic',
    'cordova-mobile-spec',
    'cordova-osx',
    'cordova-plugin-battery-status',
    'cordova-plugin-camera',
    'cordova-plugin-console',
    'cordova-plugin-contacts',
    'cordova-plugin-device-motion',
    'cordova-plugin-device-orientation',
    'cordova-plugin-device',
    'cordova-plugin-dialogs',
    'cordova-plugin-file-transfer',
    'cordova-plugin-file',
    'cordova-plugin-geolocation',
    'cordova-plugin-globalization',
    'cordova-plugin-inappbrowser',
    'cordova-plugin-media-capture',
    'cordova-plugin-media',
    'cordova-plugin-network-information',
    'cordova-plugin-splashscreen',
    'cordova-plugin-statusbar',
    'cordova-plugin-test-framework',
    'cordova-plugin-vibration',
    'cordova-plugins',
    'cordova-plugman',
    'cordova-qt',
    'cordova-registry-web',
    'cordova-registry',
    'cordova-tizen',
    'cordova-ubuntu',
    'cordova-webos',
    'cordova-weinre',
    'cordova-windows',
    'cordova-wp8'
]

// Create a user token otherwise you'll hit API rate limit pretty fast
// Link: https://github.com/settings/applications
var token = '';
var tokenStr = token ? ' -H "Authorization: token ' + token + '" ' : ' ';

function inactiveBranch(owner, repo, duration) {
    var result = [];
    var branches = exec('curl -s' + tokenStr + '"https://api.github.com/repos/'
        + owner + '/' + repo + '/branches"', 'utf8');
    try {
        branches = JSON.parse(branches);
        if (branches.message) throw Error(branches.message);
    } catch (e) {
        return ['err: ' + e.message];
    }

    branches.forEach(function(branch) {
        try {
            var commit = exec('curl -s' + tokenStr + branch.commit.url, 'utf8');
            commit = JSON.parse(commit);
            if (commit.message) throw Error(commit.message);
        } catch (e) {
            return ['err: ' + e.message];
        }

        var dateDif = Math.floor((new Date() - new Date(commit.commit.author.date)) / duration);

        if (dateDif > 15) {
            result.push('\x1B[33m' + branch.name + "\x1B[39m has been inactive for \x1B[33m" + dateDif + "\x1B[39m days. Last commit by " +
                '\x1B[33m' + commit.commit.author.name + '\x1B[39m');
        }
    });

    return result;
}

cordovaProjects.forEach(function(project) {
    var oneDay=1000*60*60*24;
    console.log('Inactive Branches for \x1B[32m' + project + '\x1B[39m');
    var branches = inactiveBranch('msopentech', project, oneDay);
    console.log(branches.join('\n'));
    console.log('');
})

#!/usr/bin/env node
var exec = require('child_process').execSync;

// Create a user token otherwise you'll hit API rate limit pretty fast
// Link: https://github.com/settings/applications
var token = process.env.ghkey || '',
    tokenStr;

if (token) {
    tokenStr = ' -H "Authorization: token ' + token + '" ';
} else {
    console.log('\n\x1B[31mWarning: ghkey not set, you might hit API rate limit.\x1B[39m\n');
    tokenStr = ' ';
}

function inactiveBranch(owner, repo, duration) {
    var result = [];
    var branches = exec('curl -s' + tokenStr + '"https://api.github.com/repos/'
        + owner + '/' + repo + '/branches"', {encoding: 'utf8'});
    try {
        branches = JSON.parse(branches);
        if (branches.message) throw Error(branches.message);
    } catch (e) {
        return ['err: ' + e.message];
    }

    branches.forEach(function(branch) {
        try {
            var commit = exec('curl -s' + tokenStr + branch.commit.url, {encoding: 'utf8'});
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

console.log('Fetching repo info from github..');

// get list of msopentech cordova repos
var msOTPages = exec('curl -s -I' + tokenStr + 'https://api.github.com/users/msopentech/repos', {encoding: 'utf8'});

msOTPages = msOTPages.split('\n').filter(function(line){
    return ~line.indexOf('Link: ');
})[0];

msOTPages = msOTPages.split(',')[1];
msOTPages = msOTPages.match(/page=(\d+)/i)[1];

var msOTRepos = [];

for (var i = 1; i <= msOTPages; i++) {
    var repos = exec('curl -s' + tokenStr + '"https://api.github.com/orgs/msopentech/repos?page=' + i + '"');
    repos = JSON.parse(repos);
    repos = repos.filter(function(repo) {
        return !!~repo.name.indexOf('cordova');
    }).map(function(repo) {
        return repo.name;
    });
    msOTRepos = msOTRepos.concat(repos);
};

// Sort elements
msOTRepos = msOTRepos.sort();

var oneDay = 1000*60*60*24;

msOTRepos.forEach(function(project) {
    console.log('Finding stale branches for \x1B[32m' + project + '\x1B[39m');
    var branches = inactiveBranch('msopentech', project, oneDay);
    console.log(branches.join('\n'));
    console.log('');
});

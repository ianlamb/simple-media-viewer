var walk = require('walk');
var _ = require('underscore');
var express = require('express');
var app = express();
var path = require('path');
var gm = require('gm');
var fs = require('fs');

var walkDir = '/Users/ian/Pictures/lol';

app.set('port', process.env.PORT || 8000);

var directories = [{
    root: walkDir,
    path: '/',
    fullPath: walkDir,
    name: 'base',
    files: []
}];

function walkDirectories() {
    return new Promise(function(resolve) {
        var walker = walk.walk(walkDir, { followLinks: false });

        walker.on('directory', function(root, stat, next) {
            var directory = {
                root: root,
                path: root.split(walkDir)[1] + "/" + stat.name + "/",
                fullPath: root + '/' + stat.name,
                name: stat.name,
                files: []
            };

            // todo: fix shuffle
            _.shuffle(directory.files);

            directories.push(directory);
            next();
        });

        walker.on('file', function(root, stat, next) {
            var imagePath = path.resolve(root, stat.name);
            var thumbPath = 'public/thumbnails/' + stat.name;
            var url = root.split(walkDir)[1] + "/" + stat.name;

            directories.some(function(dir) {
                if (dir.fullPath === root) {
                    dir.files.push({
                        root: root,
                        url: url,
                        name: stat.name
                    });
                    return true;
                }
                return false;
            });

            // make thumbnail
            gm(imagePath)
                .resize(240, 240)
                .noProfile()
                .write(thumbPath, function (err) {
                    if (!err) {
                        console.log('thumb generated:', thumbPath);
                    }
                });

            next();
        });

        walker.on('end', function() {
            console.log('walking directories complete');
            resolve();
        });
    });
}

walkDirectories().then(function() {
    for(var i = 0; i < directories.length; i++) {
        var dir = directories[i];
        var route = '/api/media' + dir.path;
        console.log('adding endpoint', route);
        app.get(route, function(req, res) {
            var data = {
                currentDir: this.name,
                files: this.files
            };
            res.send(data);
        }.bind(dir));
    }

    app.get('/api/directories', function(req, res) {
        var data = {
            directories: directories.map(function(dir) {
                return {
                    root: dir.root,
                    name: dir.name,
                    path: dir.path
                };
            })
        }
        res.send(data);
    });

    app.use(express.static(__dirname + '/thumbnails'));
    app.use(express.static(__dirname + '/public'));
    app.use(express.static(__dirname + '/node_modules'));
    app.use(express.static(walkDir));

    app.get('*', function(req, res) {
        res.sendFile(__dirname + '/public/index.html');
    });

    app.listen(app.get('port'), function() {
        console.log('Listening on port', app.get('port'));
    });
});
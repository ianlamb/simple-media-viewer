var app = angular.module('app', [])
.controller('mainController', function($scope, $http) {

    var imageExtensions = ['jpg', 'jpeg', 'png', 'gif'];
    var videoExtensions = ['webm', 'mp4'];

    $http.get('/api/directories')
        .success(function(data) {
            $scope.directories = data.directories;
        })
        .error(function(err) {
            console.error(err);
        });

    $scope.getFileType = function(file) {
        var parts = file.name.split('.');
        var ext = parts[parts.length-1];
        if (imageExtensions.includes(ext)) {
            return 'image';
        } else if (videoExtensions.includes(ext)) {
            return 'video';
        }
        return;
    }

    function loadMedia(route) {
        $scope.loading = true;
        var url = '/api/media' + route;
        $http.get(url)
            .success(function(data) {
                $scope.files = data.files;
                $scope.currentDir = data.currentDir;
                setTimeout(function() {
                    $scope.loading = false;
                    $scope.$apply();
                    var masonry = new Masonry('.grid', {
                        itemSelector: '.media-container',
                    });
                }, 500);
            })
            .error(function(err) {
                console.error(err);
            });
    }

    loadMedia(location.pathname);

});
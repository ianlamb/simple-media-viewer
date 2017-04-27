$(function() {
    'use strict';

    var imageExtensions = ['jpg', 'jpeg', 'png', 'gif'];
    var videoExtensions = ['webm', 'mp4'];

    var pageSize = 20;
    var currentPage = 1;
    var offsetThreshold = 1600;
    var maxTiles = 50;

    var currentDir;
    var directories = [];
    var files = [];
    var loadedFiles = [];
    
    var isLoading = true;

    var $loading = $('.load');
    var $grid = $('.grid');

    var Lightbox = function() {
        this.element = document.createElement('div');
        this.element.classList.add('lightbox');
        this.element.classList.add('hide');
        this.element.addEventListener('click', function() {
            lightbox.hide();
        });
        document.body.appendChild(this.element);
    }
    
    Lightbox.prototype.setContent = function(html) {
        this.element.innerHTML = html;
    }
    
    Lightbox.prototype.show = function() {
        this.element.classList.remove('hide');
    }
    
    Lightbox.prototype.hide = function() {
        this.element.classList.add('hide');
    }

    var lightbox = new Lightbox();

    $.get('/api/directories')
        .success(function(data) {
            var $directories = $('.directories');
            directories = data.directories;
            directories.forEach(function(dir) {
                var $li = $('<li><a href="' + dir.path + '">' + dir.name + '</a></li>');
                $directories.append($li);
            });
        })
        .error(function(err) {
            console.error(err);
        });
        
    function loading(loading) {
        if (loading === true) {
            // $loading.show();
            isLoading = true;
        } else {
            $loading.hide();
            isLoading = false;
        }
    }

    function getFileType(file) {
        var parts = file.name.split('.');
        var ext = parts[parts.length-1];
        if (imageExtensions.includes(ext)) {
            return 'image';
        } else if (videoExtensions.includes(ext)) {
            return 'video';
        }
        return;
    }
    
    function addTile(file, init) {
        var fileType = getFileType(file);
        var $mediaContainer = $('<div data-type="' + fileType + '" data-url="' + file.url + '" class="media-container"></div>');
        switch (fileType) {
        case 'image':
            var fileName = file.name;
            var parts = file.name.split('.');
            parts[parts.length-2] = parts[parts.length-2];
            var ext = parts[parts.length-1];
            var thumb = '/thumbnails/' + parts.join('.');
            if (ext !== 'gif') {
                fileName = thumb;
            }
            $mediaContainer.append('<img src="' + fileName + '" />');
            break;
        case 'video':
            $mediaContainer.append('<video src="' + file.name + '" autoplay loop muted />');
            break;
        }

        $mediaContainer.on('click', function() {
            var fileType = $(this).data('type');
            var url = $(this).data('url');
            switch (fileType) {
            case 'image':
                lightbox.setContent('<img src="' + url + '" />');
                break;
            case 'video':
                lightbox.setContent('<video src="' + url + '" autoplay loop muted />');
                break;
            }
            lightbox.show();
        });

        // if ($grid.children().length > maxTiles) {
        //     var $first = $('.media-container').first();
        //     $grid.masonry()
        //         .masonry('remove', $first);
        // }
        
        $grid.masonry()
            .append($mediaContainer)
            .masonry('appended', $mediaContainer);
    }
    
    function loadMore() {
        var start = currentPage * pageSize;
        if (start > files.length) {
            return;
        }
        loading(true);
        currentPage++;
        var end = currentPage * pageSize;
        if (end > files.length) {
            end = files.length;
        }
        var newFiles = files.slice(start, end)
        loadedFiles = loadedFiles.concat(newFiles);
        newFiles.forEach(function(file) {
            addTile(file);
        });
        imagesLoaded($grid, function() {
            loading(false);
            $grid.masonry('layout');
        });
    }

    function loadMedia(route) {
        loading(true);
        var url = '/api/media' + route;
        $.get(url)
            .success(function(data) {
                files = data.files;
                loadedFiles = files.slice(0, pageSize);
                currentDir = data.currentDir;
                loadedFiles.forEach(function(file) {
                    addTile(file);
                });
                imagesLoaded($grid, function() {
                    loading(false);
                    $grid.masonry({
                        itemSelector: '.media-container',
                    });
                });
            })
            .error(function(err) {
                console.error(err);
            });
    }

    loadMedia(location.pathname);

    window.addEventListener('scroll', function() {
        var top = document.body.scrollTop;
        var height = document.body.clientHeight;
        var offset = height - top;
        if (offset < offsetThreshold && isLoading === false) {
            loadMore();
        }
        
        // pause videos if they're off screen
        $('video').each(function(){
            if ($(this).is(':in-viewport')) {
                $(this)[0].play();
            } else {
                $(this)[0].pause();
            }
        })
    });

});
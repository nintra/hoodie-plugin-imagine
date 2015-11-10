# Imagine

Imagine is a [hoodie](//hood.ie) plugin for handling image uploads. This is a functional but very early version so there might be some changes in the future.

## features
- resizes images client-side to reduce traffic and server processing time
- create image groups and types to manage images
- automated cropping & resizing
- jpg & png images supported
- define different [filters](http://aheckmann.github.io/gm/docs.html) (uses GraphicsMagick)
    + sepia
    + monochrome
    + blur 30, 20
    + colorize 100, 0, 0
    + modulate 100, 50


## API
All methods except `.get` are returning promises. Also `.add`, `.update` and `.upsert` call a progress as soon as an image is resized client-side.
```javascript
// uploads an image and returns a image object
hoodie.imagine.upsert(group, dataUrlOrUrl);

hoodie.imagine.add(group, dataUrlOrUrl);
hoodie.imagine.update(id, group, dataUrlOrUrl);

// find an image by an id or an array of ids, returns an image object
hoodie.imagine.get(id);

// find images of current user
// you can also filter the images by group
hoodie.imagine.findOwn([group]);

// remove a single image
hoodie.imagine.remove(id);

// remove all images by current user
hoodie.imagine.removeOwn([group]);

// a preview image will be returned by a progress call (.add and .update only)
previewImage.id; // final id of the image, keep it for later ;)
previewImage.dataUrl; // dataUrl of resized image
previewImage.width; // width of resized image
previewImage.height; // height of resized image
previewImage.canvas; // canvas used for resizing, you can copy it to show a preview

// an image object has an id property and a url method. 
image.id;
image.url(type);
```


## keep in mind
There is currently no group/type update mechanism. Your changes will be applied to new uploads only (`.add`, `.update`). You *need* to restart the hoodie server to apply the configuration.


## example with data-url
```javascript
// upload file
function handleFile(file) {
    return function(ev) {
        var dataUrl = ev.target.result;

        hoodie.imagine.add('profile', 'data:image/png;base64,...')
            .progress(function(image) { // gets only called when using data-url
                // image id and resized image is ready    
                // image properties: id, dataUrl, width, height, canvas
                            
                // show preview image
                $('img.profile-picture').attr('src', image.dataUrl);

                // or copy the canvas
                canvasContext.drawImage(image.canvas, 0, 0);
            })
            .done(function(image) {
                // image has been saved on the server
                $('img.profile-picture').attr('src', image.url('detail'));
            })
            .fail(function(error) {
                // oh noes
                console.warn(error);
            });        
    };
}



// handle selection of file input
function handleFileSelect(ev) {
    ev.preventDefault();

    var files = ev.target.files;

    $.each(files, function(index, file) {
        if (!file.type.match('image.*')) {
            return false;
        }

        var reader = new FileReader();
        reader.onload = handleFile(file);
        reader.readAsDataURL(file);
    });
}

$('#file-input').on('change', handleFileSelect);
```


## wishlist
- tests needed
- catch 'quota exceeded'
- allow uploads with blob image data e.g. by using `canvas.toBlob`
- save images at hosting services
- integrate [pica](https://github.com/nodeca/pica) for high quality frontend resizing? Current [method](http://stackoverflow.com/questions/17861447/html5-canvas-drawimage-how-to-apply-antialiasing) uses a very fast step-wise canvas resizing with good quality.
- user blacklist
- watermark

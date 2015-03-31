# Imagine

Imagine is a [hoodie](//hood.ie) plugin for handling image uploads. This is a functional but very early version so there might be some changes in the future.

## features
- resizes images client-side to reduce traffic and server processing time
- uploads images when a connection to the server is established
- images may be public or private
- verify images in the backend (pre- or post-verification)
- create image groups and types to manage images
- automated cropping & resizing
- jpg & png images supported
- define different [filters](http://aheckmann.github.io/gm/docs.html) (uses GraphicsMagick)
    + sepia
    + monochrome
    + blur 30, 20
    + colorize 100, 0, 0
    + modulate 100, 50


## keep in mind
There is currently no group/type update mechanism. Your changes will be applied to new uploads only (`.add`, `.update`). When changing the configuration you have to get a newly build hoodie.js. It may be sufficient to refresh the page. You *don't need* to restart the hoodie server to apply the configuration.


## API
All plugin methods are returning promises. 
```
// uploads an image and returns a image object
hoodie.imagine.add(group, dataUrl);

// update the image referenced by id
hoodie.imagine.update(id, group, dataUrl);

// find a images by an id or an array of ids
hoodie.imagine.find(id);

// find images of current user
// you can also filter the images by group
hoodie.imagine.findOwn([group]);

// remove a single image
hoodie.imagine.remove(id);

// remove all images by current user
hoodie.imagine.removeOwn([group]);

// a image object has a id property and a url method. 
image.id
image.url(type)
```


## example
```
hoodie.imagine.add('profile', 'data:image/png;base64,...')
    .done(function(image) {
        $('img.profile-picture').attr('src', image.url('detail'));
    })
    .fail(function(error) {
        // oh noes
    });
```


## wishlist
- tests needed
- catch 'quota exceeded'
- allow uploads with blob image data e.g. by using `canvas.toBlob`
- save images at hosting services
- integrate [pica](https://github.com/nodeca/pica) for high quality frontend resizing? Current [method](http://stackoverflow.com/questions/17861447/html5-canvas-drawimage-how-to-apply-antialiasing) uses a very fast step-wise canvas resizing with good quality.
- user blacklist
- additional data e.g. image size in image objects
- watermark
- verify event for user
- remove event for user


## release history
- 0.1.0 initial release

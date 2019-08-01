SHIFTBOX
==

#### Simple and clever way to display large images on ANY screen


## What is Shiftbox?

Shiftbox is a jQuery plugin to display single or gallery of images of any size on **any** screen. This is fully responsive on-layer image display.

## Installation

### Install with NPM module (Node.js)
`> npm install dszczer/shiftbox`

### Copy from Git
Simply copy files from `dist` directory.

## Basic usage

### Place as many images as you wish
```HTML
<!-- with thumb -->
<a href="image.jpg" data-toggle="shiftbox" data-gallery="example">
    <img src="image_thumb.jpg" alt="Image" title="Image" class="img-responsive">
</a>

<!-- or simply a link -->
<a href="image.jpg" data-toggle="shiftbox" data-gallery="example">Zoom Image</a>
```

### Initialize with default options
```HTML
<script type="text/javascript">
    $('[data-toggle=shiftbox]').shiftbox();
</script>
```
### Custom options
See [*/docs*](https://dszczer.github.io/shiftbox/) for more details.

## Limitations
Currently, Shiftbox is available only for Bootstrap 3 Modal bundle (require modal CSS and JS to work).

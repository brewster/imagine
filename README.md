# Imagine

Imagine is a real-time image processing and storage host built in
[node.js](http://nodejs.org/). Usually, image hosts have to download, 
transform, and re-serve images as discreet operations. Imagine pools these
tasks and streams the results back as soon as possible using a combination
of node's `events.EventEmitter` and HTTP `transfer-encoding: chunked`. 

## Installation

Download the package to a local folder, then run:

``` bash
$ npm install
```

You can then start the server (after setting up the config) with:

``` bash
$ npm start
```

## Uploading an Image

Uploading images is really easy. Simply name the file and pass in its `source`
URL:

    http://localhost:8101/cat?source=http://funny.com/cat_image.jpg

## Retrieving an Image

Once you've uploaded an image, you can retrieve it later using its name:

    http://localhost:8101/cat

## Default Operations on an Image

Imagine ships with [Imagine-Magick](https://github.com/brewster/imagine-magick)
to allow basic transformations on an image just by changing its URL. For
example:

    http://localhost:8101/cat/resize/250x200/blur/5/paint/5/

## Default Image Stores

Imagine has three different image storage options included by default:

- [Imagine-File](https://github.com/brewster/imagine-file) - Local file storage
- [Imagine-Cloudfiles](https://github.com/brewster/imagine-cloudfiles) - 
Rackspace Cloud Files
- [Imagine-S3](https://github.com/brewster/imagine-s3) - Amazon S3

For example, you can switch to S3 by editing your config as such:

``` javascript
"storage": "imagine-s3",

"imagine-s3": {
  "key": "KEY",
  "secret": "SECRET",
  "bucket": "mybucket"
}
```
Visit each storage module's github page for more information.

## Operation & Storage Modules

Imagine was built to be modular and offers simple ways to extend its default
configuration to include all types of operations and data stores, tailoring
the image host to your specific needs. Look at the
[Wiki](https://github.com/brewster/imagine/wiki) for more information.

## Securing Image Uploads

You don't want to host an open image server to the world. Neither do we. For
that, Imagine handles `hmac_sha1` shared key signing. If you set a `signedKey`
option in your config, `source` requests will only be allowed when the request
is also passed a `sign` parameter correspending to the `hmac_sha1` hash of the
`source` URL and your `signedKey`. Like so:

``` javascript
hmac_sha1(source, signedKey);
```

## Winston Logging

Imagine uses [Winston](https://github.com/flatiron/winston) for logging. You
can change the default Console implementation by editing the config. For
instance, the "File" transport:

``` javascript
"logging": [
  {
    "type": "File",
    "filename": "somefile.log"
  }
]
```

## Statsd + Graphite

[Statsd](https://github.com/etsy/statsd) support is also included. To turn it
on, add a segment to your config:

``` javascript
"statsd": {
  "host": "xxx",
  "port": 123,
  "prefix": "some.prefix."
}
```

## License

Imagine is freely distributed under the MIT License. See
[LICENSE](https://github.com/brewster/imagine/blob/master/LICENSE) for more
details.

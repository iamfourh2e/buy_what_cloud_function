
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
const functions = require('firebase-functions');
const {Storage} = require('@google-cloud/storage');
const sharp = require('sharp')
const _ = require('lodash');
const path = require('path');
const os = require('os');
const gcs = new Storage();
exports.generateThumbnail = functions.storage.object().onFinalize(event => {
  const object = event; // The Storage object.
  console.log(object.name);

  const fileBucket = object.bucket; // The Storage bucket that contains the file.
  const filePath = object.name; // File path in the bucket.
  const contentType = object.contentType; // File content type.
  const resourceState = object.resourceState; // The resourceState is 'exists' or 'not_exists' (for file/folder deletions).
  const metageneration = object.metageneration; // Number of times metadata has been generated. New objects have a value of 1.

  const SIZES = [64,128,256]; // Resize target width in pixels

  if (!contentType.startsWith('image/') || resourceState == 'not_exists') {
    console.log('This is not an image.');
    return;
  }

  if (_.includes(filePath, '_thumb')) {
    console.log('already processed image');
    return;
  }


  const fileName = filePath.split('/').pop();
  const bucket = gcs.bucket(fileBucket)
  const tempFilePath = path.join(os.tmpdir(), fileName);

  return bucket.file(filePath).download({
    destination: tempFilePath
  }).then(() => {

    _.each(SIZES, (size) => {
      let str = filePath.split('images');
      let newFileName = `${fileName}_${size}_thumb.png`
      let newFileTemp = path.join(os.tmpdir(), newFileName);
      let newFilePath = `/thumbs/${newFileName}`
      console.log(newFilePath);
      sharp(tempFilePath)
        .resize(size, null)
        .toFile(newFileTemp, (err, info) => {

          bucket.upload(newFileTemp, {
            destination: newFilePath
          });

        });

    })
  })
})
var Upload = require('s3-uploader');

module.exports = new Upload('spookycelluloid', {
  aws: {
    path: 'images/',
    region: 'us-west-1',
    acl: 'public-read'
  },

  cleanup: {
    versions: true,
    original: false
  },

  original: {
    awsImageAcl: 'public-read'
  },

  versions: [{
    maxHeight: 1040,
    maxWidth: 1040,
    format: 'jpg',
    suffix: '-large',
    quality: 80,
    awsImageExpires: 31536000,
    awsImageMaxAge: 31536000
  }]
});

const PDF_THUMB = require('../../assets/default-avatar-pdf-mignature.png');
const AUDIO_THUMB = require('../../assets/defaut-mignature-audio.jpeg');
const VIDEO_THUMB = require('../../assets/placeholder.png');

export function getDefaultThumbnail(type) {
  switch (type) {
    case 'pdf':
    case 'document':
      return PDF_THUMB;
    case 'audio':
      return AUDIO_THUMB;
    case 'video':
    default:
      return VIDEO_THUMB;
  }
}

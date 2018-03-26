var video = document.querySelector("#video");
 
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;
 
if (navigator.getUserMedia) {       
    navigator.getUserMedia({video: true}, handleVideo, videoError);
}
 
function handleVideo(stream) {
    video.src = window.URL.createObjectURL(stream);
}
 
function videoError(e) {
    console.log(e);
}

//var video = document.querySelector('video');
var canvas = document.querySelector('#canvas');
var ctx = canvas.getContext('2d');
var localMediaStream = null;

function snapshot() {
    if (localMediaStream) {
        canvas.width = video.clientWidth
        canvas.height = video.clientHeight
        ctx.drawImage(video, 0, 0);
        document.querySelector('#image').src = canvas.toDataURL('image/png');
        document.querySelector('#video').style.display = "none";
        document.querySelector('#image').style.display = "inline";
    }
}

  video.addEventListener('click', snapshot, false);
  
  // Not showing vendor prefixes or code that works cross-browser.
  navigator.getUserMedia({video: true}, function(stream) {
    video.src = window.URL.createObjectURL(stream);
    localMediaStream = stream;
  }, videoError);

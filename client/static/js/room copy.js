let userName = prompt('Enter your name: ');
const roomId = parseInt(document.querySelector('#roomId').value);
const socket = io({query: { participantName: userName }});
const API_URL = '/api/emotion_handler'
const video = document.querySelector('video');
const messageInput = document.getElementById('message-input');
var socketIsReady = false;
// const canvas = document.querySelector("#video-container > canvas");

var recognition = new webkitSpeechRecognition() || SpeechRecognition();

if (typeof recognition === 'undefined') {
  alert('Browser not supported')
} else {
  recognition.continuous = true;
  recognition.lang = 'en';

  recognition.onresult = function(event) {
    var transcription = '';
    for (var i = event.resultIndex; i < event.results.length; ++i) {
      transcription += event.results[i][0].transcript;
    }
    
    console.log(transcription);
  };
}

socket.on('connect', async () => {
  console.log('connected just fine');
  socketIsReady = true;
  // captureLoop()
});

var constraints = { audio: true, video: { width: 1280, height: 720 } }; 
// let janus;

// if (navigator.mediaDevices.getUserMedia){
//   navigator.mediaDevices.getUserMedia(constraints)
//   .then((stream) => {
//     video.srcObject = stream;
//     video.onloadedmetadata = function(e) {
//       // video.play();
      
//     };
//     // imgCaptured= capture()
//     // socket.emit('emotion',await imgCaptured)
//     // recognition.start();
    
//     // Janus.init({
//     //   debug: 'all',
//     //   callback() {
//     //     janus = new Janus({
//     //       server: 'http://localhost:8088/janus',
//     //       iceServers: [
//     //         { url: 'stun:stun.l.google.com:19302' },
//     //         { url: 'stun:stun1.l.google.com:19302' },
//     //         { url: 'stun:stun2.l.google.com:19302' },
//     //       ],
//     //       success() {
//     //         publishFeed(stream);
//     //       },
//     //     });
//     //   },
//     // });
//   })
//   .catch(() => {
//     alert('Media constraints not satisfied.')
//   });
// }

async function captureLoop(){
    imgCaptured= await capture()
    // console.log(imgCaptured)
    socket.emit('emotion',imgCaptured)
  
    setTimeout(await captureLoop, 2000);
}


async function capture() {
  var canvas = document.querySelector('canvas');
  canvas.width = 640;
  canvas.height = 480;
  var ctx = canvas.getContext('2d');

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  imageCapture = await canvas.toDataURL("image/jpeg");

  return imageCapture;
}

function sendMessage(){
  if(socketIsReady){
    const message = messageInput.value
    socket.emit('sendMessage',message,(resp)=>{
      if(resp['status']==200){
        console.log('Message sent with success')
        messageInput.value = ''
      } else{
        console.log('Error')
        messageInput.value = ''
      }
    })    
  }
}

function publishStream(stream) {

}


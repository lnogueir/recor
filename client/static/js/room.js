let userName = prompt('Enter your name: ');

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

const roomId = parseInt(document.querySelector('#roomId').value);
const socket = io({query: { participantName: userName }});

socket.on('connect', () => {
  console.log('connected just fine');
});

// let janus;

navigator.mediaDevices.getUserMedia({audio: true, video: true})
.then((stream) => {

  recognition.start();

  // Janus.init({
  //   debug: 'all',
  //   callback() {
  //     janus = new Janus({
  //       server: 'http://localhost:8088/janus',
  //       iceServers: [
  //         { url: 'stun:stun.l.google.com:19302' },
  //         { url: 'stun:stun1.l.google.com:19302' },
  //         { url: 'stun:stun2.l.google.com:19302' },
  //       ],
  //       success() {
  //         publishFeed(stream);
  //       },
  //     });
  //   },
  // });
})
.catch(() => {
  alert('Media constraints not satisfied.')
});

function publishStream(stream) {

}


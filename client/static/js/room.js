let userName = prompt('Enter your name: ');

const roomId = parseInt(document.querySelector('#roomId').value);
const socket = io({query: { name: userName }});

socket.on('connect', () => {
  console.log('connected just fine');
});

// let janus;

navigator.mediaDevices.getUserMedia({audio: true, video: true})
.then((stream) => {
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


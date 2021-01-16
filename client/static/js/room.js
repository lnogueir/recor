let userName = prompt('Enter your name: ');
const roomId = parseInt(document.querySelector('#roomId').value);
const socket = io({query: { participantName: userName }});
var socketIsReady = false;
let emotionsInterval = null;
let recognition;
let janus;

socket.on('connect', () => {
  socketIsReady = true;
  
  navigator.mediaDevices.getUserMedia({audio: true, video: true})
  .then((stream) => {
    beginRecognition();
    Janus.init({
      callback() {
        janus = new Janus({
          server: 'http://localhost:8088/janus',
          iceServers: [
            { url: 'stun:stun.l.google.com:19302' },
            { url: 'stun:stun1.l.google.com:19302' },
            { url: 'stun:stun2.l.google.com:19302' },
          ],
          success() {
            publishStream(stream);
          },
        });
      },
    });
  })
  .catch(() => {
    alert('Media constraints not satisfied.')
  });

});
  

function joinFeed(publishers){
  publishers.forEach((publisher) => {
    //if display is defined it means it's a stream from manager and we don't want to subscribe
    if (typeof publisher.display === 'undefined') {
      let remoteHandle;
      janus.attach({
        plugin: 'janus.plugin.videoroom',
        success(remHandle) {
          remoteHandle = remHandle;
          remoteHandle.send({
            message: {
              request: 'join',
              ptype: 'subscriber',
              room: roomId,
              feed: publisher.id,
            },
          });
        },
        onmessage(msg, offerJsep) {
          const event = msg.videoroom;
          if (event === 'attached') {
            remoteHandle.currentPublisherId = msg.id;
          }
          if (offerJsep) {
            remoteHandle.createAnswer({
              jsep: offerJsep,
              media: {
                audioSend: false,
                videoSend: false,
              },
              success(answerJsep) {
                remoteHandle.send({
                  message: {
                    request: 'start',
                    room: roomId
                  },
                  jsep: answerJsep
                });
              },
            });
          }
        },
        onremotestream(remoteStream) {
          const participantFeedId = remoteHandle.currentPublisherId;
          const newParticipantVideo = document.createElement('video');
          newParticipantVideo.autoplay = true;
          $(`#${participantFeedId}`).remove();
          newParticipantVideo.setAttribute('id', `${participantFeedId}`);
          newParticipantVideo.srcObject = remoteStream;
          const participatsVideosDiv = document.querySelector('#participants-video');
          participatsVideosDiv.appendChild(newParticipantVideo);
          $(participatsVideosDiv).children().each(function () {
            if (this.srcObject && !this.srcObject.active) {
              $(this).remove();
            }
          })

        }
      });
    }
  });
}

function beginRecognition() {
  recognition = new webkitSpeechRecognition() || SpeechRecognition();
  if (typeof recognition === 'undefined') {
    alert('Recor does not support this browser')
  } else {
    recognition.continuous = true;
    recognition.lang = 'en';
    recognition.onend = beginRecognition
    recognition.onresult = function(event) {
      var transcription = '';
      for (var i = event.resultIndex; i < event.results.length; ++i) {
        transcription += event.results[i][0].transcript;
      }
      
      socket.emit('transcriptionMessage', transcription);
      console.log(transcription);
    };
  
    recognition.start();
  }
}

function publishStream(stream) {
  let feedHandle;
  janus.attach({
    plugin: 'janus.plugin.videoroom',
    success(handle) {
      feedHandle = handle;
      feedHandle.send({
        message: {
          request: 'join', ptype: 'publisher', room: roomId
        },
      });
    },
    onmessage(feedMsg, feedJsep) {
      if (typeof feedMsg.leaving !== 'undefined') {
        $(`#${feedMsg.leaving}`).remove();
      } 

      if (feedJsep && feedJsep.type === 'answer') {
        feedHandle.handleRemoteJsep({ jsep: feedJsep });
      }

      const status = feedMsg.videoroom;
      switch (status) {
        case 'joined':
          joinFeed(feedMsg.publishers);
          const feedRequest = {
            request: 'configure'
          };
          feedRequest.video = stream.getVideoTracks().length > 0;
          feedRequest.audio = stream.getAudioTracks().length > 0;
          feedHandle.createOffer({
            stream: stream,
            success(offerJsep) {
              feedHandle.send({
                message: feedRequest,
                jsep: offerJsep,
              });
            },
          });
          break;
        case 'event':
          if (typeof feedMsg.publishers !== 'undefined') {
            joinFeed(feedMsg.publishers);
          }
          break;
        default:
          break;
      }
    },
    onlocalstream(localStream) {
        // clearInterval(emotionsInterval)
        const localVideo = document.getElementById('local-stream');
        localToDisplay = new MediaStream();
        const videoTrack = localStream.getVideoTracks()[0];
        localToDisplay.addTrack(videoTrack);
        localVideo.srcObject = localToDisplay;
        // emotionsInterval = setInterval(async () => {
        //   imgCaptured= await capture()
        //   emit('emotion', imgCaptured)
        // }, 2000)
    },
  });
}

async function capture() {
  var canvas = document.querySelector('canvas');
  const video = document.querySelector('local-stream');
  canvas.width = 640;
  canvas.height = 480;
  var ctx = canvas.getContext('2d');

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  imageCapture = await canvas.toDataURL("image/jpeg");

  return imageCapture;
}

async function sendMessage(){
  const messageInput = document.getElementById('message-input');

  if(socketIsReady){
    const message = messageInput.value
    const fileInput =  document.getElementById('file-input');
    if(fileInput.files.length>0){
      var blob = fileInput.files[0]; 
      var reader = new FileReader();
      reader.onload = () => {
        socket.emit('chatMessage', message, reader.result, () => {
            messageInput.value = ''
            fileInput.files[0] = ''
        })    
      }
      reader.readAsDataURL(blob);
    } else{
        socket.emit('chatMessage', message, null, () => {
          messageInput.value = ''
          fileInput.files[0] = ''
      })
    } 
  }
}




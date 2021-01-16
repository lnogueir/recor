let userName = prompt('Enter your name: ');
const roomId = parseInt(document.querySelector('#roomId').value);
const socket = io({query: { participantName: userName }});

var recognition = new webkitSpeechRecognition() || SpeechRecognition();

if (typeof recognition === 'undefined') {
  alert('Browser not supported')
} else {

  socket.on('connect', () => {
    recognition.continuous = true;
    recognition.lang = 'en';

    recognition.onresult = function(event) {
      var transcription = '';
      for (var i = event.resultIndex; i < event.results.length; ++i) {
        transcription += event.results[i][0].transcript;
      }
      
      console.log(transcription);
    };
  });
  
  socket.on('disconnect', () => {
    recognition.stop()
  })
}

let janus;

navigator.mediaDevices.getUserMedia({audio: true, video: true})
.then((stream) => {

  recognition.start();

  Janus.init({
    debug: 'all',
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
            console.log(this);
          })
        }
      });
    }
  });
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
        console.log('received stream');
        const localVideo = document.getElementById('local-stream');
        localVideo.srcObject = localStream;
    },
    webrtcState(isConnected) {
      console.log('webrtc state:', isConnected)
    },
  });
}

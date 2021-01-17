let userName = prompt('Enter your name: ');
const roomId = parseInt(document.querySelector('#roomId').value);
const socket = io({query: { participantName: userName }});
var socketIsReady = false;
let emotionsInterval = null;
let recognition;
let janus;

socket.on('connect', () => {
  socketIsReady = true;
  console.log('pica')
  
  navigator.mediaDevices.getUserMedia({audio: true, video: true})
  .then((stream) => {
    beginRecognition();
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
        clearInterval(emotionsInterval);
        const localVideo = document.getElementById('local-stream');
        localToDisplay = new MediaStream();
        const videoTrack = localStream.getVideoTracks()[0];
        videoTrack.applyConstraints({width: 1920, height: 1080, aspectRatio: 1.777777778});
        localToDisplay.addTrack(videoTrack);
        localVideo.srcObject = localToDisplay;

        emotionsInterval = setInterval(async () => {
          const frameAsBase64 = await captureFrame();
          const frameAsRawBase64Data = frameAsBase64.split(',')[1];
          const url = 'https://vision.googleapis.com/v1/images:annotate?key=AIzaSyDfJW6vD7c5YlcP_f9fqA1mUtiCxhBZ6io'
          const requestOpts = {
            method: 'POST',
            cache: 'no-cache',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              'requests': [
                {
                  'image': { 'content': frameAsRawBase64Data },
                  'features': [
                    {
                      'type': 'FACE_DETECTION',
                      'maxResults': 1
                    }
                  ]
                }
              ]
            })
          }

          fetch (url, requestOpts)
          .then(response => response.json())
          .then(responseJson => {
            let emotion;
            if(Object.keys(responseJson.responses[0]).length == 0){
              emotion = 'AFK'
            }else{
              emotionObj = {
                angerLikelihood: responseJson.responses[0].faceAnnotations[0].angerLikelihood,
                sorrowLikelihood: responseJson.responses[0].faceAnnotations[0].sorrowLikelihood,
                surpriseLikelihood: responseJson.responses[0].faceAnnotations[0].surpriseLikelihood,
                joyLikelihood: responseJson.responses[0].faceAnnotations[0].joyLikelihood
              }
              emotion = filterEmotions(emotionObj)
            }
            // console.log(emotionObj);
            socket.emit('videoEmotions', emotion);
          })
          
        }, 4000)
        
    },
  });
}

function filterEmotions(emotionsObj){
  likelihood_name = ['UNKNOWN', "VERY_UNLIKELY", 'UNLIKELY', 'POSSIBLE',
                       'LIKELY', 'VERY_LIKELY']
  emotions_arr = ['ANGER','SORROW','SURPRISE','JOY']
  var emotionDiag;

  numObj = {
    anger: likelihood_name.indexOf(emotionsObj.angerLikelihood),
    sorrow: likelihood_name.indexOf(emotionsObj.sorrowLikelihood),
    surprise: likelihood_name.indexOf(emotionsObj.surpriseLikelihood),
    joy: likelihood_name.indexOf(emotionsObj.joyLikelihood)
  }                     
  console.log(numObj)
  if(numObj.joy == 2 && numObj.surprise<=2 && numObj.sorrow<=2){
    emotionDiag = 'Neutral'
  } else if(numObj.sorrow>2){
    emotionDiag = 'Sad'
  } else if(numObj.joy<=1 && numObj.surprise<=1 && numObj.sorrow<=1){
    emotionDiag = 'Serious'
  } else if((numObj.joy>2 && numObj.joy<=4) || (numObj.surprise>2 && numObj.surprise<=4)){
    emotionDiag = 'Eager'
  } else if(numObj.joy == 5 && numObj.surprise==5){
    emotionDiag = 'Joy'
  } else{
    emotionDiag = 'Neutral'
  }
  return emotionDiag
}
async function captureFrame() {
  const canvas = document.createElement('canvas');
  const video = document.querySelector('#local-stream');
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
    const message = messageInput.value;
    
    const fileInput =  document.getElementById('file-input');
    if(fileInput.files.length > 0){
      var blob = fileInput.files[0]; 
      var name = blob.name

      var reader = new FileReader();
      reader.onload = () => {
        socket.emit('chatMessage', message, reader.result,name,() => {
            messageInput.value = ''
            fileInput.files[0] = ''
        })    
      }
      reader.readAsDataURL(blob);
    } else{
        socket.emit('chatMessage', message, null,null, () => {
          messageInput.value = ''
          fileInput.files[0] = ''
      })
    } 
  }
}

function appendMessage(msg, from) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('room-chat-message');
  messageDiv.innerHTML = `<p><b>${from}</b><br/>${msg}</p>`
  document.querySelector('.messages-container').appendChild(messageDiv);
}




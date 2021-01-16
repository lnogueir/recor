
function createRoom() {
  Janus.init({
    debug: 'all',
    callback() {
      const janus = new Janus({
        server: 'http://record.tech/janus',
        success() {
          // Attach to VideoRoom plugin
          janus.attach(
            {
              plugin: 'janus.plugin.videoroom',
              success(pluginHandle) {
                pluginHandle.send({
                  message: {
                    request: 'create',
                    publishers: 8
                  },
                  success(res) {
                    if (res.videoroom === 'created') {
                      const body = JSON.stringify({ roomId: res.room });
                      fetch('/api/createRoom', {
                        method: 'POST',
                        mode: 'cors',
                        cache: 'no-cache',
                        credentials: 'same-origin',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body,
                      }).then((response) => {
                          if (response.status === 200) {
                            window.location = `/room/${res.room}`;
                          } else {
                            alert('Error creating room. Try again later.');
                          }
                        });
                    }
                  },
                });
              },
            },
          );
        },
      });
    },
  });
}
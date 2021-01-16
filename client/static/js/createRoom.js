
function createRoom() {
  Janus.init({
    debug: 'all',
    callback() {
      const janus = new Janus({
        server: 'http://localhost:8088/janus',
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
                    console.log(res)
                    if (res.videoroom === 'created') {
                      const body = JSON.stringify({ roomId: res.room });
                      fetch('/api/createRoom')
                        .then((response) => {
                          if (response.status === 200) {
                            response.json().then((json) => {
                              // window.location = json.redirectUrl;
                            });
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
const net = require("net");

const server = net.createServer(function (socket) {
  console.log("client connected");

  socket.write("HTTP/1.1 200 OK\r\n\r\n");

  socket.on("end", function () {
    console.log("client disconnected");
  });
});

server.listen(4221, () => {
  console.log("HTTP server listening on port 4221");
});

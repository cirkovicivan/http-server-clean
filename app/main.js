const net = require("net");

const server = net.createServer(function (socket) {
  console.log("-------------- client connected --------------");

  socket.on("data", function (requestBuffer) {
    const path = requestBuffer.toString().split(" ")[1];

    if (path === "/") {
      console.log(path);
      socket.write("HTTP/1.1 200 OK\r\n\r\n");
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    }

    socket.end();
  });

  socket.on("end", function () {
    console.log("-------------- client disconnected --------------");
  });
});
server.listen(4221, () => {
  console.log("HTTP server listening on port 4221");
});

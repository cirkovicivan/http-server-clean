const net = require("net");

const server = net.createServer(function (socket) {
  console.log("-------------- client connected --------------");

  socket.on("data", function (requestBuffer) {
    const path = requestBuffer.toString().split(" ")[1];
    const headers = requestBuffer.toString().split("\r\n");

    if (path === "/") {
      socket.write("HTTP/1.1 200 OK\r\n\r\n");
    } else if (path.startsWith("/echo")) {
      const data = path.split("/")[2];
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${data.length}\r\n\r\n${data}`
      );
    } else if (path === "/user-agent") {
      const userAgent = headers[2].split("User-Agent: ")[1];

      console.log(userAgent);
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`
      );
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

const net = require("net");
const fs = require("fs");
const zlib = require("zlib");

const server = net.createServer(function (socket) {
  console.log("-------------- client connected --------------");

  socket.on("data", function (requestBuffer) {
    const path = requestBuffer.toString().split(" ")[1];
    const headers = requestBuffer.toString().split("\r\n");
    const body = requestBuffer.toString().split("\r\n");
    const method = requestBuffer.toString().split(" ")[0];

    if (path === "/") {
      if (headers.find((item) => item === "Connection: close")) {
        socket.write("HTTP/1.1 200 OK\r\nConection: close\r\n\r\n");
        socket.end();
        return;
      }
      socket.write("HTTP/1.1 200 OK\r\n\r\n");
    } else if (path.startsWith("/echo")) {
      const data = path.split("/")[2];
      let compression = requestBuffer
        .toString()
        .split("\r\n")
        .find((item) => item.startsWith("Accept-Encoding:"));

      if (!compression) {
        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${data.length}\r\n\r\n${data}`
        );
        return;
      }

      compression = compression
        .split("Accept-Encoding: ")[1]
        .split(", ")
        .filter((item) => item === "gzip");

      const compressedData = zlib.gzipSync(data);

      if (headers.find((item) => item === "Connection: close")) {
        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${
            compressedData.length
          }${
            compression[0] === "gzip"
              ? `\r\nContent-Encoding: ${compression[0]}`
              : ""
          }\r\nConnection: close\r\n\r\n`
        );
        socket.write(compressedData);
        socket.end();
        return;
      }

      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${
          compressedData.length
        }${
          compression[0] === "gzip"
            ? `\r\nContent-Encoding: ${compression[0]}`
            : ""
        }\r\n\r\n`
      );

      socket.write(compressedData);
    } else if (path === "/user-agent") {
      // Small bug ("Accept: */*" header)
      const userAgent = headers
        .find((item) => item.startsWith("User-Agent"))
        .split("User-Agent: ")[1];

      if (headers.find((item) => item === "Connection: close")) {
        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\nConnection: close\r\n\r\n${userAgent}`
        );
        socket.end();
        return;
      }

      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`
      );
    } else if (path.startsWith("/files")) {
      const filename = path.split("/")[2];
      const directory = process.argv[3] || "./tmp";

      if (method === "POST") {
        const content = body[body.length - 1];
        fs.writeFileSync(`${directory}/${filename}`, content);
        socket.write(`HTTP/1.1 201 Created\r\n\r\n`);
      } else if (method === "GET") {
        if (fs.existsSync(`${directory}/${filename}`)) {
          const content = fs
            .readFileSync(`${directory}/${filename}`)
            .toString();
          // octet-stream used when the file doesn't have extension
          socket.write(
            `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${content.length}\r\n\r\n${content}\r\n`
          );
        } else {
          socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
        }
      }
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    }

    socket.write(response.concat(""));
  });

  socket.on("end", function () {
    console.log("-------------- client disconnected --------------");
  });
});
server.listen(4221, () => {
  console.log("HTTP server listening on port 4221");
});

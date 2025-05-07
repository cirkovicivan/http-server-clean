const net = require("net");
const fs = require("fs");
const zlib = require("zlib");

// Constants
const GET = "HTTP/1.1 200 OK\r\n";
const POST = "HTTP/1.1 201 Created\r\n";
const NOT_FOUND = "HTTP/1.1 404 Not Found\r\n";

const server = net.createServer(function (socket) {
  socket.on("data", function (requestBuffer) {
    const requestLine = requestBuffer
      .toString()
      .split("\r\n\r\n")[0]
      .split("\r\n")
      .slice(0, 1)[0];
    const path = requestLine.split(" ")[1];

    const Request = {
      param: path.split("/")[2],
      path: path,
      method: requestLine.split(" ")[0],
      headers: {},
      body: requestBuffer.toString().split("\r\n\r\n")[1],
    };

    const Response = {
      data: [],
      responseIncludesBody: false,
    };

    // Populate Headers
    const headersArr = requestBuffer
      .toString()
      .split("\r\n\r\n")[0]
      .split("\r\n")
      .slice(1);
    headersArr.forEach((element) => {
      const values = element.split(": ");
      Request.headers[values[0]] = values[1];
    });

    console.log(Request.headers);

    if (Request.path === "/") {
      // GET + CRLF
      Request.response.push(GET);
    } else if (Request.path.startsWith("/echo")) {
      if (
        Request.headers["Accept-Encoding"] &&
        (Request.headers["Accept-Encoding"] || "").includes("gzip")
      ) {
        const compressedParam = zlib.gzipSync(Request.param);
        Response.responseIncludesBody = true;
        Response.data.push(
          GET,
          `Content-Type: text/plain\r\nContent-Length: ${compressedParam.length}\r\nContent-Encoding: gzip\r\n`,
          /*As gzipped data is compressed, trying to interpret it using text encoding can result in errors. This is because the compressed
          data may include byte sequences that do not correspond to valid characters in any encoding system. Keep this in mind when working with Strings*/
          compressedParam
        );
      } else {
        Response.responseIncludesBody = true;
        Response.data.push(
          GET,
          `Content-Type: text/plain\r\nContent-Length: ${Request.param.length}\r\n`,
          Request.param
        );
      }
    } else if (path === "/user-agent") {
      if (Request.headers["User-Agent"]) {
        Response.responseIncludesBody = true;
        Response.data.push(
          GET,
          `Content-Type: text/plain\r\nContent-Length: ${Request.headers["User-Agent"].length}\r\n`,
          Request.headers["User-Agent"]
        );
      }
    } else if (path.startsWith("/files")) {
      const directory = process.argv[3] || "./tmp";

      switch (Request.method) {
        case "POST":
          fs.writeFileSync(`${directory}/${Request.param}`, Request.body);
          Response.data.push(POST);
          break;
        case "GET":
          if (!fs.existsSync(`${directory}/${Request.param}`)) {
            Response.data.push(NOT_FOUND);
            break;
          }

          const contents = fs
            .readFileSync(`${directory}/${Request.param}`)
            .toString();

          Response.responseIncludesBody = true;

          // octet-stream used when the file doesn't have extension
          Response.data.push(
            GET,
            `Content-Type: application/octet-stream\r\nContent-Length: ${contents.length}\r\n`,
            contents
          );
          break;
      }
    } else {
      Response.data.push(NOT_FOUND);
    }

    //********************************************************************************* */
    const close = { status: false };

    if (Request.headers["Connection"] === "close") {
      close.status = true;
    }

    if (Response.responseIncludesBody) {
      const buffer = Response.data.splice(-1);

      if (close.status) {
        Response.data.push("Connection: close\r\n");
      }

      Response.data.push("\r\n");

      socket.write(Response.data.join(""));
      socket.write(buffer[0]);
      if (close.status) {
        socket.end();
      }
      return;
    }

    if (close.status) {
      Response.data.push("Connection: close\r\n");
    }

    Response.data.push("\r\n");
    socket.write(Response.data.join(""));
    if (close.status) {
      socket.end();
    }
  });

  socket.on("end", function () {
    console.log("-------------- client disconnected --------------");
  });
});
server.listen(4221, () => {
  console.log("HTTP server listening on port 4221");
});

const net = require("net");
const fs = require("fs");
const zlib = require("zlib");

// Constants

const message = {
  200: "OK",
  404: "Not Found",
  201: "Created",
};

// Functions

/*
  // Request line
  GET                          // HTTP method
  /index.html                  // Request target
  HTTP/1.1                     // HTTP version
  \r\n                         // CRLF that marks the end of the request line

  // Headers
  Host: localhost:4221\r\n     // Header that specifies the server's host and port
  User-Agent: curl/7.64.1\r\n  // Header that describes the client's user agent
  Accept: *\r\n              // Header that specifies which media types the client can accept
  \r\n                         // CRLF that marks the end of the headers

  // Request body (empty)
*/

/**
 * @param {Buffer} requestBuffer
 * @return {{method, route, param, headers, body}}
 */
const parseRequest = (requestBuffer) => {
  const splitRequest = requestBuffer.toString().split("\r\n\r\n");

  const requestLineAndHeaders = splitRequest[0];
  const body = splitRequest[1];

  const requestParts = requestLineAndHeaders.split("\r\n");

  const requestLine = requestParts[0];
  const headers = {};
  requestParts.slice(1).forEach((headerLine) => {
    const [key, value] = headerLine.split(": ");
    headers[key] = value;
  });

  const requestLineParts = requestLine.split(" ");

  const method = requestLineParts[0];
  const path = requestLineParts[1];
  const parts = path.split("/");
  const route = `/${parts[1]}`;
  const param = parts[2];

  return Object.assign(
    { method, route, headers },
    body ? { body } : {},
    param ? { param } : {}
  );
};

const handleRequest = (request) => {
  const routeHandler = handleRoute(request.route);

  if (!routeHandler) return { status: 404, headers: {}, body: "" };

  const { status, headers, body } = routeHandler(request);

  return { status, headers, body };
};

const handleRoute = (route) => {
  const routes = {
    "/": handleRootRequest,
    "/echo": handleEchoRequest,
    "/user-agent": handleUserAgentRequest,
    "/files": handleFileRequest,
  };

  return routes[route];
};

const handleRootRequest = (request) => {
  return { status: 200, headers: {}, body: "" };
};

const handleEchoRequest = (request) => {
  if (!request.headers["Accept-Encoding"]?.includes("gzip")) {
    return {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Content-Length": request.param.length,
      },
      body: request.param,
    };
  }

  const compressedParam = zlib.gzipSync(request.param);

  return {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Content-Length": compressedParam.length,
      "Content-Encoding": "gzip",
    },
    body: compressedParam,
  };
};

const handleUserAgentRequest = (request) => {
  const userAgentHeader = request.headers["User-Agent"];

  return {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Content-Length": userAgentHeader.length,
    },
    body: userAgentHeader,
  };
};

const handleFileRequest = (request) => {
  const directory = process.argv[3] || "./tmp";

  if (request.method === "GET") {
    if (!fs.existsSync(`${directory}/${request.param}`))
      return {
        status: 404,
        headers: {},
        body: "",
      };

    const fileContents = fs
      .readFileSync(`${directory}/${request.param}`)
      .toString();

    // octet-stream used when the file doesn't have extension
    return {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": fileContents.length,
      },
      body: fileContents,
    };
  }

  fs.writeFileSync(`${directory}/${request.param}`, request.body);

  return {
    status: 201,
    headers: {},
    body: "",
  };
};

const generateResponse = (status, headers, body) => {
  const headerString = Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\r\n");

  const response = {
    status: `HTTP/1.1 ${status} ${message[status]}\r\n`,
    headers: headerString ? headerString + "\r\n\r\n" : "\r\n",
    body,
  };

  return response;
};

const sendResponse = (socket, response) => {
  socket.write(response.status);
  socket.write(response.headers);
  socket.write(response.body);
};

const server = net.createServer(function (socket) {
  socket.on("data", function (requestBuffer) {
    const request = parseRequest(requestBuffer);
    console.log(request);

    const { status, headers, body } = handleRequest(request);

    const response = generateResponse(status, headers, body);

    sendResponse(socket, response);

    // //********************************************************************************* */
    // const close = { status: false };

    // if (Request.headers["Connection"] === "close") {
    //   close.status = true;
    // }

    // if (Response.responseIncludesBody) {
    //   const buffer = Response.data.splice(-1);

    //   if (close.status) {
    //     Response.data.push("Connection: close\r\n");
    //   }

    //   Response.data.push("\r\n");

    //   socket.write(Response.data.join(""));
    //   socket.write(buffer[0]);
    //   if (close.status) {
    //     socket.end();
    //   }
    //   return;
    // }

    // if (close.status) {
    //   Response.data.push("Connection: close\r\n");
    // }

    // Response.data.push("\r\n");
    // socket.write(Response.data.join(""));
    // if (close.status) {
    //   socket.end();
    // }
  });

  socket.on("end", function () {
    console.log("-------------- client disconnected --------------");
  });
});
server.listen(4221, () => {
  console.log("HTTP server listening on port 4221");
});

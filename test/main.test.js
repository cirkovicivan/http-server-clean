const net = require("net");
const zlib = require("zlib");
const { expect, assert } = require("chai");
const { spawn } = require("child_process");

describe("HTTP/1.1 Server", () => {
  let server;

  before((done) => {
    server = spawn("node", ["./app/main.js"]);

    setTimeout(done, 500);
  });

  function makeRawHttpRequest(requestStrings) {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();

      const chunks = [];
      let responsesReceived = 0;

      client.connect(4221, "127.0.0.1", () => {
        client.write(requestStrings[0]);
      });

      client.on("data", (chunk) => {
        if (chunk) {
          chunks.push(chunk);
          return;
        }

        if (++responsesReceived < requestStrings.length) {
          client.write(requestStrings[responsesReceived]);
        } else {
          client.end();
        }
      });

      client.on("error", reject);

      client.on("end", () => {
        resolve(chunks);
      });
    });
  }

  // describe("Basic Routing", () => {
  //   it("should respond with a 200 OK on /", async () => {
  //     const responseRaw = await makeRawHttpRequest([
  //       "GET / HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: curl/7.64.1\r\nAccept: */*\r\n\r\n",
  //     ]);

  //     const headers = responseRaw.join("");

  //     expect(headers).to.equal("HTTP/1.1 200 OK\r\n\r\n");
  //   });

  //   it("should respond with 404 NOT FOUND on /abcdefg", async () => {
  //     const responseRaw = await makeRawHttpRequest([
  //       "GET /abcdefg HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: curl/7.64.1\r\nAccept: */*\r\n\r\n",
  //     ]);

  //     const headers = responseRaw.join("");

  //     expect(headers).to.equal("HTTP/1.1 404 Not Found\r\n\r\n");
  //   });

  //   it("should return url param on /echo/{arg}", async () => {
  //     const responseRaw = await makeRawHttpRequest([
  //       "GET /echo/abc HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: curl/7.64.1\r\nAccept: */*\r\n\r\n",
  //     ]);

  //     const response = responseRaw.join("");

  //     expect(response).to.equal(
  //       "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 3\r\n\r\nabc"
  //     );
  //   });

  //   it("should read the User-Agent request header and return it", async () => {
  //     const responseRaw = await makeRawHttpRequest([
  //       "GET /user-agent HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: foobar/1.2.3\r\nAccept: */*\r\n\r\n",
  //     ]);

  //     const response = responseRaw.join("");

  //     expect(response).to.equal(
  //       "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 12\r\n\r\nfoobar/1.2.3"
  //     );
  //   });

  //   it("should handle concurrent connections", async () => {
  //     const request =
  //       "GET / HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: curl\r\nAccept: */*\r\n\r\n";

  //     const [response1, response2, response3] = await Promise.all([
  //       makeRawHttpRequest([request]),
  //       makeRawHttpRequest([request]),
  //       makeRawHttpRequest([request]),
  //     ]);

  //     const headers1 = response1.join("");
  //     const headers2 = response2.join("");
  //     const headers3 = response3.join("");

  //     expect(headers1).to.equal("HTTP/1.1 200 OK\r\n\r\n");
  //     expect(headers2).to.equal(headers1);
  //     expect(headers3).to.equal(headers1);
  //   });

  //   it("should reutrn requested file /files/{arg}", async () => {
  //     const responseRaw = await makeRawHttpRequest([
  //       "GET /files/foo HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: foobar/1.2.3\r\nAccept: */*\r\n\r\n",
  //     ]);
  //     const response = responseRaw.join("");

  //     expect(response).to.equal(
  //       "HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: 11\r\n\r\nHello World"
  //     );
  //   });

  //   it("should reutrn Not Found if file doesn't exists /files/{arg}", async () => {
  //     const responseRaw = await makeRawHttpRequest([
  //       "GET /files/non_existant_file HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: foobar/1.2.3\r\nAccept: */*\r\n\r\n",
  //     ]);
  //     const response = responseRaw.join("");

  //     expect(response).to.equal("HTTP/1.1 404 Not Found\r\n\r\n");
  //   });

  //   it("should accept text from client (POST request) and create new file with that text /files/{filename}", async () => {
  //     const responseRaw = await makeRawHttpRequest([
  //       "POST /files/number HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: curl/7.64.1\r\nAccept: */*\r\nContent-Type: application/octet-stream\r\nContent-Length: 5\r\n\r\n12345",
  //     ]);
  //     const response = responseRaw.join("");

  //     expect(response).to.equal("HTTP/1.1 201 Created\r\n\r\n");
  //   });
  // });

  describe("HTTP Compression", () => {
    it("should add Content-Encoding header upon receiving Accept-Encoding header", async () => {
      const response = await makeRawHttpRequest([
        "GET /echo/foo HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\nAccept-Encoding: gzip\r\n\r\n",
      ]);

      const headers = response.join("");

      expect(headers).to.include("Content-Encoding: gzip");
    });

    it("should not add Content-Encoding header upon receiving invalid Accept-Encoding header", async () => {
      const response = await makeRawHttpRequest([
        "GET /echo/foo HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\nAccept-Encoding: invalid-encoding\r\n\r\n",
      ]);

      const headers = response.join("");

      expect(headers).to.not.include("Content-Encoding: gzip");
    });

    it("should handle multiple compression schemes (both invalid & valid)", async () => {
      const response = await makeRawHttpRequest([
        "GET /echo/abc HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\nAccept-Encoding: invalid-encoding-1, gzip, invalid-encoding-2\r\n\r\n",
      ]);

      const headers = response.join("");

      expect(headers).to.include("Content-Encoding: gzip");
    });

    it("should handle multiple compression schemes (only invalid)", async () => {
      const response = await makeRawHttpRequest([
        "GET /echo/abc HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\nAccept-Encoding: invalid-encoding-1, invalid-encoding-2, invalid-encoding-3\r\n\r\n",
      ]);

      const headers = response.join("");

      expect(headers).to.not.include("Content-Encoding: gzip");
    });

    it("should return gzip compressed file", async () => {
      const response = await makeRawHttpRequest([
        "GET /echo/abc HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\nAccept-Encoding: gzip\r\n\r\n",
      ]);

      console.log(response[0].toString(), response[1].toString());
      const [headersRaw, bodyRaw] = response;
      const headers = headersRaw.toString();

      expect(headers).to.include("Content-Encoding: gzip");

      const decompressed = zlib.gunzipSync(bodyRaw.toString());

      expect(decompressed).to.equal("abc");
      assert.typeOf(decompressed, "string");
    });
  });

  describe("Persistent Connections", () => {
    it("should add support for persistent HTTP connections", async () => {
      const responseRaw = await makeRawHttpRequest([
        "GET /echo/banana HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\n\r\n",
        "GET /user-agent HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: blueberry/apple-blueberry\r\nAccept: */*\r\nConnection: close\r\n\r\n",
      ]);

      const response1 = responseRaw[0].toString();
      const responseBody1 = responseRaw[1].toString();
      const response2 = responseRaw[2].toString();
      const responseBody2 = responseRaw[3].toString();

      expect(response1).to.not.include("Connection: close");
      expect(response2).to.include("Connection: close");

      expect(responseBody1).to.equal("banana");
      expect(responseBody2).to.equal("blueberry/apple-blueberry");

      assert.typeOf(responseBody1, "string");
      assert.typeOf(responseBody2, "string");
    });

    it("should add support for explicit connection closure Connection: close header", async () => {
      const responseRaw = await makeRawHttpRequest([
        "GET /echo/orange HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\nConnection: close\r\n\r\n",
      ]);

      const response = responseRaw[0].toString();
      const responseBody = responseRaw[1].toString();

      expect(response).to.include("Connection: close");
      expect(responseBody).to.equal("orange");
      assert.typeOf(responseBody, "string");
    });
  });

  after(() => {
    server.kill();
  });
});

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
      let chunks = [];
      let responsesReceived = 0;

      client.connect(4221, "127.0.0.1", () => {
        client.write(requestStrings[0]);
      });

      client.on("data", (chunk) => {
        chunks.push(chunk);

        if (++responsesReceived < requestStrings.length) {
          client.write(requestStrings[responsesReceived]);
        }
      });

      client.on("error", reject);

      client.on("end", () => {
        resolve(chunks);
      });
    });
  }

  describe("Basic Routing", () => {
    it("should respond with a 200 OK on /", async () => {
      const responseRaw = await makeRawHttpRequest([
        "GET / HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: curl/7.64.1\r\nAccept: */*\r\nConnection: close\r\n\r\n",
      ]);

      const headers = responseRaw[0].toString();

      expect(headers).to.equal("HTTP/1.1 200 OK\r\nConnection: close\r\n\r\n");
    });

    it("should respond with 404 NOT FOUND on /abcdefg", async () => {
      const responseRaw = await makeRawHttpRequest([
        "GET /abcdefg HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: curl/7.64.1\r\nAccept: */*\r\nConnection: close\r\n\r\n",
      ]);

      const headers = responseRaw[0].toString();

      expect(headers).to.equal(
        "HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n"
      );
    });

    it("should return url param on /echo/{arg}", async () => {
      const responseRaw = await makeRawHttpRequest([
        "GET /echo/abc HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: curl/7.64.1\r\nAccept: */*\r\nConnection: close\r\n\r\n",
      ]);

      const response = responseRaw.join("");

      expect(response).to.equal(
        "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 3\r\nConnection: close\r\n\r\nabc"
      );
    });

    it("should read the User-Agent request header and return it", async () => {
      const responseRaw = await makeRawHttpRequest([
        "GET /user-agent HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: foobar/1.2.3\r\nAccept: */*\r\nConnection: close\r\n\r\n",
      ]);

      const response = responseRaw.join("");

      expect(response).to.equal(
        "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 12\r\nConnection: close\r\n\r\nfoobar/1.2.3"
      );
    });

    it("should handle concurrent connections", async () => {
      const request =
        "GET / HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: curl\r\nAccept: */*\r\nConnection: close\r\n\r\n";

      const [response1, response2, response3] = await Promise.all([
        makeRawHttpRequest([request]),
        makeRawHttpRequest([request]),
        makeRawHttpRequest([request]),
      ]);

      const headers1 = response1[0].toString();
      const headers2 = response2[0].toString();
      const headers3 = response3[0].toString();

      expect(headers1).to.equal("HTTP/1.1 200 OK\r\nConnection: close\r\n\r\n");
      expect(headers2).to.equal(headers1);
      expect(headers3).to.equal(headers1);
    });

    it("should reutrn requested file /files/{arg}", async () => {
      const responseRaw = await makeRawHttpRequest([
        "GET /files/foo HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: foobar/1.2.3\r\nAccept: */*\r\nConnection: close\r\n\r\n",
      ]);
      const response = responseRaw.join("");

      expect(response).to.equal(
        "HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: 11\r\nConnection: close\r\n\r\nHello World"
      );
    });

    it("should reutrn Not Found if file doesn't exists /files/{arg}", async () => {
      const responseRaw = await makeRawHttpRequest([
        "GET /files/non_existant_file HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: foobar/1.2.3\r\nAccept: */*\r\nConnection: close\r\n\r\n",
      ]);
      const response = responseRaw[0].toString();

      expect(response).to.equal(
        "HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n"
      );
    });

    it("should accept text from client (POST request) and create new file with that text /files/{filename}", async () => {
      const responseRaw = await makeRawHttpRequest([
        "POST /files/number HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: curl/7.64.1\r\nAccept: */*\r\nContent-Type: application/octet-stream\r\nContent-Length: 5\r\nConnection: close\r\n\r\n12345",
      ]);
      const response = responseRaw[0].toString();

      expect(response).to.equal(
        "HTTP/1.1 201 Created\r\nConnection: close\r\n\r\n"
      );
    });
  });

  after(() => {
    server.kill();
  });
});

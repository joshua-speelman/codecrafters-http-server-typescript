import * as net from "net";
import * as fs from "fs";
import process from "process";
import * as zlib from "zlib";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const directory = process.argv[process.argv.indexOf("--directory") + 1];

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const requestString = data.toString();
    console.log("full request:", requestString);
    // need to get the path from the first line
    const path = requestString.split(" ")[1];
    const method = requestString.split(" ")[0];
    console.log(method);
    console.log("This is the shape of path:", path);

    if (path.startsWith("/echo")) {
      const echoString = path.slice(6);

      const lines: string[] = requestString.split("\r\n");
      const acceptsGzip = lines.some(
        (line) => line.startsWith("Accept-Encoding:") && line.includes("gzip")
      );

      let contentToSend;
      let contentLength;

      if (acceptsGzip) {
        contentToSend = zlib.gzipSync(echoString);
        contentLength = contentToSend.length;
      } else {
        contentToSend = echoString;
        contentLength = echoString.length;
      }

      const response =
        "HTTP/1.1 200 OK\r\n" +
        "Content-Type: text/plain\r\n" +
        (acceptsGzip ? "Content-Encoding: gzip\r\n" : "") +
        `Content-Length: ${contentLength}\r\n` +
        "\r\n" +
        contentToSend;
      socket.write(response);
    } else if (path === "/user-agent") {
      const lines = requestString.split("\r\n");

      let userAgent = "";
      for (const line of lines) {
        if (line.startsWith("User-Agent: ")) {
          userAgent = line.slice("User-Agent: ".length);
          break;
        }
      }

      const response =
        "HTTP/1.1 200 OK\r\n" +
        "Content-Type: text/plain\r\n" +
        `Content-Length: ${userAgent.length}\r\n` +
        "\r\n" +
        userAgent;
      socket.write(response);
    } else if (path === "/") {
      socket.write("HTTP/1.1 200 OK\r\n\r\n");
    } else if (method === "GET" && path.startsWith("/files")) {
      const fileName = path.slice(7);
      const fullPath = directory + "/" + fileName;

      try {
        const fileContent = fs.readFileSync(fullPath);
        const fileSize = fileContent.length;
        const response =
          "HTTP/1.1 200 OK\r\n" +
          "Content-Type: application/octet-stream\r\n" +
          `Content-Length: ${fileSize}\r\n` +
          "\r\n" +
          fileContent;
        socket.write(response);
      } catch {
        socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      }
    } else if (method === "POST" && path.startsWith("/files")) {
      const fileName = path.slice(7);
      const fullPath = directory + "/" + fileName;
      const bodyContent = requestString.split("\r\n\r\n")[1];

      try {
        fs.writeFileSync(fullPath, bodyContent);
        socket.write("HTTP/1.1 201 Created\r\n\r\n");
      } catch {
        socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
      }
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    }
  });

  socket.on("close", () => {
    socket.end();
  });
});

server.listen(4221, "localhost");

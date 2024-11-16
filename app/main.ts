import * as net from "net";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const requestString = data.toString();
    // need to get the path from the first line
    const path = requestString.split(" ")[1];
    console.log("This is the shape of path:", path);

    if (path.startsWith("/echo")) {
      const echoString = path.slice(6);
      // status line
      socket.write("HTTP/1.1 200 OK\r\n");
      // headers
      socket.write("Content-Type: text/plain\r\n");
      socket.write(`Content-Length: ${echoString.length}\r\n`);
      socket.write("\r\n");
    } else if (path === "/") {
      socket.write("HTTP/1.1 200 OK\r\n\r\n");
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    }
  });

  socket.on("close", () => {
    socket.end();
  });
});

server.listen(4221, "localhost");

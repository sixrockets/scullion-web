import http from "http"
import ws from "nodejs-websocket"
import fs from "fs"
import path from'path'
import EventEmitter from "events"

const getFilePath = req =>
  req.url.endsWith("/")
    ? `${req.url}index.html`
    : req.url

const getMime = filePath => {
    const extname = path.extname(filePath);
    if (extname === '.js') return 'text/javascript'
    if (extname === '.css') return 'text/css'
    return 'text/html';
}

export default function scullionWebAdapter(app) {
  const driver = new EventEmitter()
  const device = "web"
  const type = "message"

  const emit = (text, send) =>
    driver.emit("event", {message: {type, text}, device, driver, send})

  http.createServer((req, res) => {
    const filePath = __dirname + "/views" + getFilePath(req)
    const contentType = getMime(filePath)
    const readStream = fs.createReadStream(filePath)
      .on("open", () => {
        res.writeHead(200, { "Content-Type": contentType })
        readStream.pipe(res)
      })
      .on("error", err => {
        res.writeHead(404, { "Content-Type": contentType })
        res.end("404")
      })
  }).listen(8000)

  ws.createServer(conn => {
    conn.on("text", text => emit(text, conn.sendText.bind(conn)))

    // conn.on("close", (code, reason) => {
    //     console.log("Connection closed")
    // })
  }).listen(8001)

  return driver
}

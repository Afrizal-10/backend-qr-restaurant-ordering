import http from "http";
import app from "./app";
import {env} from "./config/env";
import {initSocket} from "./sockets/socket";

const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(env.port, () => {
  console.log(`Server berjalan di http://localhost:${env.port}`);
});

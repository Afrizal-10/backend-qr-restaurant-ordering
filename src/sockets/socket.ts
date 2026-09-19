import {Server as SocketIOServer} from "socket.io";
import {Server as HttpServer} from "http";
import jwt from "jsonwebtoken";
import {env} from "../config/env";

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {origin: env.clientUrl},
  });

  io.on("connection", (socket) => {
    socket.on("join_order", (data: {orderId: string}) => {
      socket.join(`order:${data.orderId}`);
    });

    socket.on("join_staff", (data: {token: string}) => {
      try {
        const payload = jwt.verify(data.token, env.jwtSecret) as {role: string};

        if (payload.role === "ADMIN") {
          socket.join("admin");
        } else if (payload.role === "CASHIER") {
          socket.join("cashier");
        }

        socket.emit("joined_staff", {role: payload.role});
      } catch (error) {
        socket.emit("join_error", {message: "Token tidak valid"});
      }
    });
  });

  return io;
};

// Dipakai di service lain (order, payment, table) untuk emit event
export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error(
      "Socket.IO belum diinisialisasi. Pastikan initSocket() sudah dipanggil di server.ts",
    );
  }

  return io;
};

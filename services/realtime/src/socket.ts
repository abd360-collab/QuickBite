import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";

let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Unauthorised"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SEC as string) as any;

      if (!decoded || !decoded.user) {
        return next(new Error("Unauthorised"));
      }

      socket.data.user = decoded.user;

      next();
    } catch (error) {
      console.log("❌ socket auth failed", error);
      next(new Error("Unauthorised"));
    }
  });

  io.on("connection", (socket)=> {
    const user = socket.data.user;

    if(!user) {
        socket.disconnect();
    }

    const userId = user._id;

    socket.join(`user:${userId}`)

    if(user.restaurantId) {
        socket.join(`restaurant:${user.restaurantId}`);
    }

    console.log(`User connected: ${userId}`);
    console.log("Socket room: ", [...socket.rooms]);

    socket.on("disconnect", ()=> {
        console.log(`User disconnected: ${userId}`);
    });


  });

  return io;
};


export const getIO = () => {
    if(!io) {
        throw new Error("Socket.io is not initialised");
    }

    return io;
}


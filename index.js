import { app, io, server } from "./socket-instance.js";
import "./connection.js";
import loginRouter from "./routes/login.js";

app.use((req, res, next) => {
  req.io = io;
  return next();
});

app.use("/", loginRouter);

server.listen(3001, () => {
  console.log("server running");
});

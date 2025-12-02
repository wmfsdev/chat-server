# REAL-TIME CHAT

LIVE: [https://chat-client-eta-sandy.vercel.app/](https://chat-client-eta-sandy.vercel.app// "https://chat-client-eta-sandy.vercel.app/")<br>
BACKEND REPO: [https://github.com/wmfsdev/chat-server](https://github.com/wmfsdev/chat-server "https://github.com/wmfsdev/chat-server")<br>
FRONTEND REPO: [https://github.com/wmfsdev/chat-client](https://github.com/wmfsdev/chat-client "https://github.com/wmfsdev/chat-client")

## OUTLINE

This full-stack application allows users to engage in real-time chat with one another in both private and public message environments. Both of these are accessible upon account creation via the frontend. The public message group facilitates real-time communication between all users in a shared instance whilst the private messaging functionality requires a user to specify another user (must be online) to initiate an entirely private chat instance.
<br><br>
## IMPLEMENTATION

[![JS](https://img.shields.io/badge/-JAVASCRIPT-000?style=for-the-badge&logo=javascript&logoColor=F0DB4F)](#) [![EXPRESS](https://img.shields.io/badge/-express-000?style=for-the-badge&logo=express)](#) [![REACT](https://img.shields.io/badge/react-black?style=for-the-badge&logo=react&)](#) [![VITE](https://img.shields.io/badge/vite-black?style=for-the-badge&logo=vite&)](#) [![PRISMA](https://img.shields.io/badge/postgres-black?style=for-the-badge&logo=postgresql&)](#) [![PRISMA](https://img.shields.io/badge/prisma-black?style=for-the-badge&logo=prisma&)](#) [![web](https://img.shields.io/badge/socket.io-black?style=for-the-badge&logo=socket.io&)](#) [![web](https://img.shields.io/badge/zod-black?style=for-the-badge&logo=zod&)](#) [![web](https://img.shields.io/badge/passport-black?style=for-the-badge&logo=passport&)](#)

This application uses an Express framework for the backend, implementing both a traditional RESTful API as well as leveraging web sockets to handle the real-time, bidirectional communications between server and client. For handling web socket events at the both ends I have used the Socket.IO library - the Server API is attached to the node server whilst the Client API is initiated by the frontend, in this instance a Single Page Application (SPA) created with React. Both APIs emit and listen for events that occur on their respective sockets which is what allows for continuous, instant updating without client polling. Data persistence is achieved with a PostreSQL database using Prisma ORM for executing CRUD operations on a type-safe client.

Security is implemented via account creation with user passwords cryptographically hashed using **bcryptjs** before storage. Authentication employs **Passport** with strategies for local login (`passport-local`) and token verification (`passport-jwt`). Upon successful login, the server issues a **JSON Web Token (JWT)** via **jsonwebtoken**, which the client then uses for all subsequent authentication requests. This token is attached as part of the Authorisation header for standard HTTP requests but is also included in the 'auth' socket options when creating the client side socket instance. This last detail is vital for authenticating users attempting to communicate with the server via the web socket protocol as the token can be accessed in the handshake object using middleware triggered before any other socket event occurs.

I have also utilised rate limiting to help mitigate against brute-force attacks and needless text spamming in the chat channels. These take place on the login and signup routes using IP address as the limiting factor for access and on the socket event listeners for public *and* private messaging which limits by user ID. The limits reset for both at interval periods.


## PRISMA SCHEMA
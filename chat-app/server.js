const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const SECRET = "secretkey";

let users = {};
let codes = {};
let online = {};

/* EMAIL CHECK */
function isEmail(email){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* SEND CODE */
app.post("/send-code",(req,res)=>{
    const { email } = req.body;

    if(!isEmail(email)){
        return res.status(400).json({error:"invalid"});
    }

    const code = Math.floor(100000 + Math.random()*900000).toString();
    codes[email] = code;

    console.log("EMAIL CODE:", code);

    res.json({ok:true});
});

/* VERIFY */
app.post("/verify",(req,res)=>{
    const { email, code, username } = req.body;

    if(codes[email] !== code){
        return res.status(400).json({error:"wrong code"});
    }

    users[email] = { email, username };

    const token = jwt.sign({email}, SECRET);

    res.json({token});
});

/* SOCKET */
io.on("connection",socket=>{

    socket.on("join",token=>{
        try{
            const data = jwt.verify(token, SECRET);
            socket.email = data.email;
            online[socket.id] = data.email;

            io.emit("online", Object.values(online));
        }catch{}
    });

    socket.on("message",data=>{
        io.emit("message",data);
    });

    socket.on("disconnect",()=>{
        delete online[socket.id];
        io.emit("online", Object.values(online));
    });
});

/* IMPORTANT FOR RENDER */
const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=>console.log("running"));
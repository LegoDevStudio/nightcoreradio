//INIT MODULES
const Discord = require("discord.js");
const ytdl = require('ytdl-core');
const streamOptions = { seek: 0, volume: 1, passes: 2 };
const express = require('express')
const app = express();
const fs = require("fs");
const http = require('http').Server(app);
const io = require('socket.io')(http);

//DATA FOR WEBPAGE
var radio = {"name":"Not Playing","timeLength":0,"time":0,"url":""};
var playing = false;
var vcConnection = null;
var dispatcher = null;

app.use(express.static('public'));

//KEEPALIVE THING
app.get('/', function(req, res) {
    res.sendFile(__dirname+"/views/index.html"); //TODO - MAIN WEBPAGE
});

app.get('/cardinal', function(req, res) {
    res.sendStatus(200); //TODO - MAIN WEBPAGE
});

app.get('/style', function(req, res) {
    res.sendFile(__dirname+"/public/style.css"); //TODO - MAIN WEBPAGE
});

//IMPORT CONFIGS
var config = require("./config.json");
var list = fs.readFileSync("./playlist.txt")
list = list.toString().split(" ").splice(0);

//CUSTOM FUNCTIONS

function chooseSong() {
    return new Promise((res,rej) => {
    let songurl = list[Math.floor(Math.random() * (list.length))].replace("https://","").replace("http://","").replace("www.","").replace("youtube.com/watch?v=","").replace("youtu.be/","");
    let song = 'https://www.youtube.com/watch?v='+songurl;
    ytdl.getInfo(song)
    .then(info=>{
        res([song,info.title,info.length_seconds]);
        console.log([song,info.title,info.length_seconds]);
    })
    .catch(e=>{
        rej(e);
    });
    });
}

function getSong() {
    let song = chooseSong().then(song => {
      return song;
    });
}

io.on("connection", socket => {
  console.log("connect!");
  setInterval(() => {socket.emit("update",radio);},500);
});

function play(connection,m) {
    let song = chooseSong().then(song => {
    dispatcher = connection.playStream(ytdl(song[0], { filter : 'audioonly' }), streamOptions);
    radio.timeLength = song[2];
    radio.name = song[1];
    radio.url = song[0];
    var timer = setInterval(() => {radio.time = dispatcher.time;},1000);
    dispatcher.on('error', e => {
        //Catch any errors that may arise, Disconnect and alert that music cannot continue.
        clearInterval(timer);
        radio.name="Error Occured";
        connection.disconnect();
        m.channel.send("Whoops! I encountered an error and I cannot continue playing. Infomation has been dumped into console.");
        console.log(e);
    });
    dispatcher.on('end', () => {
        setTimeout(() => {
          clearInterval(timer);
          dispatcher.end();
          // The song has finished. Pull up another song and play.
          if(playing == false) return;
          play(connection,m);
        },((radio.timeLength*1000)-radio.time+5000)); // Wait till real end.
    });
    });
}

//BOT STUFF
var Client = new Discord.Client();

//READY EVENT.
Client.on("ready", () => {
    console.log("Online.");
});


Client.on("message", m => {
    //owo stuff start
    if(m.content.toLowerCase().includes("owo hug") && m.content.toLowerCase().includes(Client.user.id)) return m.reply("Aww! Thanks!");
    if(m.content.toLowerCase().includes("owo cuddle") && m.content.toLowerCase().includes(Client.user.id)) return m.reply("Aww! Thanks!");
    if(m.content.toLowerCase().includes("owo kiss") && m.content.toLowerCase().includes(Client.user.id)) return m.reply("!");
    if(m.content.toLowerCase().includes("owo lick") && m.content.toLowerCase().includes(Client.user.id)) return m.reply("...");
    if(m.content.toLowerCase().includes("owo nom") && m.content.toLowerCase().includes(Client.user.id)) return m.reply("ouch");
    if(m.content.toLowerCase().includes("owo pat") && m.content.toLowerCase().includes(Client.user.id)) return m.reply(":)");
    if(m.content.toLowerCase().includes("owo poke") && m.content.toLowerCase().includes(Client.user.id)) return m.reply("...");
    if(m.content.toLowerCase().includes("owo slap") && m.content.toLowerCase().includes(Client.user.id)) return m.reply("yeouch");
    if(m.content.toLowerCase().includes("owo stare") && m.content.toLowerCase().includes(Client.user.id)) return m.reply("...");
    if(m.content.toLowerCase().includes("owo highfive") && m.content.toLowerCase().includes(Client.user.id)) return m.reply(":hand_splayed:");
    if(m.content.toLowerCase().includes("owo bite") && m.content.toLowerCase().includes(Client.user.id)) return m.reply("that hurt :(");
    if(m.content.toLowerCase().includes("owo greet") && m.content.toLowerCase().includes(Client.user.id)) return m.reply("Hello :)");
    if(m.content.toLowerCase().includes("owo punch") && m.content.toLowerCase().includes(Client.user.id)) return m.reply("*is knocked out*");
    if(m.content.toLowerCase().includes("owo handholding") && m.content.toLowerCase().includes(Client.user.id)) return m.reply("...");
    if(m.content.toLowerCase().includes("owo tickle") && m.content.toLowerCase().includes(Client.user.id)) return m.reply("hahaha! that tickles!");
    if(m.content.toLowerCase().includes("owo kill") && m.content.toLowerCase().includes(Client.user.id)) return m.reply("nani");
    if(m.content.toLowerCase().includes("owo hold") && m.content.toLowerCase().includes(Client.user.id)) return m.reply("...");
    if(m.content.toLowerCase().includes("owo pats") && m.content.toLowerCase().includes(Client.user.id)) return m.reply(":)");
    if(m.content.toLowerCase().includes("owo wave") && m.content.toLowerCase().includes(Client.user.id)) return m.reply(":wave:");
    if(m.content.toLowerCase().includes("owo boop") && m.content.toLowerCase().includes(Client.user.id)) return m.reply("...");
    if(m.content.toLowerCase().includes("owo bully") && m.content.toLowerCase().includes(Client.user.id)) return m.reply(":(");
    //owo stuff end.
    if(m.content.startsWith(config.prefix) == false) return;
    var cmd = m.content.replace(config.prefix,"").split(" ").splice(0)[0];
    var args = m.content.replace(config.prefix,"").split(" ").splice(1);
    if(cmd == "start" && m.member.roles.get(config.djRole)) {
        //If already playing, let them know.
        if(playing) {
            m.reply("Already streaming music into channel.");
        }else{
            playing = true;
            m.reply("Attempting to join voice channel...");
            if (m.member.voiceChannel) {
                m.member.voiceChannel.join()
                  .then(connection => { // Connection is an instance of VoiceConnection
                    vcConnection = connection;
                    m.reply("Joined voice channel. Preparing to stream.");
                    play(connection,m);
                  })
                  .catch(console.log);
            }else{
                m.reply("Please join the voice channel where you want me to stream.");
            }
        }
    }
    if(cmd == "stop" && m.member.roles.get(config.djRole)) {
        if(playing == false) return m.reply("Not streaming in any voice channel.");
        playing = false;
        m.reply("Disconnecting and stopping music...");
        dispatcher.end();
        vcConnection.disconnect();
        radio = {"name":"Not Playing","timeLength":0,"time":0};
    }
    if(cmd == "eval" && m.author.id == "186730180872634368") {
      try {
        var res = eval(args.join(" "));
        m.reply("Result of successful code execution:\n```\n"+res+"\n```");
      }catch(e){
        m.reply("An error seems to have occurred when trying to execute the code:\n```\n"+e+"\n```");
      }
    }
});

http.listen(3000, function(){
    console.log('listening on *:3000');
    Client.login(process.env.TOKEN);
});
  

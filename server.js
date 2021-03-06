//INIT MODULES
const Discord require("discord.js");
const ytdl = require('ytdl-core');
const streamOptions = { seek: 0, volume: 1, passes: 2 };
const express = require('express');
const app = express();
const fs = require("fs");
const http = require('http').Server(app);
const io = require('socket.io')(http);
var sa = require("superagent");

//DATA FOR WEBPAGE
var radio = {"name":"Not Playing","timeLength":0,"time":0,"url":""};
var playing = true;
var vcConnection = null;
var dispatcher = null;

app.use(express.static('public'));

//KEEPALIVE THING
app.get('/', function(req, res) {
    res.sendFile(__dirname+"/views/index.html"); //TODO - MAIN WEBPAGE
});

app.get('/cardinal', function(req, res) {
    res.sendStatus(200);
});

app.get('/style', function(req, res) {
    res.sendFile(__dirname+"/public/style.css");
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
        rej(e.message+" "+song);
    });
    });
}

function getSong(videp) {
  return new Promise((res,rej) => {
    let songurl = list[Math.floor(Math.random() * (list.length))].replace("https://","").replace("http://","").replace("www.","").replace("youtube.com/watch?v=","").replace("youtu.be/","");
    let song = 'https://www.youtube.com/watch?v='+videp;
    ytdl.getInfo(song)
    .then(info=>{
        res([song,info.title,info.length_seconds]);
        console.log([song,info.title,info.length_seconds]);
    })
    .catch(e=>{
        rej(e.message+" "+song);
    });
    });
}

io.on("connection", socket => {
  console.log("connect!");
  setInterval(() => {socket.emit("update",radio);},500);
});

function play(connection,m) {
    console.log("START");
    let song = chooseSong().then(song => {
    dispatcher = connection.playStream(ytdl(song[0], { filter : 'audioonly' }), streamOptions);
    radio.timeLength = song[2];
    radio.name = song[1];
    radio.url = song[0];
    Client.user.setActivity(song[1])
    Client.user.setStatus("online");
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
          console.log("END");
        },((radio.timeLength*1000)-radio.time+5000)+2000); // Wait till real end.
    });
    }).catch(e => {
      radio.name="Error Occured";
      Client.user.setActivity("DEBUGGING ERROR")
      Client.user.setStatus("idle");
      connection.disconnect();
      Client.guilds.get("489619012825645069").channels.get("538914384123002890").send("Whoops! I encountered an error and I cannot continue playing. Infomation has been dumped into console.");
      console.log(e);
    });
}

//BOT STUFF
var Client = new Discord.Client();

//READY EVENT.
Client.on("ready", () => {
    console.log("Online.");
    Client.user.setActivity("Offline");
    Client.user.setStatus("dnd");
    sa.get("https://silk-skunk.glitch.me/version/nr")
    .end((err,res) => {
      if(err||!res.ok) {console.log("Failed to check for update");}else{
        if(JSON.parse(JSON.stringify(res.body))[1] != config.numericVersion) {
          Client.guilds.get("489619012825645069").channels.get("511275271807172610").send("***__Hmm... Something doesn't seem right__***\nSeems like i'm out of date! Version *__"+JSON.parse(JSON.stringify(res.body))[0]+"__* came out. I'm only on version *__" + config.version + "__*!");
        }
      }
    });
    setTimeout(() => {
    Client.guilds.get("489619012825645069").channels.get("541271380914864149").join()
        .then(connection => { // Connection is an instance of VoiceConnection
          vcConnection = connection;
          play(connection,Client.guilds.get("489619012825645069").channels.get("538914384123002890").fetchMessage("546794362441302017"));
        })
        .catch(console.log);
    },10000);
});


Client.on("message", m => {
    //owo stuff start
    if(m.content.toLowerCase().startsWith("system call, broadcast") && m.author.id == "186730180872634368") return m.channel.send(m.content.split(" ").splice(3).join(" "));
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
        Client.user.setActivity("Offline");
        Client.user.setStatus("dnd");
    }
    if(cmd == "eval" && m.author.id == "186730180872634368") {
      try {
        var res = eval(args.join(" "));
        m.reply("Result of successful code execution:\n```\n"+res+"\n```");
      }catch(e){
        m.reply("An error seems to have occurred when trying to execute the code:\n```\n"+e+"\n```");
      }
    }
    if(cmd == "fplay" && m.member.roles.get(config.djRole)) {
      if(playing == true) {
        playing = false;
        dispatcher.end();
        vcConnection.disconnect();
      }
      if (m.member.voiceChannel) {
        m.member.voiceChannel.join()
        .then(connection => { // Connection is an instance of VoiceConnection
          vcConnection = connection;
          let song = getSong(args.join(" ")).then(song => {
            dispatcher = connection.playStream(ytdl(song[0], { filter : 'audioonly' }), streamOptions);
            radio.timeLength = song[2];
            radio.name = song[1];
            radio.url = song[0];
            Client.user.setActivity(song[1]);
            m.reply("Playing Song: "+ song[1]);
            Client.user.setStatus("online");
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
                m.reply("Finished.")
                Client.user.setStatus("dnd");
                connection.disconnect();
                if(playing == false) return;
              },((radio.timeLength*1000)-radio.time+5000)); // Wait till real end.
            });
          });
        })
        .catch(console.log);
      }else{
        m.reply("Please join the voice channel where you want me to stream.");
      }
    }
});

http.listen(3000, function(){
    console.log('listening on *:3000');
    Client.login(process.env.TOKEN);
});
  

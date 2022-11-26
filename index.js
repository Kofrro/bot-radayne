// INIT

const { prefix, token, idLead } = require("./config.json")

const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
    ]
});

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Utils

function rand(max){
    return Math.floor(Math.random() * max);
}

// COMMANDS

function michokal(message){
    const resultProba = new Map();
    resultProba.set("banni(e)", 4);
    resultProba.set("sauvé(e)", 4);
    resultProba.set("pépites", 1);
    var maxProba = 0;
    for (var [key, value] of resultProba)
        maxProba += value;
    var rndResult = rand(maxProba);
    var valTemp = 0;
    var result = "";
    for (var [key, value] of resultProba){
        valTemp += value;
        if (rndResult < valTemp){
            result = key;
            break;
        }
    }
    var g = message.guild;
    g.members.list({limit:200})
        .then(list => message.channel.send(list.at(rand(g.memberCount)).user.username + " " + result))
        .catch(console.error);
}

function clean(message){
    if (message.author.id != idLead) return;
    var nb = message.content.split(' ')[1];
    if (isNaN(nb)) nb = 99;
    var ms = message.channel.messages;
    ms.fetch({limit : nb + 1})
        .then(messages => { for (let i = 0; i < messages.size; i++) ms.delete(messages.at(i)) })
        .catch(console.error);
}

// messageCreate Event

const mapMessageCreate = {
    "michokal" : michokal,
    "clean" : clean
}

client.on("messageCreate", message => {
    if (message.content.startsWith(`${prefix}`))
        mapMessageCreate[message.content.slice(1).split(' ')[0]](message);
})

// LOGIN

client.login(token);
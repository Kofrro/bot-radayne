// INIT

const { prefix, token, idLead } = require("./config.json")

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

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

function getResultRandom(){
    // Partie à modifier pour ajouter des résultats
    const resultProba = new Map();
    resultProba.set("banni(e)", 4);
    resultProba.set("sauvé(e)", 4);
    resultProba.set("pépites", 1);

    // Ne pas modifier la suite
    var maxProba = 0;
    for (var [key, value] of resultProba)
        maxProba += value;
    var rndResult = rand(maxProba);
    var valTemp = 0;
    for (var [key, value] of resultProba){
        valTemp += value;
        if (rndResult < valTemp)
            return key;
    }
}

function getEmbedMichokal(user, result){
    var embed = new EmbedBuilder();
    embed.setColor(0xff0000)
    embed.setTitle(user.username)
    embed.setDescription("Le destin a choisi pour toi: **" + result + "**")
    embed.addFields({ name: "Raison", value: (result === "banni(e)") ? "Pas de bol KEKW ICANT" : "Full luck ^^", inline: true })
    embed.setThumbnail(user.avatarURL())
    embed.setImage("https://static.euronews.com/articles/stories/06/46/57/16/1000x563_cmsv2_c285593a-edbf-5f1c-a7c3-bd082d34c186-6465716.jpg")
    embed.setTimestamp()
    return embed;
}

async function michokal(message){
    message.channel.send("5 :joy:");
    await new Promise(resolve => setTimeout(resolve, 1000));
    message.channel.send("4 :thinking:");
    await new Promise(resolve => setTimeout(resolve, 1000));
    message.channel.send("3 :eyes:");
    await new Promise(resolve => setTimeout(resolve, 1000));
    message.channel.send("2 :smirk:");
    await new Promise(resolve => setTimeout(resolve, 1000));
    message.channel.send("1 :gun:");
    await new Promise(resolve => setTimeout(resolve, 1000));
    var g = message.guild;
    var usernameTmp = message.content.split(' ')[1];
    if (typeof usernameTmp === 'undefined')
        g.members.list({limit : 200})
            .then(list => {
                randIdx = rand(g.memberCount);
                while (list.at(randIdx).user.bot)
                    randIdx = rand(g.memberCount);
                message.channel.send({ embeds : [getEmbedMichokal(list.at(randIdx ).user, getResultRandom())] })
            })
            .catch(console.error)
    else
        g.members.list({limit : 200})
            .then(list => {
                var found = false;
                for (var [key, value] of list)
                    if (value.user.username.toLowerCase().startsWith(usernameTmp.toLowerCase())){
                        found = true;
                        if (value.user.bot)
                            message.channel.send("Le destin des bots ne vous appartient pas! è_é");
                        else
                            message.channel.send({ embeds : [getEmbedMichokal(value.user, getResultRandom())] });
                        break;
                    }
                if (!found)
                    message.channel.send("Personne dans le serveur n'a un pseudo commençant par **" + usernameTmp + "** :/ :koala:");
            })
            .catch(console.error)
}

function clean(message){
    if (message.author.id != idLead){
        message.channel.send("Commande utilisable que par le lead de ce bot ^^ :koala:");
        return;
    }
    var nb = message.content.split(' ')[1];
    if (isNaN(nb))
        nb = 99;
    var ms = message.channel.messages;
    ms.fetch({limit : nb + 1})
        .then(messages => {
            for (let i = 0; i < messages.size; i++)
            ms.delete(messages.at(i))
        })
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
// INIT

const { prefix, token, idLead, idRoleLead } = require("./config.json")

const { Client, GatewayIntentBits, EmbedBuilder, GuildMemberRoleManager } = require('discord.js');

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

const urlImageKoala = "https://static.euronews.com/articles/stories/06/46/57/16/1000x563_cmsv2_c285593a-edbf-5f1c-a7c3-bd082d34c186-6465716.jpg";

function rand(max){
    return Math.floor(Math.random() * max);
}

function hasRole(member, roleId){
    var roles = member.roles.cache.map((role) => role.id);
    for (var i = 0; i < roles.length; i++)
        if (roles[i] === roleId)
            return true;
    return false;
}

function msToMS(time) {
    var minutes = Math.floor(time / 60000);
    var seconds = ((time % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
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

function getEmbedRoulette(member, result){
    var embed = new EmbedBuilder();
    embed.setTitle(member.displayName);
    embed.setDescription("Le destin a choisi pour toi: **" + result + "**");
    embed.setThumbnail(member.displayAvatarURL());
    embed.setImage(urlImageKoala);
    embed.setTimestamp();
    return embed;
}

async function roulette(message){
    if (message.author.id != idLead && !hasRole(message.member, idRoleLead)){
        message.guild.roles.fetch(idRoleLead)
            .then(role => message.channel.send(`Commande utilisable que par les membres ayant le rôle **${role.name}**`))
            .catch(console.error);
    }
    else {
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
        if (message.mentions.roles.size >= 1){
            g.members.list({limit : 500})
            .then(list => {
                rndIdx = rand(g.memberCount);
                while (!hasRole(list.at(rndIdx), message.mentions.roles.at(0).id))
                    rndIdx = rand(g.memberCount);
                var result = getResultRandom();
                message.channel.send({ embeds : [getEmbedRoulette(list.at(rndIdx), result)] })
                if (result === "banni(e)" && idLead !== "272097719798071298")
                    list.at(rndIdx).kick();
            })
            .catch(console.error)
        }
        else if (message.mentions.members.size >= 1){
            if (message.mentions.members.at(0).user.bot)
                message.channel.send("Le destin des bots ne vous appartient pas! è_é");
            else{
                var result = getResultRandom();
                message.channel.send({ embeds : [getEmbedRoulette(message.mentions.members.at(0), result)] });
                if (result === "banni(e)" && idLead !== "272097719798071298")
                    message.mentions.members.at(0).kick();
            }
        }
        else if (typeof usernameTmp === 'undefined')
            g.members.list({limit : 500})
                .then(list => {
                    rndIdx = rand(g.memberCount);
                    while (list.at(rndIdx).user.bot)
                        rndIdx = rand(g.memberCount);
                    var result = getResultRandom();
                    message.channel.send({ embeds : [getEmbedRoulette(list.at(rndIdx), result)] })
                    if (result === "banni(e)" && idLead !== "272097719798071298")
                        list.at(rndIdx).kick();
                })
                .catch(console.error)
        else
            g.members.list({limit : 500})
                .then(list => {
                    var found = false;
                    for (var [key, value] of list)
                        if (value.displayName.toLowerCase().startsWith(usernameTmp.toLowerCase())){
                            found = true;
                            if (value.user.bot)
                                message.channel.send("Le destin des bots ne vous appartient pas! è_é");
                            else{
                                var result = getResultRandom();
                                message.channel.send({ embeds : [getEmbedRoulette(value, result)] });
                                if (result === "banni(e)" && idLead !== "272097719798071298")
                                    value.kick();
                            }
                            break;
                        }
                    if (!found)
                        message.channel.send(`Personne dans le serveur n'a un pseudo commençant par **${usernameTmp}**`);
                })
                .catch(console.error)
    }
}

function clean(message){
    if (message.author.id != idLead)
        message.guild.members.fetch(idLead)
            .then(member => message.channel.send(`Commande utilisable que par **${member.displayName}**`))
            .catch(console.error);
    else if (message.mentions.members.size >= 1){
        var ms = message.channel.messages;
        ms.fetch({limit : 100})
            .then(messages => {
                for (let i = 0; i < messages.size; i++)
                    if (messages.at(i).member === message.mentions.members.at(0))
                        ms.delete(messages.at(i))
            })
            .catch(console.error);
    }
    else {
        var nb = parseInt(message.content.split(' ')[1]);
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
}

function getEmbedLuigi(member, duration){
    var embed = new EmbedBuilder();
    embed.setTitle(member.displayName);
    embed.setDescription("Mute pendant " + msToMS(duration));
    embed.setThumbnail(member.displayAvatarURL());
    embed.addFields({ name : "Pourquoi ?", value : "Feur", inline : true });
    embed.setImage(urlImageKoala);
    embed.setTimestamp();
    return embed;
}

function luigi(message){
    var rndDuration = rand(9 * 60 * 1000) + 60 * 1000;
    message.guild.members.fetch("220639936053772288")
        .then(member => {
            member.timeout(rndDuration);
            message.channel.send({ embeds : [getEmbedLuigi(member, rndDuration)] });
        })
        .catch(console.error);
}

function master(message){
    message.channel.send("@everyone Caaaaaaaaalme les gars caaaaaaaalme");
}

function viking(message){
    message.channel.send("@everyone Oh razzia oh ");
}

function ox(message){
    message.channel.send("@everyone Les gars à trois dites tous OXXXXX WIIIIN");
}

function ezpk(message){
    message.channel.send("@everyone GO AVA GOGOGO RAZZIA");
}

function gasy(message){
    message.channel.send("<@!339377927185498114> C’est vrai ton père c’est Gazo ?");
}

// messageCreate Event

const mapMessageCreate = {
    "roulette" : roulette,
    "clean" : clean,
    "ftgluigi" : luigi,
    "master" : master,
    "viking" : viking,
    "ox" : ox,
    "ezpk" : ezpk,
    "gasy" : gasy
}

client.on("messageCreate", message => {
    if (message.content.startsWith(`${prefix}`))
        try { mapMessageCreate[message.content.slice(1).split(' ')[0]](message); }
        catch (e){ console.error(e); }
})

// LOGIN

client.login(token);
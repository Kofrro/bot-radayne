// INIT

const fs = require("fs/promises");

const { prefix, token, idLead, idRoleLead } = require("./config.json")

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

function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
}

function msToHMS(milliseconds) {
    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    seconds = seconds % 60;
    minutes = minutes % 60;
    var res = "";
    if (hours > 0)
        res += `${padTo2Digits(hours)}h`;
    if (minutes > 0)
        res += `${padTo2Digits(minutes)}m`;
    return res + `${padTo2Digits(seconds)}s`;
}

// COMMANDS

async function regles(message){
    message.channel.send(`Trop long, palu donc je lance une roulette sur <@${message.author.id}> ^^`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await countdownRoulette(message.channel);
    var regles = "\nLa roulette consiste en une sentence aléatoire sur une personne choisie aléatoirement.";
    regles += "\n\nIl y a 4 résultats possibles:";
    regles += "\n\n• **Timeout** -> La cible est timeout pendant une durée allant de 5 minutes a 5 heures.";
    regles += "\n• **perte de kamas** -> La cible doit donner entre 100 000 et 500 000 kamas pour la cagnotte.";
    regles += "\n• **sauvé(e)** -> La cible est sauvée, il ne se passe rien.";
    regles += "\n• **gain de kamas** -> La cible gagne entre 100 000 et 500 000 kamas depuis la cagnotte.";
    regles += "\n\nDernière chose: la cagnotte n'est utilisable qu'une fois par jour par personne.";
    message.channel.send(`Nan j'déconne, voici les règles:\n${regles}`);
}

function getResultRouletteRandom(){
    const resultProba = new Map();
    resultProba.set("timeout", 5);
    resultProba.set("perte de kamas", 5);
    resultProba.set("sauvé(e)", 5);
    resultProba.set("gain de kamas", 1);
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

async function updateJackpotRoulette(value){
    try{
        const data = await fs.readFile("jackpot.txt");
        var valTmp = parseInt(data.toString())
        await fs.writeFile("jackpot.txt", `${valTmp - value}`);
    }
    catch (e){
        console.error(e);
    }
}

async function getJackpotRoulette(){
    try{
        const data = await fs.readFile("jackpot.txt");
        return parseInt(data.toString());
    }
    catch (e){
        console.error(e);
    }
    return -1;
}

async function canUseRoulette(id){
    if (id == idLead)
        return true;
    var uses = new Map(Object.entries(JSON.parse(await fs.readFile("useRoulette.json"))));
    var now = Date.now();
    if (uses.has(id) && now - uses.get(id) < 24 * 60 * 60 * 1000)
        return false;
    uses.set(id, now);
    await fs.writeFile("useRoulette.json", JSON.stringify(Object.fromEntries(uses)));
    return true;
}

async function getValueRoulette(member, result){
    var value = 0;
    if (result === "timeout" && idLead !== "272097719798071298"){
        if (modeRoulette === 0){
            value = 5 * 60 * 1000 + rand(5 * 59 * 60 * 1000);
            member.timeout(value);
        }
        else
            member.kick();
    }
    else if (result === "perte de kamas"){
        value = -100000 * (rand(4) + 1);
        await updateJackpotRoulette(value);
    }
    else if (result === "gain de kamas"){
        value = 100000 * (rand(4) + 1);
        await updateJackpotRoulette(value);
    }
    return value;
}

async function getEmbedRoulette(member, result, value){
    var embed = new EmbedBuilder();
    embed.setTitle(member.displayName);
    embed.setDescription("Sentence -> **" + result + "**");
    if (result ===  "timeout")
        embed.addFields({ name : "Durée", value : msToHMS(value), inline : true });
    else if (result === "perte de kamas")
        embed.addFields({ name : "Nombre de kamas", value : `${value}`, inline : true });
    else if (result === "gain de kamas")
        embed.addFields({ name : "Nombre de kamas", value : `${value}`, inline : true });
    var jackpot = await getJackpotRoulette();
    embed.addFields({ name : "Cagnotte actuelle", value : `${jackpot}`, inline : true });
    embed.setThumbnail(member.displayAvatarURL());
    embed.setImage(urlImageKoala);
    embed.setTimestamp();
    return embed;
}

async function countdownRoulette(channel){
    channel.send("5 :joy:");
    await new Promise(resolve => setTimeout(resolve, 1000));
    channel.send("4 :thinking:");
    await new Promise(resolve => setTimeout(resolve, 1000));
    channel.send("3 :eyes:");
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    channel.send("2 :smirk:");
    await new Promise(resolve => setTimeout(resolve, 1000));
    channel.send("1 :gun:");
    await new Promise(resolve => setTimeout(resolve, 1000));
}

function applyRoulette(member, channel){
    var result = getResultRouletteRandom();
    getValueRoulette(member, result)
        .then(val => getEmbedRoulette(member, result, val)
            .then(embed => channel.send({ embeds : [embed] }))
            .catch(console.error))
        .catch(console.error);
}

var rouletteActive = false;
var rouletteUser = "";
async function roulette(message){
    if (rouletteActive){
        message.channel.send(`La roulette est déjà en cours d'utilisation par **${rouletteUser}**, veuillez patienter`);
        return;
    }
    rouletteActive = true;
    rouletteUser = message.member.displayName;
    if (message.author.id != idLead && idLead === "272097719798071298" && !hasRole(message.member, idRoleLead)){
        message.guild.roles.fetch(idRoleLead)
            .then(role => message.channel.send(`Commande utilisable que par les membres ayant le rôle **${role.name}**`))
            .catch(console.error);
    }
    else if (!await canUseRoulette(message.author.id))
            message.channel.send("Tu as déjà utilisé la roulette ces dernières 24h");
    else {
        await countdownRoulette(message.channel);
        var usernameTmp = message.content.split(' ')[1];
        // Rnd by role
        if (message.mentions.roles.size >= 1){
            message.guild.members.list({limit : 500})
                .then(list => {
                    isAvailable = false;
                    for (var [key, value] of list)
                        if (hasRole(value, message.mentions.roles.at(0).id) && !value.user.bot){
                            isAvailable = true;
                            break;
                        }
                    if (!isAvailable)
                        message.channel.send("Vous ne pouvez pas cibler un rôle ne contenant que des bots! è_é");
                    else{
                        rndIdx = rand(message.guild.memberCount);
                        while (!hasRole(list.at(rndIdx), message.mentions.roles.at(0).id) || list.at(rndIdx).user.bot)
                            rndIdx = rand(message.guild.memberCount);
                        applyRoulette(list.at(rndIdx), message.channel);
                    }
                })
                .catch(console.error)
        }
        // By mention
        else if (message.mentions.members.size >= 1){
            if (message.mentions.members.at(0).user.bot)
                message.channel.send("Le destin des bots ne vous appartient pas! è_é");
            else
                applyRoulette(message.mentions.members.at(0), message.channel);
        }
        // Rnd
        else if (typeof usernameTmp === 'undefined')
            message.guild.members.list({limit : 500})
                .then(list => {
                    rndIdx = rand(message.guild.memberCount);
                    while (list.at(rndIdx).user.bot)
                        rndIdx = rand(message.guild.memberCount);
                    applyRoulette(list.at(rndIdx), message.channel);
                })
                .catch(console.error)
        // By name
        else
            message.guild.members.list({limit : 500})
                .then(list => {
                    var found = false;
                    for (var [key, value] of list)
                        if (value.displayName.toLowerCase().startsWith(usernameTmp.toLowerCase())){
                            found = true;
                            if (value.user.bot)
                                message.channel.send("Le destin des bots ne vous appartient pas! è_é");
                            else
                                applyRoulette(value, message.channel);
                            break;
                        }
                    if (!found)
                        message.channel.send(`Personne dans le serveur n'a un pseudo commençant par **${usernameTmp}**`);
                })
                .catch(console.error)
    }
    rouletteActive = false;
}

async function jackpot(message){
    var jackpot = await getJackpotRoulette();
    message.channel.send(`La cagnotte est actuellement de **${jackpot}**`);
}

var modeRoulette = 0;
function changeModeRoulette(message){
    if (message.author.id != idLead)
        message.guild.members.fetch(idLead)
            .then(member => message.channel.send(`Commande utilisable que par **${member.displayName}**`))
            .catch(console.error);
    else{
        var nbMode = parseInt(message.content.split(' ')[1]);
        if (!isNaN(nbMode) && (nbMode == 0 || nbMode == 1)){
            modeRoulette = nbMode;
            if (nbMode == 0)
                message.channel.send("La roulette va maintenant timeout")
            else
                message.channel.send("La roulette va maintenant kick")
        }
    }
}

function killMember(message){
    if (message.author.id != idLead)
        message.guild.members.fetch(idLead)
            .then(member => message.channel.send(`Commande utilisable que par **${member.displayName}**`))
            .catch(console.error);
    else if (message.mentions.members.size >= 1){
        if (message.mentions.members.at(0).user.bot)
            message.channel.send("Le destin des bots ne vous appartient pas! è_é");
        else if (idLead !== "272097719798071298" && canKill){
            message.channel.send(`${message.mentions.members.at(0).displayName} a été kick`);
            message.mentions.members.at(0).kick();
        }
        else if(!canKill)
            message.channel.send("Le mode kill n'est pas activé");
    }
}

var canKill = false;
function killMode(message){
    if (message.author.id != idLead)
        message.guild.members.fetch(idLead)
            .then(member => message.channel.send(`Commande utilisable que par **${member.displayName}**`))
            .catch(console.error);
    else {
        canKill = !canKill;
        if (canKill)
            message.channel.send("Kill mode activé")
        else
            message.channel.send("Kill mode desactivé")
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

function ava(message){
    if (message.author.id != idLead)
        message.guild.members.fetch(idLead)
            .then(member => message.channel.send(`Commande utilisable que par **${member.displayName}**`))
            .catch(console.error);
    else if (message.mentions.roles.size >= 1){
        var idxSpace = message.content.indexOf(' ', message.content.indexOf('@'));
        if (idxSpace !== -1){
            var m = message.content.slice(idxSpace + 1);
            message.guild.members.list({limit : 500})
                .then(list => {
                    var listDM = "";
                    for (var i = 0; i < list.size; i++)
                        if(hasRole(list.at(i), message.mentions.roles.at(0).id)){
                            listDM += `\n• ${list.at(i).displayName}`;
                            list.at(i).createDM()
                                .then(channelDM => channelDM.send(m))
                                .catch(console.error);
                        }
                    message.channel.send(`Les personnes suivantes ont été DM:${listDM}`);
                })
                .catch(console.error)
        }
    }
}

function akro(message){
    const sentences = [
        "Ahah mon fr t'inquiète pas",
        "Ah mais les gars, je le tue jamais",
        "Non mais c'est loose",
        "Ecoute moi bien petite merde",
        "Même jouer une classe simple tu sais pas faire",
        "Y'en a pas un qui sait jouer dans cette guilde de merde",
        "On peut pas perdre avec mon niveau actuel",
        "Tali il est toujours pas mort ton lapin?",
        "Corta j'crois que t’as pas compris, tout ce qui est à toi est à moi et tout ce qui est à moi est à moi",
        "Cette guilde me sabote"
    ];
    message.channel.send(sentences[rand(sentences.length)]);
}

function getEmbedLuigi(member, duration){
    var embed = new EmbedBuilder();
    embed.setTitle(member.displayName);
    embed.setDescription("Mute pendant " + msToHMS(duration));
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
    message.channel.send("Caaaaaaaaalme les gars caaaaaaaalme");
}

function viking(message){
    message.channel.send("Oh razzia oh ");
}

function ox(message){
    message.channel.send("Les gars à trois dites tous OXXXXX WIIIIN");
}

function ezpk(message){
    message.channel.send("@everyone GO AVA GOGOGO RAZZIA");
}

function gasy(message){
    message.channel.send("<@!339377927185498114> C’est vrai ton père c’est Gazo ?");
}

// messageCreate Event

const mapMessageCreate = {
    "regles" : regles,
    "roulette" : roulette,
    "jackpot" : jackpot,
    "mode" : changeModeRoulette,
    "kill" : killMember,
    "killMode" : killMode,
    "clean" : clean,
    "ava" : ava,
    "akro" : akro,
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
//=====VAR`S=====
const {Client, MessageEmbed, Intents, MessageActionRow, MessageButton} = require('discord.js')
const client = new Client({
	messageEditHistoryMaxSize: 0,
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
})
var config = require('./config.json')
const QuickChart = require('quickchart-js')
const gamedig = require('gamedig')
var tic = false
var time = ['00:00']
var online = [0]
//=====MAIN=====
client.login(config.token)
function Sleep(milliseconds){
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}
require('dotenv').config()
client.on('ready',async()=>{
    console.log("Бот Запущен как: "+client.user.tag+"")
	let statusChannel = client.channels.cache.get(config.statusChannel)
	if (statusChannel == undefined) {
		console.log('ошибка: айди канала для отправки статуса не верный!')
		return
	}
	let statusMessage = await createStatusMessage(statusChannel)
	if (statusMessage == undefined){
		console.log('ошибка: не удалось отправить сообщение статуса!')
		return
	}
	startStatusMessage(statusMessage)
})
async function createStatusMessage(statusChannel) {
	await clearOldMessages(statusChannel, 1)
	let statusMessage = await getLastMessage(statusChannel)
	if (statusMessage != undefined) {
		return statusMessage
	}
	await clearOldMessages(statusChannel, 0)
	let embed = new MessageEmbed()
	embed.setTitle("Запуск Бота...")
	embed.setColor('#42f5f5')
	return await statusChannel.send({ embeds: [embed]}).then((sentMessage)=> {
		return sentMessage
	})	
}
function clearOldMessages(statusChannel, nbr) {
	return statusChannel.messages.fetch({limit: 99}).then(messages => {
		messages = messages.filter(msg => (msg.author.id == client.user.id && !msg.system))
		let promises = []
		let i = 0
		messages.each(mesasge => {
			if (i >= nbr) {
				promises.push(
					mesasge.delete().catch(function(error) {
						return
					})
				)
			}
			i += 1
		})
		return Promise.all(promises).then(() => {
			return
		})
	}).catch(function(error) {
		return
	})
}
function getLastMessage(statusChannel) {
	return statusChannel.messages.fetch({limit: 20}).then(messages => {
		messages = messages.filter()
		return messages.first()
	}).catch(function(error) {
		return
	})
}
async function startStatusMessage(statusMessage) {
	while(true){
		try {
			let embed = await generateStatusEmbed()
			statusMessage.edit({ embeds: [embed]})
		} catch (error) {
			console.log("ошибка: не удалось отправить сообщение статуса: "+error)
		}
		await Sleep(config.updTime*1000)
	}
}
function generateStatusEmbed(){
	let embed = new MessageEmbed()
	embed.setAuthor({ name: '', iconURL: '', url: '' })
	tic = !tic
	let ticEmojy = tic ? "[⚪]" : "[⚫]"
	let updatedTime = new Date()
	updatedTime.setHours(updatedTime.getHours() + config.timeZoneH - 1)
	updatedTime.setMinutes(updatedTime.getMinutes() + config.timeZoneM)
	let footertimestamp = ticEmojy + ' ' + "Последнее обновление" + ': ' + updatedTime.toLocaleTimeString('ru-RU', {hour12: !config.twofor, month: 'short', day: 'numeric', hour: "numeric", minute: "numeric"})
	embed.setFooter({ text: footertimestamp, iconURL: '' })
	try {
		return gamedig.query({
			type: config.server_type,
			host: config.server_host,
			port: config.server_port,
			maxAttempts: 5,
			socketTimeout: 1000,
			debug: false
		}).then(async(state) =>{
			embed.setColor(config.server_color)
			embed.setTitle(config.server_title)
            embed.addFields(
                { name: '**Айпи Сервера:**', value: '`'+config.server_host+'`' },
                { name: '**Порт Сервера:**', value: '`'+config.server_port+'`' },
                { name: '**Игра:**', value: '`Minecraft BE`', inline: true },
                { name: '**Статус Сервера:**', value: '`[💚] - онлайн`', inline: true },
                { name: '**Игроков Онлайн:**', value: '`'+state.players.length+' / '+state.maxplayers+'`', inline: true },
            )
			client.user.setActivity("[💚] - онлайн: "+state.players.length+"/"+state.maxplayers,{ type:'PLAYING'})
			if (config.server_enable_graph) {
				let date = new Date()
				if(online.length >= 20 || time.length >= 20){
					online.shift()
					time.shift()
				}
				online.push(state.players.length)
				time.push(date.getHours() + ":" + date.getMinutes())
				const myChart = new QuickChart()
				myChart.setConfig({
					type: 'line',
					data: { labels: time, datasets: [{ label: 'онлайн', data: online }] },
				})
				myChart.setWidth(800)
				myChart.setHeight(400)
				myChart.setBackgroundColor('transparent')
				const url = await myChart.getShortUrl()
				embed.setImage(url)
			}
			return embed
		}).catch(function(error){
            let date = new Date()
			console.log("["+time+"]: Сервер оффлайн!")
			client.user.setActivity("❌ Сервер Оффлайн.",{type:'WATCHING'})
            embed.setColor('#ff0000')
			embed.setTitle(config.server_title)
            embed.addFields(
                { name: '**Айпи Сервера:**', value: '`'+config.server_host+'`' },
                { name: '**Порт Сервера:**', value: '`'+config.server_port+'`' },
                { name: '**Игра:**', value: '`Minecraft BE`', inline: true },
                { name: '**Статус Сервера:**', value: '`[❌] - оффлайн`', inline: true },
            )
			return embed
		})
	} catch (error) {
		console.log(error)
        console.log("["+time+"]: Сервер оффлайн!")
        client.user.setActivity("❌ Сервер Оффлайн.",{type:'WATCHING'})
        embed.setColor('#ff0000')
        embed.setTitle(config.server_title)
        embed.addFields(
            { name: '**Айпи Сервера:**', value: '`'+config.server_host+'`' },
            { name: '**Порт Сервера:**', value: '`'+config.server_port+'`' },
            { name: '**Игра:**', value: '`Minecraft BE`', inline: true },
            { name: '**Статус Сервера:**', value: '`[❌] - оффлайн`', inline: true },
        )
        return embed
	}
}
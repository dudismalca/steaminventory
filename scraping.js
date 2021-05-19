const axios = require('axios');
const mysql = require('mysql');
const json = require('json');
const steamid = '76561198044858151'
const steamimgurl = 'https://steamcommunity-a.akamaihd.net/economy/image/'


// Instance da Steam
const instance_steam = axios.create({
    baseURL: `http://steamcommunity.com/inventory/${steamid}/730/2?l`,
});

// Instance do CSGOfloat
const instance_float = axios.create({
    baseURL: `https://api.csgofloat.com/`,
});


async function scrapsteam() {
    try {
        const response = await instance_steam.get()
            for (let i = 0; i < response.data.assets.length; i++) {
                for (let u = 0; u < response.data.descriptions.length; u++) {
                    if (response.data.assets[i].classid === response.data.descriptions[u].classid 
                        && response.data.assets[i].instanceid === response.data.descriptions[u].instanceid 
                        && response.data.descriptions[u].marketable === 1){
                            if (response.data.descriptions[u].commodity === 1) {
                                commodityfunc(response.data.descriptions[u])
                            } else if (response.data.descriptions[u].tags[0].localized_tag_name === 'Agent') {
                                agentfunc(response.data.assets[i], response.data.descriptions[u])
                            } else {
                                gunsfunc(response.data.assets[i], response.data.descriptions[u])
                            }
                    }
                }
            }
    } catch (error) {
        console.log('Erro: ', error)
    }
}

async function commodityfunc(data_descriptions) {
    try {
        let item = data_descriptions.market_name
        let imageurl = steamimgurl + data_descriptions.icon_url
        let tradable = data_descriptions.tradable
    
        // Publicar itens (teste)
        console.log('### Novo item adicionado - COMMODITY ###')
        console.log('Nome do item:', item)
        console.log('ImageURL:', imageurl)
        console.log('Tradable:', tradable)

    } catch (error) {
        console.log('Erro ao retirar os dados de uma commodity:', error)
    }

}

async function agentfunc(data_assets, data_descriptions) {
    try {
        let item = data_descriptions.market_name;
        let assetid = data_assets.assetid;
        let classid = data_assets.classid;
        let instanceid = data_assets.instanceid; 
        let imageurl = steamimgurl + data_descriptions.icon_url      
        let tradable = data_descriptions.tradable;

        // Pegar o tradelink
        let tradelink_raw = data_descriptions.actions[0].link
        let tradelink_steamid = tradelink_raw.replace('%owner_steamid%', steamid)
        let tradelink_done = tradelink_steamid.replace('%assetid%', data_assets.assetid)
    
        // Pegar os patches
        let imagelinkraw = ''
        let stickersinfo = ''
        let nostickers = ''
        for (let j = 0; j < data_descriptions.descriptions.length; j++) {
            if (data_descriptions.descriptions[j].value.includes('https://')) {
                imagelinkraw = data_descriptions.descriptions[j].value
                stickersinfo = await stickersname(imagelinkraw)
                nostickers = stickersinfo.length
            }
            
        }

        // Publicar os dados (teste)
        console.log('### Novo item adicionado - AGENTE ###')
        console.log('AssetID:', assetid)
        console.log('ClassID:', classid)
        console.log('InstanceID:', instanceid)
        console.log('Nome do item:', item)
        console.log('Tradable:', tradable)
        console.log('Tradelink:', tradelink_done)
        console.log('ImageURL:', imageurl)
        console.log('Número de stickers na arma:', nostickers)
        console.log('Info dos stickers:', stickersinfo)

    } catch (error) {
        console.log('Erro ao retirar os dados de um agente:', error)
    }


}

async function gunsfunc(data_assets, data_descriptions){
    try {
        let item = data_descriptions.market_name;
        let assetid = data_assets.assetid;
        let classid = data_assets.classid;
        let instanceid = data_assets.instanceid; 
        let imageurl = steamimgurl + data_descriptions.icon_url      
        let tradable = data_descriptions.tradable;
        let type = ''
        let exterior = ''

        // Arrumar o tradelink
        let tradelink_raw = data_descriptions.actions[0].link
        let tradelink_steamid = tradelink_raw.replace('%owner_steamid%', steamid)
        let tradelink_done = tradelink_steamid.replace('%assetid%', data_assets.assetid)

        //Pegar o float
        let data_CSGOfloat = await get_float(tradelink_done)
        let floatvalue = data_CSGOfloat.data.iteminfo.floatvalue
        let paint = data_CSGOfloat.data.iteminfo.item_name
        let weapon = data_CSGOfloat.data.iteminfo.weapon_type
    
        // Pegar os stickers
        let imagelinkraw = ''
        let stickersinfo = ''
        let nostickers = ''
        for (let j = 0; j < data_descriptions.descriptions.length; j++) {
            if (data_descriptions.descriptions[j].value.includes('https://')) {
                imagelinkraw = data_descriptions.descriptions[j].value
                stickersinfo = await stickersname(imagelinkraw)
                nostickers = stickersinfo.length
            }
            
        }
        
        // Pegar o Type, Weapon e Exterior
        for (let i = 0; i < data_descriptions.tags.length; i++) {
            if (data_descriptions.tags[i].category === "Type") {
                type = data_descriptions.tags[i].localized_tag_name
            } else if (data_descriptions.tags[i].category === "Exterior") {
                exterior = data_descriptions.tags[i].localized_tag_name
            }
        }
    
        // Pegar o nametag
        let nametagraw = data_descriptions.fraudwarnings?data_descriptions.fraudwarnings[0] : '';
        let nametag = nametagraw.replace("Name Tag: ''", "")
        nametag = nametag.replace("''", "")
    
        // Pegar o Weapon para Luva
        
        // Publicar os dados (teste)
        console.log('### Novo item adicionado ### - ARMAS')
        console.log('AssetID:', assetid)
        console.log('ClassID:', classid)
        console.log('InstanceID:', instanceid)
        console.log('Nome do item:', item)
        console.log('Tipo do item:', type)
        console.log('Categoria do item:', weapon)
        console.log('Pintura:', paint)
        console.log('desgaste:', exterior)
        console.log('Tradable:', tradable)
        console.log('Tradelink:', tradelink_done)
        console.log('Float:', floatvalue)
        console.log('Nametag:', nametag)
        console.log('ImageURL:', imageurl)
        console.log('Número de stickers na arma:', nostickers)
        console.log('Info dos stickers:', stickersinfo)

    
    } catch (error) {
        console.log('Erro ao retirar os dados de uma arma:', error)
    }


}

async function get_float(tradelink) {
    try {
        const responsefloat = await instance_float.get(`?url=${tradelink}`)
        return responsefloat
    } catch (error) {
        console.log('Erro ao buscar o float: ', error)
    }
}

async function stickersname(imagelinkraw) {
    let stickers_temp = imagelinkraw.split('src="')
    let stickersinfo = []
    for (let i = 0; i < stickers_temp.length; i++) {
        if (i != 0) {
            let sticker = stickers_temp[i].split('">')
            stickersinfo.push({link:sticker[0]})
        }
        if (i == stickers_temp.length - 1) {
            let stickernametemp = stickers_temp[i].split(': ')
            let stickernametemp2 = stickernametemp[1].split('</center>')
            let stickername = stickernametemp2[0].split(', ')
            for (let j = 0; j < stickername.length; j++) {
                stickersinfo[j].name = stickername[j]
            }  
        }
    }
    return stickersinfo
}

async function publish(assetid, classid, instanceid, item, type, paint, wear, tradable, marketable, tradelink_done, floatvalue,
         imageurl, nostickers, stickersinfo) {
    try {
        console.log('### Novo item adicionado ###')
        console.log('AssetID:', assetid)
        console.log('ClassID:', classid)
        console.log('InstanceID:', instanceid)
        console.log('Nome do item:', item)
        console.log('Tipo do item:', type)
        console.log('Pintura:', paint)
        console.log('desgaste:', wear)
        console.log('Tradable:', tradable)
        console.log('Marketable:', marketable)
        console.log('Tradelink:', tradelink_done)
        console.log('Float:', floatvalue)
        console.log('ImageURL:', imageurl)
        console.log('Número de stickers na arma:', nostickers)
        console.log('Info dos stickers:', stickersinfo)
    } catch (error) {
        console.log('Erro ao publicar:', error)
    }
}


scrapsteam()

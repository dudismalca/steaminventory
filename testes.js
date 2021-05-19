const axios = require('axios');
const steamid = '76561198437724880'

// https://steamcommunity.com/profiles/76561198523704082/inventory/json/730/2/?l=english

// Instance da Steam
const instance_steam = axios.create({
    baseURL: `http://steamcommunity.com/profiles/${steamid}/inventory/json/730/2/?l=english`,
});

async function scrap() {
    try {
        const response = await instance_steam.get()
        // let response_temp = response.data.rgDescriptions.stringify()
        let response_temp1 = response.parse()
        console.log(response_temp1)
    } catch (error) {
        console.log('Erro ao buscar no BD:', error)
    }
}

scrap()
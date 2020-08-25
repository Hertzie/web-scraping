const scrapeit = require('scrape-it');
const fs = require('fs');
const url = 'https://scrapethissite.com/pages/simple/';
let objData = {};

exports.scrapePaises = async() => {
    console.log(`Haciendo scraping de paises en ${url}`);
    const scrapePaises = await scrapeit(url, {
        paises : {
            selector : 'div.container',
            listItem : 'div.country',
            data : {
                nombre_pais : 'h3',
                capital : 'span.country-capital',
                poblacion : 'span.country-population',
                area : 'span.country-area'
            }
        }
    });

    const paisesTotales = scrapePaises.data.paises;
    objData.paises = paisesTotales;
    objData.mayor_poblacion = getPaisesMayorPoblacion(paisesTotales);
    objData.mayor_area = getPaisesMayorArea(paisesTotales);

    crearJsonPaises();
}

function crearJsonPaises(){
    const json = JSON.stringify(objData, null, '\t');
    fs.writeFile('paises.json', json, 'utf8', function(){
        console.log("Archivo json de paises correctamente.");
    });
}

function getPaisesMayorArea(paises){
    const paisesArea = paises.map( p => parseInt(p.area))
                             .sort((a,b) => a - b);
    const numeroHead = paisesArea[(paisesArea.length / 2) - 1];
    const numeroTail = paisesArea[(paisesArea.length / 2)];
    const medianaArea = (numeroHead + numeroTail) / 2;

    const paisesMayorArea =   paises.filter( p => parseInt(p.area) > medianaArea)
                                    .map( p => { return {nombre_pais : p.nombre_pais, area : parseInt(p.area)}; });

    return {
        mediana_area : medianaArea,
        paises : paisesMayorArea
    };
}

function getPaisesMayorPoblacion(paises){
    const paisesPoblacion = paises.map( p => parseInt( p.poblacion ) )
                               .sort((a,b) => a - b);
    const numeroHead = paisesPoblacion[ (paisesPoblacion.length / 2) - 1];
    const numeroTail = paisesPoblacion[ (paisesPoblacion.length / 2) ];
    const medianaPoblacion = (numeroHead + numeroTail) / 2;
    
    const paisesMayorPoblacion =  paises.filter( p => parseInt(p.poblacion) > medianaPoblacion )
                                        .map( p => { return {nombre_pais : p.nombre_pais, poblacion : parseInt(p.poblacion)}; });
    
    return {
        mediana_poblacion : medianaPoblacion,
        paises : paisesMayorPoblacion
    };
}
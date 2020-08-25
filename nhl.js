const scrapeit = require('scrape-it');
const fs = require('fs');
const urlBase = 'https://scrapethissite.com/pages/forms/?page_num=';
const urlBusquedaEquipo = 'https://scrapethissite.com/pages/forms/?q=';
const numPaginas = 24;
let arregloEquipos = [];
let objData = {};

exports.scrapeEquipos = async() =>{
    for(let i = 1; i <= numPaginas; i++){
        console.log(`Haciendo scraping de equipos en ${urlBase}${i}`);
        const tablaScrape = await scrapeit(urlBase+i, {
            tabla : {
                selector : 'table',
                listItem : 'tr',
                data : {
                    nombre_equipo : 'td.name'
                }
            }
        });

        tablaScrape.data.tabla.filter( e => e.nombre_equipo != '' )
                              .forEach( e => !arregloEquipos.includes(e.nombre_equipo) 
                                             ? arregloEquipos.push(e.nombre_equipo) 
                                             : null );
    }

    for(const equipo of arregloEquipos){
        const { equipoFormateado, urlEquipo } = crearUrlEquipo(equipo);
        const estadisticasEquipo = await obtenerEstadisticasEquipo(urlEquipo);
        objData[equipoFormateado] = estadisticasEquipo;
    }

    crearJsonEquipos();
}

function crearJsonEquipos(){
    const json = JSON.stringify(objData, null, '\t');
    fs.writeFile('equiposNHL.json', json, 'utf8', function(){
        console.log("Archivo json de equipos correctamente.");
    });
}

function crearUrlEquipo(equipo){
    const equipoLower = equipo.toLowerCase();
    const equipoSplit = equipoLower.split(' ');
    const equipoFormateado = equipoLower.replace(/\s+/g, '-');
    let urlEquipo = urlBusquedaEquipo;

    for(let i = 0; i < equipoSplit.length; i++){
        urlEquipo += `${equipoSplit[i]}+`;
    }

    urlEquipo = urlEquipo.slice(0, -1);
    return {
        equipoFormateado,
        urlEquipo
    };
}

async function obtenerEstadisticasEquipo(urlEquipo){
    console.log(`Obteniendo estadisticas de equipo en ${urlEquipo}`);
    const equipoScrape = await scrapeit(urlEquipo, {
        datosTabla : {
            selector : 'table',
            listItem : 'tr',
            data : {
                anio : 'td.year',
                ganados : 'td.wins',
                perdidos : 'td.losses',
                overtime_perdidos : 'td.ot-losses',
                porcentaje_ganados : 'td.pct',
                goles_favor : 'td.gf',
                goles_contra : 'td.ga',
                diferencia_goles : 'td.diff'
            }
        }
    });

    const datosEquipo = equipoScrape.data.datosTabla
    datosEquipo.shift();
    return datosEquipo;
}


const scrapeit = require('scrape-it');
const fs = require('fs');

let objData = {};
const urlBase = 'http://quotes.toscrape.com';
const urlBaseTag = 'http://quotes.toscrape.com/tag';

async function scrapeQuotes(){
    const resultadoTags = await scrapeit(urlBase, {
        tags : {
            listItem : 'span.tag-item',
            data : {
                tag_name : 'a.tag'
            }
        }
    });

    const tags = resultadoTags.data.tags;

    for(const tag of tags){
        const tagsResult = await scrapePaginaWithTagUrl(tag.tag_name);
        objData[tag.tag_name] = tagsResult;
    }

    const json = JSON.stringify(objData, null, '\t');
    fs.writeFile('quotes.json', json, 'utf8', function(){
        console.log("Archivo creado correctamente.");
    });
}

async function scrapePaginaWithTagUrl(tag){
    const urlTag = `${urlBaseTag}/${tag}`;
    console.log(`Haciendo scrapping en ${urlTag}`);

    const resultadoTag = await scrapeit(urlTag, {
        quotes : {
            listItem : 'div.quote',
            data : {
                titulo : 'span.text',
                autor : 'small.author',
                link : {
                    selector : 'a',
                    attr : 'href'
                }
            }
        }
    });

    const quotes = resultadoTag.data.quotes;
    quotes.forEach( e => e.tag = tag);
    return quotes;
}

//scrapeQuotes();

//const LibrosScrapper = require('./libros');
//LibrosScrapper.transformarJson();

const NhlScrapper = require('./nhl');
NhlScrapper.scrapeEquipos();
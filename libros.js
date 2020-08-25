const scrapeit = require('scrape-it');
const fs = require('fs');
const urlBase = 'http://books.toscrape.com/';
const urlPaginadoBase = 'http://books.toscrape.com/catalogue';
let objData = {};

exports.scrapeLibros = async () => {
    const paginasScrap = await scrapeit(urlBase, {
        paginas : {
            selector : 'li.current'
        }
    });
    const numPaginas = paginasScrap.data.paginas.split(" ")[3];

    for(let i = 1; i<=3; i++){
        console.log(`Haciendo scraping en ${urlPaginadoBase}/page-${i}.html`);
        const articulos = await scrapeit(`${urlPaginadoBase}/page-${i}.html`, {
            articulos : {
                listItem : 'article.product_pod',
                data : {
                    imagen : {
                        selector : 'img',
                        attr : 'src'
                    },
                    titulo_libro : 'a',
                    precio : 'p.price_color',
                    stock : 'p.availability',
                    link : {
                        selector : 'a',
                        attr : 'href'
                    } 
                    
                }
            }
        });
    
        let articulosData = articulos.data.articulos;
        articulosData.forEach( e => {
            e.imagen = `${urlBase}${e.imagen}`;
            e.link = `${urlPaginadoBase}/${e.link}`;
            e.pagina = i;
        });
        
        for(const articulo of articulosData){
            const articuloMetadata = await this.scrapeMetadataLibro(articulo);
            const metadataEntries = Object.entries(articuloMetadata);
            
            for(let i = 0; i < metadataEntries.length; i++){
                const key = metadataEntries[i][0];
                const valor = metadataEntries[i][1];
                articulo[key] = valor;
            }
        }
        objData[`pagina_${i}`] = articulosData;
    }
    
    const objKeys = Object.keys(objData);
    console.log(objKeys)

    const json = JSON.stringify(objData, null, '\t');
    fs.writeFile('libros.json', json, 'utf8', function(){
        console.log("Archivo creado correctamente.");
    });
}

exports.scrapeMetadataLibro = async (articulo) => {
    console.log(`Haciendo scrapping de libro ${articulo.titulo_libro} en página ${articulo.pagina}.`);
    const metadatosLibro = await scrapeit(articulo.link, {
        datosTabla : {
            listItem : 'tr',
            data : {
                header : 'th',
                valor : 'td'
            }
        },
        descripcion : {
            selector : 'article > p'
        },
        categoria : {
            selector : 'ul.breadcrumb',
            data : {
                partes : {
                    listItem : 'li'
                }
            }
        }
    });

    const datosTabla = metadatosLibro.data.datosTabla;
    const descripcion = metadatosLibro.data.descripcion;
    const categoria = metadatosLibro.data.categoria.partes[2];
    let objMetadata = {};

    for(let i = 0; i < datosTabla.length; i++){
        switch(i){
            case 2:
                objMetadata.precio_normal = datosTabla[i].valor;
                break;
            case 3:
                objMetadata.precio_impuesto = datosTabla[i].valor;
                break;
            default:
                const propiedadLower = datosTabla[i].header.toLowerCase();
                const propiedadFormateada = propiedadLower.replace(/ /g, "_");
                objMetadata[propiedadFormateada] = datosTabla[i].valor;
                break;
        }
    }

    objMetadata.descripcion = descripcion;
    objMetadata.categoria = categoria.replace(/\s+/g, '-').toLowerCase();

    return objMetadata;
}

exports.transformarJson = async() => {
    let objFinal = {};
    let arrayTotal = [];
    const { pageKeys, categorias, data } = getJsonMetadata();
    objFinal.categorias = categorias;

    pageKeys.forEach( pagina => {
        const libros = data[pagina];
        libros.forEach( e => arrayTotal.push(e) );
    });

    objFinal.data = arrayTotal;

    const json = JSON.stringify(objFinal, null, '\t');
    fs.writeFile('librosCategoria.json', json, 'utf8', function(){
        console.log("Archivo creado correctamente.");
    });

}

function getJsonMetadata(){
    const rawData = fs.readFileSync('libros.json');
    const data = JSON.parse(rawData);
    const dataKeys = Object.keys(data);
    let categoriasArray = [];

    for(let i = 0; i < dataKeys.length; i++){
        const paginaLibros = data[dataKeys[i]];
        paginaLibros.forEach( e => !categoriasArray.includes(e.categoria) ? categoriasArray.push(e.categoria) : null );
    }

    return {
        pageKeys : dataKeys,
        categorias : categoriasArray,
        data
    }
}
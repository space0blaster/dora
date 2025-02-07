let indexedFiles=0;
let embeddedMetadata=0;

class FilesInterface {
    static showFiles(dir) {
        E.get('pathIndicator').innerHTML='';
        E.get('filesGrid').innerHTML='';
        let pathIndicator=E.get('pathIndicator');
        //
        let base=E.span(pathIndicator,'pathIndicatorFolder','');
        base.innerHTML='<i class="fa-light fa-house"></i>';
        base.onclick=()=>{
            FilesInterface.showFiles(config.targetDirectory);
        };
        E.span(pathIndicator,'','').innerHTML=' / ';
        for(let i=1;i<dir.split('/').length;i++) {
            let pathFolder=E.span(pathIndicator,'pathIndicatorFolder','');
            pathFolder.innerHTML=dir.split('/')[i];
            pathFolder.onclick=()=>{
                let buildPath='';
                for(let j=1;j<=i;j++) {
                    buildPath=buildPath+'/'+dir.split('/')[j];
                }
                FilesInterface.showFiles(buildPath);
            };
            E.span(pathIndicator,'','').innerHTML=' / ';
        }
        //
        let filesGrid=E.get('filesGrid');
        fs.readdir(dir, async (err, files) => {
            if (files) {
                files.forEach((file, i) => {
                    if (['.DS_Store', '.localized'].indexOf(file) === -1) {
                        let stats = fs.statSync(path.join(dir, file));
                        let f = E.div(filesGrid, 'gridItem', '');
                        if (file.split('.')[file.split('.').length - 1] === 'png') E.img(f, 'gridItemThumb', '', dir + '/' + file);
                        else if (stats.blocks === 0) E.div(f, 'gridItemIcon', '').innerHTML = '<i class="fa-solid fa-folder"></i>';
                        else E.div(f, 'gridItemIcon', '').innerHTML = '<i class="fa-solid fa-file"></i>';
                        E.div(f, 'gridItemName', '').innerHTML = T.s(file, 20);
                        f.onclick=()=>{
                        };
                        f.addEventListener("dblclick", (e) => {
                            e.preventDefault();
                            if(stats.blocks === 0) FilesInterface.showFiles(dir + '/' + file);
                        });
                    }
                });
                if(fs.existsSync(appDataDir+'/index.json')) {
                    if(JSON.parse(fs.readFileSync(appDataDir+'/index.json')).targetDirectory===config.targetDirectory) {
                        indexedFiles=JSON.parse(fs.readFileSync(appDataDir + '/index.json')).files.length;
                        const collection=await chroma.getCollection({name:md5(config.targetDirectory)});
                        embeddedMetadata=await collection.count();
                        E.get('indexed').innerHTML='<b>Target Directory</b>: '+config.targetDirectory+'<br/><b>Files Indexed</b>: '+H.numberNotation(indexedFiles, {notation:'short'})+'<br/><b>Metadata Embedded</b>: '+H.numberNotation(embeddedMetadata,{notation:'short'});
                    }
                    else FilesInterface.index(config.targetDirectory);
                }
                else {
                    FilesInterface.index(config.targetDirectory);
                }
            }
        });
    }
    static index(targetDirectory) {
        let indexed={
            targetDirectory:config.targetDirectory,
            model:config.embedModel,
            files:[]
        };
        function walk(dir) {
            let items=fs.readdirSync(dir);
            if(items && items.length>0) {
                items.forEach((item)=>{
                    if(['.DS_Store','.localized','.idea','node_modules'].indexOf(item)===-1) {
                        let stats=fs.statSync(path.join(dir,item));
                        if(stats.blocks===0 && item.indexOf('.')===-1) walk(path.join(dir,item));
                        else {
                            let filePath=path.join(dir,item);
                            let isDirectory=false;
                            if(stats.blocks===0) isDirectory=true;
                            indexed.files.push({name:item,isDirectory:isDirectory,path:filePath,embedded:false});
                            indexedFiles++;
                            E.get('indexed').innerHTML='<b>Target Directory</b>: '+config.targetDirectory+'<br/><b>Files Indexed</b>: '+indexedFiles;
                        }
                    }
                });
            }
        }
        walk(config.targetDirectory);
        E.get('indexed').innerHTML='<b>Target Directory</b>: '+config.targetDirectory+'<br/><b>Files Indexed</b>: '+H.numberNotation(indexedFiles,{notation:'short'});
        fs.writeFile(appDataDir+'/index.json',JSON.stringify(indexed),()=>{
            embedToChroma(indexed.files).then(vector=>{
                E.get('indexed').innerHTML='<b>Target Directory</b>: '+config.targetDirectory+'<br/><b>Files Indexed</b>: '+H.numberNotation(indexedFiles,{notation:'short'})+'<br/><b>Indexes Embedded</b>: '+H.numberNotation(embeddedMetadata,{notation:'short'});
            });
        });
    };
}


FilesInterface.showFiles(config.targetDirectory);

//

E.get('settings').onclick=()=>{
    ipcRenderer.send('open-settings',{});
};

async function embedToChroma(data) {
    //
    let ids=[];
    let vectors=[];
    let documents=[];
    for(let i=0;i<data.length;i++) {
        let d="file_name: "+data[i].name+", file_path: "+data[i].path;
        let v=await ollama.embed({model:'nomic-embed-text',input:d});
        ids.push(md5(data[i].path));
        vectors.push(v.embeddings[0]);
        documents.push(d);
        embeddedMetadata++;
        E.get('indexed').innerHTML='<b>Target Directory</b>: '+config.targetDirectory+'<br/><b>Files Indexed</b>: '+H.numberNotation(indexedFiles,{notation:'short'})+'<br/><b>Metadata Embedded</b>: '+embeddedMetadata+'/'+indexedFiles+' ('+(embeddedMetadata/indexedFiles*100).toFixed(2)+'%)';
        E.get('progressInner').style.width=Math.floor((embeddedMetadata/indexedFiles)*100)+'%';
    }
    const collection=await chroma.getOrCreateCollection({name: md5(config.targetDirectory)});
    await collection.add({ids:ids,embeddings:vectors,documents:documents});
    return true;
}
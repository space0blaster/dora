//
let config={
    targetDirectory:os.homedir(),
    ollamaHost:'localhost',
    ollamaPort:11434,
    chromaHost:'localhost',
    chromaPort:8000,
    embedModel:"nomic-embed-text:latest",
    chatModel:"artifish/llama3.2-uncensored:latest"
};

// app data and config
let appDataDir=os.homedir()+'/.dora';
let configFile=appDataDir+'/config.json';
if(!fs.existsSync(appDataDir)) fs.mkdirSync(appDataDir);
//
if(fs.existsSync(configFile)) {
    config=JSON.parse(fs.readFileSync(configFile));
}
else fs.writeFileSync(configFile,JSON.stringify(config));

const ollama=new Ollama({host:'http://'+config.ollamaHost+':'+config.ollamaPort});
const chroma=new ChromaClient({path:'http://'+config.chromaHost+':'+config.chromaPort,allow_reset:true});
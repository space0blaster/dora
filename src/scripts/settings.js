class Settings {
    static async settings() {
        E.get('targetDirectory').value=config.targetDirectory;
        E.get('ollamaHost').value=config.ollamaHost;
        E.get('ollamaPort').value=config.ollamaPort;
        E.get('chromaHost').value=config.chromaHost;
        E.get('chromaPort').value=config.chromaPort;
        //
        let selEmbed=E.get('embedModel');
        let selChat=E.get('chatModel');
        ollama.list().then(async list=>{
            list.models.forEach((model) => {
                let oEmbed=E.option(selEmbed,model.name,model.name);
                if(oEmbed.value===config.embedModel) oEmbed.selected=true;
                let oChat=E.option(selChat,model.name,model.name);
                if(oChat.value===config.chatModel) oChat.selected=true;
            });
        });
        //
        //
        E.get('settingsButton').onclick=()=>{
            config.targetDirectory=E.get('targetDirectory').value;
            config.ollamaHost=E.get('ollamaHost').value;
            config.ollamaPort=E.get('ollamaPort').value;
            config.chromaHost=E.get('chromaHost').value;
            config.chromaPort=E.get('chromaPort').value;
            config.embedModel=E.get('embedModel').value;
            config.chatModel=E.get('chatModel').value;
            fs.writeFile(configFile,JSON.stringify(config),(err,data)=>{
                ipcRenderer.send('close-settings',{});
            });
        };
        //
    };
}

Settings.settings();
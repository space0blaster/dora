class DoraSettings {
    constructor() {}
    async settings() {
        E.get('targetDirectory').value=config.targetDirectory;
        E.get('ollamaHost').value=config.ollamaHost;
        E.get('ollamaPort').value=config.ollamaPort;
        E.get('chromaHost').value=config.chromaHost;
        E.get('chromaPort').value=config.chromaPort;
        //
        config.ignored.forEach((ignored,i)=>{
            this.tag(ignored,i);
            if(i===config.ignored.length-1) {
                let tag=E.input(E.get('settingsTagBox'),'text','settingsTagItem settingsTagItemNew','','New Item');
                tag.onkeydown=(e)=>{
                    if(e.keyCode===13) {
                        e.preventDefault();
                        config.ignored.push(tag.innerText);
                        this.tag(tag.value,config.ignored.length-1);
                        tag.value='';
                    }
                };
            }
        });
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
    tag(ignored,i) {
        let tag=E.div(E.get('settingsTagBoxItems'),'settingsTagItem','');
        let t=E.div(tag,'settingsTagItemText','');
        t.innerText=ignored;
        let x=E.div(tag,'','');
        x.innerHTML='<i class="fa-solid fa-xmark"></i>';
        x.onclick=()=>{
            E.get('settingsTagBoxItems').removeChild(tag);
            config.ignored.splice(i,1);
        };
    }
}

let settings=new DoraSettings();
settings.settings();
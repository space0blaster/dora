class DoraChat {
    constructor() {
        this.path=appDataDir+'/chat.json';
        this.systemPrompt="Your name is Dora, a local file search assistant. Respond in JSON format with results in an array called 'files' and your accompanying text response in a key called 'text'. Be brief.";
    }
    async startModel() {
        ollama.ps().then(async running=>{
            if(running.models.findIndex(x=>x.name===config.chatModel)===-1) {
                await ollama.create({model:config.chatModel,from:config.chatModel,system:this.systemPrompt});
                console.log('start new model');
            }
            else {
                await ollama.show({model:config.chatModel}).then(async model=>{
                    if(model.system!==this.systemPrompt) {
                        await ollama.create({model:config.chatModel,from:config.chatModel,system:this.systemPrompt});
                        console.log('running model system prompt does not match, starting a new one');
                    }
                    else console.log('no need to start model, already running');
                });
            }
        });
    };
    history(chatHistory,chatTable) {
        fs.readFile(this.path, 'utf-8', (err, data) => {
            if(err){
                alert("An error reading history :" + err.message);
                return;
            }
            chatHistory=JSON.parse(data);
            for(let i=0;i<chatHistory.length;i++) {
                let tr=E.tableR(chatTable);
                if(chatHistory[i].role==='user' && !chatHistory[i].noDisplay) {
                    let q=E.div(E.tableC(tr,''),'inputText','');
                    q.innerHTML=chatHistory[i].content;
                    q.scrollIntoView();
                }
                else if(chatHistory[i].role==='assistant') {
                    let r=E.div(E.tableC(tr,''),'responseBlock','');
                    let structuredReply=chatHistory[i].content;
                    r.innerHTML='<div class="outputText">'+structuredReply.text+'</div>';
                    for(let i=0;i<structuredReply.files.length;i++) {
                        let f=E.div(r,'outputFileItem','');
                        f.innerHTML='<i class="fa-solid fa-file"></i> '+structuredReply.files[i][Object.keys(structuredReply.files[i])[0]]+'<br/>';
                        f.onclick=()=>{
                            shell.openPath(structuredReply.files[i][Object.keys(structuredReply.files[i])[1]]);
                        };
                    }
                    r.scrollIntoView();
                }
            }
            //
        });
    };
    async query(chatHistory,prompt,promptEmbeddings,r) {
        const collection=await chroma.getCollection({name:md5(config.targetDirectory)});
        let nResults=10;
        if(await collection.count()<10) nResults=await collection.count();
        const queryData=await collection.query({
            queryEmbeddings:promptEmbeddings.embeddings,
            nResults:nResults
        });
        ollama.chat({model:config.chatModel,messages:[{role:"user",content:"Using this data: " + queryData['documents'][0] + ". Respond to this prompt: " + prompt}]}).then(reply=>{
            console.log(reply.message.content);
            try {
                let structuredReply=JSON.parse(reply.message.content);
                r.innerHTML='';
                r.innerHTML='<div class="outputText">'+structuredReply.text+'</div>';
                for(let i=0;i<structuredReply.files.length;i++) {
                    let f=E.div(r,'outputFileItem','');
                    f.innerHTML='<i class="fa-solid fa-file"></i> '+structuredReply.files[i][Object.keys(structuredReply.files[i])[0]]+'<br/>';
                    f.onclick=()=>{
                        shell.openPath(structuredReply.files[i][Object.keys(structuredReply.files[i])[1]]);
                    };
                }
                chatHistory.push({role:'assistant',content:structuredReply})
                r.scrollIntoView();
                fs.writeFile(this.path,JSON.stringify(chatHistory), (err) => {
                    if(err) alert('Error saving session');
                });
            }
            catch(e) {
                r.innerHTML='<div class="outputText"><span class="outputNoteText">COULD NOT PARSE. Note: chat model could not follow stuctured output in this instance, so here is the raw output instead:</span><br/><br/>'+reply.message.content+'</div>';
            }
        });

        //
    };
    chat() {
        let chatHistory=[];
        E.get('response').innerHTML='';
        let chatTable=E.table(E.get('response'),'','chatTable','center','100%');
        //
        if(!fs.existsSync(this.path)){
            fs.writeFile(this.path+'/chat.json','[]',(err)=>{
                if(err) alert('Could not create file'+err);
            });
        }
        //
        this.history(chatHistory,chatTable);

        let input=document.getElementById('input');
        input.onkeydown=(e)=>{
            if(e.keyCode===13) {
                let q=E.div(E.tableC(E.tableR(chatTable),''),'inputText','');
                q.innerHTML=input.value;
                q.scrollIntoView();
                chatHistory.push({role:'user',content:input.value});
                let inputVal=input.value;
                input.value='';
                let r=E.div(E.tableC(E.tableR(chatTable),''),'responseBlock','');
                E.img(r,'responseLoad','','images/loading.gif').scrollIntoView();
                async function embedPrompt(){
                    return await ollama.embed({model:config.embedModel,input:inputVal});
                }
                embedPrompt().then(promptEmbeddings=>{
                    this.query(chatHistory,inputVal,promptEmbeddings,r);
                    fs.writeFile(this.path, JSON.stringify(chatHistory),(err)=>{
                        if(err) alert('Error saving session');
                    });
                });
            }
        };
        //
        let clear=document.getElementById('clear');
        clear.onclick=()=>{
            fs.writeFile(this.path,'[]',(err)=>{
                if(err) alert('Could not create file'+err);
                this.chat();
            });
        };
    };
}
//
const chat=new DoraChat();
chat.startModel().then(()=>{
    chat.chat();
});

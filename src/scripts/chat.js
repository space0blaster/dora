async function startModel() {
    ollama.ps().then(async running=>{
        if(running.models.findIndex(x=>x.name===config.chatModel)===-1) {
            let systemPrompt="Your name is Dora, You are a local search assistant with access to all local files on this machine. Respond in JSON with results in an array called 'files' and your accompanying text response in a key called 'text'.";
            await ollama.create({model:config.chatModel,from:config.chatModel,system:systemPrompt});
            console.log('start new model');
        }
        else console.log('no need to start model, already running');
    });
}
function chat() {
    let chatHistory=[];
    E.get('response').innerHTML='';
    let chatTable=E.table(E.get('response'),'','chatTable','center','100%');
    let path=appDataDir+'/chat.json';
    if(!fs.existsSync(path)){
        fs.writeFile(path,'[]',(err)=>{
            if(err) alert('Could not create file'+err);
        });
    }
    fs.readFile(path, 'utf-8', (err, data) => {
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
        //
        async function a(prompt,promptEmbeddings,r) {
            let fullReply='';
            //
            const collection=await chroma.getCollection({name:md5(config.targetDirectory)});
            let nResults=10;
            if(await collection.count()<10) nResults=await collection.count();
            const queryData=await collection.query({
                queryEmbeddings:promptEmbeddings.embeddings,
                nResults:nResults
            });
            ollama.chat({model:config.chatModel,messages:[{role:"user",content:"Using this data: " + queryData['documents'][0] + ". Respond to this prompt: " + prompt}]}).then(reply=>{
                try {
                    let structuredReply=JSON.parse(reply.message.content)
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
                    fs.writeFile(path,JSON.stringify(chatHistory), (err) => {
                        if(err) alert('Error saving session');
                    });
                }
                catch(e) {
                    r.innerHTML='<div class="outputText"><span class="outputNoteText">COULD NOT PARSE. Note: chat model could not follow stuctured output in this instance, so here is the raw output instead:</span><br/><br/>'+reply.message.content+'</div>';
                }
            });

            //
        }

        //
        let input=document.getElementById('input');
        input.onkeydown=(e)=>{
            if(e.keyCode===13) {
                //e.preventDefault();
                let q=E.div(E.tableC(E.tableR(chatTable),''),'inputText','');
                q.innerHTML=input.value;
                q.scrollIntoView();
                // actual message input
                chatHistory.push({role:'user',content:input.value});
                let inputVal=input.value;
                input.value='';
                let r=E.div(E.tableC(E.tableR(chatTable),''),'responseBlock','');
                E.img(r,'responseLoad','','images/loading.gif').scrollIntoView();
                async function embedPrompt(){
                    return await ollama.embed({model:config.embedModel,input:inputVal})
                }
                embedPrompt().then(promptEmbeddings=>{
                    a(inputVal,promptEmbeddings,r);
                    //
                    fs.writeFile(path, JSON.stringify(chatHistory),(err)=>{
                        if(err) alert('Error saving session');
                    });
                });
            }
        };
        //
    });

    //

    let clear=document.getElementById('clear');
    clear.onclick=()=>{
        let path=appDataDir+'/chat.json';
        fs.writeFile(path,'[]',(err)=>{
            if(err) alert('Could not create file'+err);
            chat();
        });
    };
}
//
startModel().then(()=>{
    chat();
});

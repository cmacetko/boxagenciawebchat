const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld(
    "CtrlApp", {
        Notification_Show: (ObjDados) => {
        
            ipcRenderer.send('Notification_Show', ObjDados);

        },
        Badge_Update: (Valor) => {
        
            if( process.platform == "win32" ){

                ipcRenderer.sendSync('update-badge', Valor);

            }else if( process.platform == "darwin" ){

                ipcRenderer.send('Badge_Set', Valor);

            }

        },
        Badge_Null: (Valor) => {
        
            if( process.platform == "win32" ){

                ipcRenderer.sendSync('update-badge', null);

            }else if( process.platform == "darwin" ){

                ipcRenderer.send('Badge_Set', 0);

            }

        },
        UserToken: (Valor) => {
        
            ipcRenderer.send('UserToken', Valor);

        },
        receive: (channel, listener) => {
        
            ipcRenderer.on(channel, (event, ...args) => listener(...args));

        }
    }
);
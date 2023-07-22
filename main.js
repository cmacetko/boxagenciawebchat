import { app, dialog, BrowserWindow, Menu, ipcMain, Tray, globalShortcut, shell, Notification, autoUpdater } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import url from 'url';

const log = require('electron-log');
const isDev = require('electron-is-dev');

/*
%USERPROFILE%\AppData\Roaming\{app name}\logs\{process type}.log
*/

/*
var squirrelStartup = require('electron-squirrel-startup');

if( squirrelStartup )
{

    app.quit();

}
*/

var CfgGlobal = {
AppNome: "Chat - Box Agência Web",
Icone: path.join(__dirname, "assets", "icon.png"),
Link: "https://projetos.boxagenciaweb.com.br/Sistema/Login/LoginApp.php?SubPag=AppChat&UrlDir=%2Fchat%2F",
CheckForUpdatesInterval: 1 * 60 * 60 * 1000
};

var CfgLocal = {
UserToken: ""
};

CfgLocal_Get();

var win = null;
var tray;

var CtrlNotification;

var Badge = require('electron-windows-badge');
var instanceLock = app.requestSingleInstanceLock();

if( !instanceLock )
{

    try {

        app.quit();

    } catch(err) {
     
        log.log("instanceLock - err", err);

    }

}else{

    app.on('second-instance', (event, commandLine, workingDirectory) => {
        
        try {

            var mainWindow = BrowserWindow.getAllWindows()[0];
            
            if( mainWindow )
            {

                if( mainWindow.isMinimized() )
                {

                    mainWindow.restore();  

                }else{

                    mainWindow.focus();

                }
                
            }

        } catch(err) {
        
            log.log("second-instance - err", err);

        }

    });

    app.on('ready', () => {

        getWindow();
        setupUpdate();
        
    });

}

app.on('will-quit', () => {

    try {

        globalShortcut.unregisterAll();

    } catch(err) {

        log.log("will-quit - err", err);

    }

});

app.on('window-all-closed', () => {

    try {

        app.quit();

    } catch(err) {

        log.log("window-all-closed - err", err);

    }

});

function getWindow()
{

    if( win !== null ) 
    {

        return win;

    }   

    try {

        win = new BrowserWindow({
        title: CfgGlobal.AppNome + " (" + app.getVersion() + ")",
        width: 1140,
        height: 680,
        show: true,
        autoHideMenuBar: true,
        maximizable: true,
        //kiosk: true,
        webSecurity: false,
        icon: CfgGlobal.Icone,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true, 
            enableRemoteModule: false,
            preload: path.join(__dirname, "preload.js")
        }
        });

        win.on('close', (e) => {
        
        });

        win.on('closed', () => {
        
            win = null;

            tray.destroy();

        });

        win.on('focus', () => {
            
            win.webContents.send('WinFocus', { "Is": "S" });

        });
        
        win.on('blur', () => {
            
            win.webContents.send('WinFocus', { "Is": "N" });

        });

        win.webContents.once('did-finish-load', function(){
            
            win.show();

            setupIpcMain();
            setupTray();
            
        });

        win.webContents.on('new-window', function(event, url) {
            
            event.preventDefault();
            
            shell.openExternal(url);

        });

        win.webContents.on('page-title-updated', (event) => {

            event.preventDefault();
            
            win.setTitle(CfgGlobal.AppNome + " (" + app.getVersion() + ")");

        });
        
        win.loadURL(CfgGlobal.Link + "&UserToken=" + CfgLocal.UserToken);
        
        if( process.platform == "win32" )
        {

            new Badge(win, {
            font: '12px arial',
            color: '#C90000'
            });

        }

    } catch(err) {

        log.log("getWindow - err", err);

    }

    return win;

}

function setupTray() {

    try {

        const template = [
        {
            label: 'Abrir',
            click: () => {

                win.show();

            }
        },
        {
            label: "Deslogar",
            click: () => {

                CfgGlobal.UserToken = "";

                CfgLocal_Set();

                win.loadURL(CfgGlobal.Link + "&UserToken=" + CfgGlobal.UserToken);

            }
        },
        {
            label: "Debug",
            click: () => {

                win.show();
                win.webContents.toggleDevTools();    
                win.setSize(1200, 800);
                
            }
        },
        {
            label: "Refresh",
            click: () => {

                win.webContents.reloadIgnoringCache()

            }
        },
        {
            label: "Fechar",
            click: () => {

                app.quit();

            }
        }
        ];

        if( tray ) 
        {

            tray.destroy();

        }

        tray = new Tray(path.join(__dirname, "assets", "icon.png"));
        tray.setContextMenu(Menu.buildFromTemplate(template));
        tray.setToolTip(CfgGlobal.AppNome);
        tray.setTitle(CfgGlobal.AppNome);
        tray.on('double-click', function(e){

            if( win.isVisible() ) 
            {

                win.hide();

            } else {

                win.show();
                
            }

        });

    }catch (err){

        log.log("setupTray - err", err);
        
    }
    
}

function setupIpcMain()
{

    try {
        
        ipcMain.on('Notification_Show', (_event, ObjDados) => {

            if( CtrlNotification )
            {

                CtrlNotification.close();

            }

            CtrlNotification = new Notification({
            title: ObjDados.Titulo,
            body: ObjDados.Texto,
            icon: CfgGlobal.Icone,
            requireInteraction: true,
            });

            CtrlNotification.show();
            
            CtrlNotification.on('click', (event, arg)=>{

                if( ObjDados.Link != "" )
                {
        
                    if( win.isMinimized() )
                    {

                        win.restore();  

                    }

                    win.setAlwaysOnTop(true);
                    app.focus();
                    win.setAlwaysOnTop(false);

                    win.webContents.send('Notification_Show_Click', { ObjDados });

                }

            });

        });

        ipcMain.on('Badge_Set', (_event, Valor) => {

            app.setBadgeCount(Valor);

        });

        ipcMain.on('UserToken', (_event, Valor) => {

            CfgLocal.UserToken = Valor;

            CfgLocal_Set();

        });

    }catch (err){

        log.log("setupIpcMain - err", err);
        
    }

}

function setupUpdate()
{

    const FeedUrl = 'https://update.electronjs.org/cmacetko/boxagenciawebchat/' + process.platform + '-' + process.arch + '/' + app.getVersion();

    if( isDev == true )
    {

        return false;

    }

    try {
        
        log.log("setupUpdate");
        log.log("FeedUrl", FeedUrl); 
        
        autoUpdater.setFeedURL(FeedUrl)
        
        autoUpdater.on('error', err => {

            log.log("setupUpdate - error", err);

        })

        autoUpdater.on('checking-for-update', () => {

            log.log("setupUpdate - checking-for-update");

        })

        autoUpdater.on('update-available', () => {
        
            log.log("setupUpdate - update-available");

        })

        autoUpdater.on('update-not-available', () => {
        
            log.log("setupUpdate - update-not-available");
            
        })

        autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName, releaseDate, updateURL) => {

            log.log("setupUpdate - update-downloaded", [event, releaseNotes, releaseName, releaseDate, updateURL])

            const dialogOpts = {
            type: 'info',
            buttons: ['Reiniciar Agora', 'Reiniciar Depois'],
            title: 'Atualização Automática',
            message: process.platform === 'win32' ? releaseNotes : releaseName,
            detail: 'Uma nova versão do Aplicativo foi Instalada. Reinicie o Aplicativo para iniciar a nova versão'
            };

            dialog.showMessageBox(dialogOpts).then(({ response }) => {

                if(response === 0)
                {

                    autoUpdater.quitAndInstall();

                }

            })
        });

        autoUpdater.checkForUpdates()

        setInterval(() => { 
            
            autoUpdater.checkForUpdates() 
        
        }, CfgGlobal.CheckForUpdatesInterval)

    }catch (err){

        log.log("setupUpdate - err", err);
        
    }

}

function CfgLocal_Get()
{

    const PathCfg = path.join(app.getPath('userData'), "CfgLocal.json");

    try{

        if( fs.existsSync(PathCfg) )
        {

            var NDads1 = fs.readFileSync(PathCfg);
            var NDads2 = NDads1.toString('utf8');
            var NDads3 = JSON.parse(NDads2);

            if( NDads3.hasOwnProperty("UserToken") )
            {

                if( NDads3.UserToken != "" )
                {

                    CfgLocal.UserToken = NDads3.UserToken;

                }

            }

        }

    }catch (err){

        log.log("CfgLocal_Get - err", err);
          
    }

}

function CfgLocal_Set() 
{

    var NPath = path.join(app.getPath('userData'), "CfgLocal.json");

    try {

        fs.writeFileSync(NPath, JSON.stringify(CfgLocal));

    } catch (err) {        
        
        log.log("CfgLocal_Set - err", err);

    }

}
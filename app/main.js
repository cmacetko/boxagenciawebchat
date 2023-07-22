"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
var _electron = require("electron");
var fs = _interopRequireWildcard(require("fs"));
var path = _interopRequireWildcard(require("path"));
var _url = _interopRequireDefault(require("url"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var log = require('electron-log');
var isDev = require('electron-is-dev');

/*
%USERPROFILE%\AppData\Roaming\{app name}\logs\{process type}.log
*/

var squirrelStartup = require('electron-squirrel-startup');
if (squirrelStartup) {
  _electron.app.quit();
}
var CfgGlobal = {
  AppNome: "Chat - Box Agência Web",
  Icone: path.join(__dirname, "assets", "icon.png"),
  Link: "https://projetos.boxagenciaweb.com.br/Sistema/Login/LoginApp.php?SubPag=AppChat&UrlDir=%2Fchat%2F",
  //CheckForUpdatesInterval: 1 * 60 * 60 * 1000
  CheckForUpdatesInterval: 5 * 60 * 1000
};
var CfgLocal = {
  UserToken: ""
};
CfgLocal_Get();
var win = null;
var tray;
var CtrlNotification;
var Badge = require('electron-windows-badge');
var instanceLock = _electron.app.requestSingleInstanceLock();
if (!instanceLock) {
  try {
    _electron.app.quit();
  } catch (err) {
    log.log("instanceLock - err", err);
  }
} else {
  _electron.app.on('second-instance', function (event, commandLine, workingDirectory) {
    try {
      var mainWindow = _electron.BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        } else {
          mainWindow.focus();
        }
      }
    } catch (err) {
      log.log("second-instance - err", err);
    }
  });
  _electron.app.on('ready', function () {
    getWindow();
    setupUpdate();
  });
}
_electron.app.on('will-quit', function () {
  try {
    _electron.globalShortcut.unregisterAll();
  } catch (err) {
    log.log("will-quit - err", err);
  }
});
_electron.app.on('window-all-closed', function () {
  try {
    _electron.app.quit();
  } catch (err) {
    log.log("window-all-closed - err", err);
  }
});
function getWindow() {
  if (win !== null) {
    return win;
  }
  try {
    win = new _electron.BrowserWindow({
      title: CfgGlobal.AppNome + " (" + _electron.app.getVersion() + ")",
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
    win.on('close', function (e) {});
    win.on('closed', function () {
      win = null;
      tray.destroy();
    });
    win.on('focus', function () {
      win.webContents.send('WinFocus', {
        "Is": "S"
      });
    });
    win.on('blur', function () {
      win.webContents.send('WinFocus', {
        "Is": "N"
      });
    });
    win.webContents.once('did-finish-load', function () {
      win.show();
      setupIpcMain();
      setupTray();
    });
    win.webContents.on('new-window', function (event, url) {
      event.preventDefault();
      _electron.shell.openExternal(url);
    });
    win.webContents.on('page-title-updated', function (event) {
      event.preventDefault();
      win.setTitle(CfgGlobal.AppNome + " (" + _electron.app.getVersion() + ")");
    });
    win.loadURL(CfgGlobal.Link + "&UserToken=" + CfgLocal.UserToken);
    if (process.platform == "win32") {
      new Badge(win, {
        font: '12px arial',
        color: '#C90000'
      });
    }
  } catch (err) {
    log.log("getWindow - err", err);
  }
  return win;
}
function setupTray() {
  try {
    var template = [{
      label: 'Abrir',
      click: function click() {
        win.show();
      }
    }, {
      label: "Deslogar",
      click: function click() {
        CfgGlobal.UserToken = "";
        CfgLocal_Set();
        win.loadURL(CfgGlobal.Link + "&UserToken=" + CfgGlobal.UserToken);
      }
    }, {
      label: "Debug",
      click: function click() {
        win.show();
        win.webContents.toggleDevTools();
        win.setSize(1200, 800);
      }
    }, {
      label: "Refresh",
      click: function click() {
        win.webContents.reloadIgnoringCache();
      }
    }, {
      label: "Fechar",
      click: function click() {
        _electron.app.quit();
      }
    }];
    if (tray) {
      tray.destroy();
    }
    tray = new _electron.Tray(path.join(__dirname, "assets", "icon.png"));
    tray.setContextMenu(_electron.Menu.buildFromTemplate(template));
    tray.setToolTip(CfgGlobal.AppNome);
    tray.setTitle(CfgGlobal.AppNome);
    tray.on('double-click', function (e) {
      if (win.isVisible()) {
        win.hide();
      } else {
        win.show();
      }
    });
  } catch (err) {
    log.log("setupTray - err", err);
  }
}
function setupIpcMain() {
  try {
    _electron.ipcMain.on('Notification_Show', function (_event, ObjDados) {
      if (CtrlNotification) {
        CtrlNotification.close();
      }
      CtrlNotification = new _electron.Notification({
        title: ObjDados.Titulo,
        body: ObjDados.Texto,
        icon: CfgGlobal.Icone,
        requireInteraction: true
      });
      CtrlNotification.show();
      CtrlNotification.on('click', function (event, arg) {
        if (ObjDados.Link != "") {
          if (win.isMinimized()) {
            win.restore();
          }
          win.setAlwaysOnTop(true);
          _electron.app.focus();
          win.setAlwaysOnTop(false);
          win.webContents.send('Notification_Show_Click', {
            ObjDados: ObjDados
          });
        }
      });
    });
    _electron.ipcMain.on('Badge_Set', function (_event, Valor) {
      _electron.app.setBadgeCount(Valor);
    });
    _electron.ipcMain.on('UserToken', function (_event, Valor) {
      CfgGlobal.UserToken = Valor;
      CfgLocal_Set();
    });
  } catch (err) {
    log.log("setupIpcMain - err", err);
  }
}
function setupUpdate() {
  if (isDev == true) {
    return false;
  }
  try {
    var feedURL = 'https://update.electronjs.org/cmacetko/boxagenciawebchat/' + process.platform + '-' + process.arch + '/' + _electron.app.getVersion();
    log.log("setupUpdate");
    log.log("feedURL", feedURL);
    _electron.autoUpdater.setFeedURL(feedURL);
    _electron.autoUpdater.on('error', function (err) {
      log.log("setupUpdate - error", err);
    });
    _electron.autoUpdater.on('checking-for-update', function () {
      log.log("setupUpdate - checking-for-update");
    });
    _electron.autoUpdater.on('update-available', function () {
      log.log("setupUpdate - update-available");
    });
    _electron.autoUpdater.on('update-not-available', function () {
      log.log("setupUpdate - update-not-available");
    });
    _electron.autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName, releaseDate, updateURL) {
      log.log("setupUpdate - update-downloaded", [event, releaseNotes, releaseName, releaseDate, updateURL]);
      var dialogOpts = {
        type: 'info',
        buttons: ['Reiniciar Agora', 'Reiniciar Depois'],
        title: 'Atualização Automática',
        message: process.platform === 'win32' ? releaseNotes : releaseName,
        detail: 'Uma nova versão do Aplicativo foi Instalada. Reinicie o Aplicativo para iniciar a nova versão'
      };
      _electron.dialog.showMessageBox(dialogOpts).then(function (_ref) {
        var response = _ref.response;
        if (response === 0) {
          _electron.autoUpdater.quitAndInstall();
        }
      });
    });
    _electron.autoUpdater.checkForUpdates();
    setInterval(function () {
      _electron.autoUpdater.checkForUpdates();
    }, CfgGlobal.CheckForUpdatesInterval);
  } catch (err) {
    log.log("setupUpdate - err", err);
  }
}
function CfgLocal_Get() {
  try {
    var NDads1 = fs.readFileSync(path.join(_electron.app.getPath('userData'), "CfgLocal.json"));
    var NDads2 = NDads1.toString('utf8');
    var NDads3 = JSON.parse(NDads2);
    if (NDads3.hasOwnProperty("UserToken")) {
      if (NDads3.UserToken != "") {
        CfgLocal.UserToken = NDads3.UserToken;
      }
    }
  } catch (err) {
    log.log("CfgLocal_Get - err", err);
  }
}
function CfgLocal_Set() {
  var NPath = path.join(_electron.app.getPath('userData'), "CfgLocal.json");
  try {
    fs.writeFileSync(NPath, JSON.stringify(CfgLocal));
  } catch (err) {
    log.log("CfgLocal_Set - err", err);
  }
}
"use strict";

var _require = require("electron"),
  contextBridge = _require.contextBridge,
  ipcRenderer = _require.ipcRenderer;
contextBridge.exposeInMainWorld("CtrlApp", {
  Notification_Show: function Notification_Show(ObjDados) {
    ipcRenderer.send('Notification_Show', ObjDados);
  },
  Badge_Update: function Badge_Update(Valor) {
    if (process.platform == "win32") {
      ipcRenderer.sendSync('update-badge', Valor);
    } else if (process.platform == "darwin") {
      ipcRenderer.send('Badge_Set', Valor);
    }
  },
  Badge_Null: function Badge_Null(Valor) {
    if (process.platform == "win32") {
      ipcRenderer.sendSync('update-badge', null);
    } else if (process.platform == "darwin") {
      ipcRenderer.send('Badge_Set', 0);
    }
  },
  UserToken: function UserToken(Valor) {
    ipcRenderer.send('UserToken', Valor);
  },
  receive: function receive(channel, listener) {
    ipcRenderer.on(channel, function (event) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      return listener.apply(void 0, args);
    });
  }
});
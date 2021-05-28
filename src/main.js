const electron = require('electron');
const {ipcMain} = require('electron');
var {PythonShell} = require('python-shell');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');
const fs = require('fs');

let pyshell = new PythonShell('./src/pcl_py.py');
// メインウィンドウ
let mainWindow;

// .npy listの取得

function createWindow() {
  // メインウィンドウを作成します
    mainWindow = new BrowserWindow({width: 1200,
                                    height: 800,
                                    webPreferences: {
                                        nodeIntegration: true,
                                        contextIsolation: false
                                    }});

  // メインウィンドウに表示するURLを指定します
  // （今回はmain.jsと同じディレクトリのindex.html）
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // デベロッパーツールの起動
  mainWindow.webContents.openDevTools();

  // メインウィンドウが閉じられたときの処理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

//  初期化が完了した時の処理
app.on('ready', createWindow);

// 全てのウィンドウが閉じたときの処理
app.on('window-all-closed', () => {
  // macOSのとき以外はアプリを終了させます
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
// アプリケーションがアクティブになった時の処理(Macだと、Dockがクリックされた時）
app.on('activate', () => {
  /// メインウィンドウが消えている場合は再度メインウィンドウを作成する
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('npy_list_num', (event, arg) => {
    console.log("npy_list_num is", arg);
});

ipcMain.on('pcl_process', (event, arg) => {
    var JSONFILEPATH = "./src/pcl_json.json";
    var json = {
        npy_name:arg
    };

    var jsondat = JSON.stringify(json);

    if (fs.existsSync(JSONFILEPATH)) fs.unlinkSync(JSONFILEPATH);

    fs.writeFileSync(JSONFILEPATH, jsondat);
    PythonShell.run('./src/pcl_py.py', null, function(err, result){
        //if (err) throw err;

        console.log(result);
    });
});

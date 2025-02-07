const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if(require('electron-squirrel-startup')) app.quit();

let settingsWindowId;
let mainWindowId;
const createSettingsWindow=()=>{
  const settingsWindow = new BrowserWindow({
    width: 425,
    height: 500,
    titleBarStyle:'hidden',
    trafficLightPosition:{x:10,y:10},
    webPreferences: {
      //preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
    transparent: true,
  });
  settingsWindow.loadFile(path.join(__dirname, 'settings.html'));
  settingsWindowId=settingsWindow.id;
};
const createMainWindow = () => {
  const mainWindow=new BrowserWindow({
    width: 900,
    height: 550,
    titleBarStyle:'hidden',
    trafficLightPosition:{x:10,y:10},
    webPreferences: {
      //preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
    transparent: true,
  });
  mainWindowId=mainWindow.id;

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

};

ipcMain.on('open-settings', (event, arg) => {
  createSettingsWindow();
});
ipcMain.on('close-settings', (event, arg) => {
  if(mainWindowId) BrowserWindow.fromId(mainWindowId).close();
  createMainWindow();
  //
  if(BrowserWindow.fromId(settingsWindowId)) {
    BrowserWindow.fromId(settingsWindowId).close();
    settingsWindowId=false;
  }
});


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  //createWindow();
  createSettingsWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if(BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

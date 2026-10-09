const { app, BrowserWindow, Tray, Menu, globalShortcut, shell, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

const YT_MUSIC_URL = 'https://music.youtube.com';

// O login do Google recusa navegadores "embutidos"; usar um user agent do Chrome comum evita isso.
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const statePath = path.join(app.getPath('userData'), 'window-state.json');

let mainWindow = null;
let tray = null;
let isQuitting = false;

function loadWindowState() {
  try {
    return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch {
    return { width: 1200, height: 800 };
  }
}

function saveWindowState() {
  if (!mainWindow || mainWindow.isMinimized()) return;
  try {
    fs.writeFileSync(
      statePath,
      JSON.stringify({ ...mainWindow.getBounds(), maximized: mainWindow.isMaximized() })
    );
  } catch {
    // Não salvar a posição da janela não é motivo para travar o app.
  }
}

// Clica nos botões do player do YouTube Music pela página.
function playerAction(action) {
  if (!mainWindow) return;
  const selectors = {
    playPause: '#play-pause-button',
    next: '.next-button',
    previous: '.previous-button',
  };
  mainWindow.webContents
    .executeJavaScript(`document.querySelector('${selectors[action]}')?.click()`)
    .catch(() => {});
}

function showWindow() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function createWindow() {
  const state = loadWindowState();

  mainWindow = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    minWidth: 400,
    minHeight: 300,
    title: 'YT Music Thi',
    icon: path.join(__dirname, 'icon.png'),
    backgroundColor: '#030303',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (state.maximized) mainWindow.maximize();

  mainWindow.webContents.setUserAgent(USER_AGENT);
  mainWindow.loadURL(YT_MUSIC_URL);

  // Links para fora do YouTube Music / login do Google abrem no navegador padrão.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const host = new URL(url).hostname;
    if (host.endsWith('youtube.com') || host.endsWith('google.com')) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Mostra o nome da música no título da janela (e na barra de tarefas).
  mainWindow.on('page-title-updated', (event, title) => {
    event.preventDefault();
    mainWindow.setTitle(title);
    if (tray) tray.setToolTip(title);
  });

  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);

  // Fechar a janela só esconde: a música continua tocando na bandeja.
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'icon.png');
  const icon = fs.existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('YT Music Thi');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Mostrar', click: showWindow },
      { type: 'separator' },
      { label: 'Tocar / Pausar', click: () => playerAction('playPause') },
      { label: 'Próxima', click: () => playerAction('next') },
      { label: 'Anterior', click: () => playerAction('previous') },
      { type: 'separator' },
      {
        label: 'Sair',
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ])
  );
  tray.on('click', showWindow);
}

function registerShortcuts() {
  // As teclas de mídia do teclado já funcionam nativamente; estes atalhos são extras.
  globalShortcut.register('CommandOrControl+Shift+Space', () => playerAction('playPause'));
  globalShortcut.register('CommandOrControl+Shift+Right', () => playerAction('next'));
  globalShortcut.register('CommandOrControl+Shift+Left', () => playerAction('previous'));
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', showWindow);

  app.whenReady().then(() => {
    createWindow();
    createTray();
    registerShortcuts();
  });

  app.on('before-quit', () => {
    isQuitting = true;
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}

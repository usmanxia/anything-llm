import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let serverProcess;
let collectorProcess;

function startBackend() {
  const cwd = path.join(__dirname, '..');
  const env = {
    ...process.env,
    NODE_ENV: process.env.ANYTHING_LLM_DEV ? 'development' : 'production',
  };

  serverProcess = spawn(process.execPath, [path.join('server', 'index.js')], {
    cwd,
    env,
    stdio: 'inherit',
  });

  collectorProcess = spawn(process.execPath, [path.join('collector', 'index.js')], {
    cwd,
    env,
    stdio: 'inherit',
  });
}

function stopBackend() {
  if (serverProcess) serverProcess.kill();
  if (collectorProcess) collectorProcess.kill();
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const serverPort = process.env.SERVER_PORT || 3001;

  // In development, point to local dev server
  if (process.env.ANYTHING_LLM_DEV) {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadURL(`http://localhost:${serverPort}`);
  }
}

app.whenReady().then(() => {
  if (!process.env.ANYTHING_LLM_DEV) {
    startBackend();
  }
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopBackend();
    app.quit();
  }
});

app.on('quit', () => {
  stopBackend();
});

import { app, BrowserWindow, dialog, Menu, shell, ipcMain } from "electron"
import path from "path"
import { fileURLToPath } from "url"

// electron-updater es CommonJS, lo importamos como default y extraemos autoUpdater
import updaterPkg from "electron-updater"
const { autoUpdater } = updaterPkg

import log from "electron-log"

// =============================================================================
// 1. CONFIGURACIÓN INICIAL
// =============================================================================

// Configuración avanzada de logging
log.transports.file.resolvePath = () =>
  path.join(app.getPath("userData"), "logs", "main.log")
log.transports.file.level = "debug"
log.transports.console.level = "info"
autoUpdater.logger = log

// Configuración del auto-updater
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

// =============================================================================
// 2. VARIABLES GLOBALES
// =============================================================================

let mainWindow: BrowserWindow | undefined
let updateInfo: any = null
let isUpdateDownloaded = false
let hasAskedForDownload = false
let hasAskedForInstall = false

// Rutas dinámicas
const __dirname = fileURLToPath(new URL(".", import.meta.url))
const preloadFolder =
  process.env.QUASAR_ELECTRON_PRELOAD_FOLDER ?? "dist/electron"
const preloadExtension = process.env.QUASAR_ELECTRON_PRELOAD_EXTENSION ?? ".js"
const preloadPath = path.resolve(
  __dirname,
  path.join(preloadFolder, `electron-preload${preloadExtension}`),
)
const appUrl = process.env.APP_URL

// =============================================================================
// 3. DIÁLOGOS DE ACTUALIZACIÓN
// =============================================================================

async function showUpdateAvailableDialog(info: any) {
  if (!mainWindow) return -1

  const result = await dialog.showMessageBox(mainWindow, {
    type: "question",
    title: "🚀 Nueva actualización disponible",
    message:
      `Se encontró una nueva versión ${info?.version || "disponible"}.\n\n` +
      `Versión actual: ${app.getVersion()}\n` +
      `Nueva versión: ${info?.version || "N/A"}\n\n` +
      `¿Deseas descargar la actualización ahora?`,
    detail:
      "La descarga se realizará en segundo plano y no interrumpirá tu trabajo.",
    buttons: ["Descargar ahora", "Más tarde"],
    defaultId: 0,
    cancelId: 1,
    icon: path.resolve(__dirname, "icons/icon.png"),
  })

  return result.response
}

async function showUpdateReadyDialog(info: any) {
  if (!mainWindow) return -1

  const result = await dialog.showMessageBox(mainWindow, {
    type: "question",
    title: "✅ Actualización lista para instalar",
    message:
      `La actualización se ha descargado correctamente.\n\n` +
      `¿Deseas reiniciar la aplicación para aplicar los cambios?`,
    detail: "Los cambios se aplicarán después de reiniciar la aplicación.",
    buttons: ["Reiniciar ahora", "Más tarde"],
    defaultId: 0,
    cancelId: 1,
    icon: path.resolve(__dirname, "icons/icon.png"),
  })

  return result.response
}

// =============================================================================
// 4. VENTANA PRINCIPAL
// =============================================================================

const iconPath = path.join(__dirname, "build", "icon.png")

app.setAppUserModelId("com.TallerPRO")

async function createWindow() {
  log.info("📦 Creando ventana principal")

  mainWindow = new BrowserWindow({
    icon: iconPath,
    width: 1100,
    height: 730,
    resizable: false,
    autoHideMenuBar: true,
    useContentSize: false,
    titleBarStyle: "default",
    show: false,
    webPreferences: {
      contextIsolation: true,
      preload: preloadPath,
      nodeIntegration: false,
    },
  })

  // Configurar menú
  mainWindow.setMenuBarVisibility(false)
  mainWindow.setMenu(null)

  // Mostrar ventana cuando esté lista
  mainWindow.once("ready-to-show", () => {
    log.info("🖼️ Ventana lista para mostrar")
    mainWindow?.show()

    // Habilitar updater para testing en desarrollo
    if (!app.isPackaged && process.env.DEBUGGING === "true") {
      ;(app as any).isPackaged = true
    }

    // Iniciar verificación de actualizaciones después de 3 segundos
    setTimeout(() => {
      log.info("🔍 Iniciando verificación de actualizaciones...")
      autoUpdater.checkForUpdatesAndNotify()
    }, 3000)
  })

  // Cargar contenido de la aplicación
  try {
    if (appUrl) {
      await mainWindow.loadURL(appUrl)
      log.info("🌐 Cargando dev server:", appUrl)
    } else {
      const filePath = path.resolve(__dirname, "index.html")
      await mainWindow.loadFile(filePath)
      log.info("🗄️ Cargando archivo empaquetado:", filePath)
    }
  } catch (err) {
    log.error("❌ Error al cargar contenido:", err)
    dialog.showErrorBox("Error al cargar la app", String(err))
  }

  // Configurar DevTools
  if (process.env.DEBUGGING === "true") {
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.webContents.on("devtools-opened", () => {
      mainWindow?.webContents.closeDevTools()
    })
  }

  // Manejar enlaces externos
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: "deny" }
  })

  // Limpiar referencia al cerrar
  mainWindow.on("closed", () => {
    mainWindow = undefined
    log.info("❌ Ventana principal cerrada")
  })
}

// =============================================================================
// 5. EVENTOS DEL AUTO-UPDATER
// =============================================================================

autoUpdater.on("checking-for-update", () => {
  log.info("🔍 Verificando actualizaciones...")
})

autoUpdater.on("update-available", async (info) => {
  log.info("✅ Actualización disponible:", info)
  updateInfo = info

  if (!hasAskedForDownload) {
    hasAskedForDownload = true
    const choice = await showUpdateAvailableDialog(info)

    if (choice === 0) {
      // Descargar ahora
      log.info("📥 Iniciando descarga de actualización")
      autoUpdater.downloadUpdate()
    } else {
      // Más tarde
      log.info("⏰ Actualización pospuesta")
      // Volver a preguntar en 1 hora
      setTimeout(
        () => {
          if (!isUpdateDownloaded) {
            hasAskedForDownload = false // Permitir preguntar de nuevo
            autoUpdater.checkForUpdatesAndNotify()
          }
        },
        60 * 60 * 1000,
      )
    }
  }
})

autoUpdater.on("update-not-available", (info) => {
  log.info("ℹ️ No hay actualizaciones disponibles")
})

autoUpdater.on("error", (err) => {
  log.error("❌ Error en auto-updater:", err)
  if (mainWindow) {
    dialog.showErrorBox(
      "Error de actualización",
      "No se pudo verificar las actualizaciones.\n\n" +
        "Detalles: " +
        (err.message || err.toString()),
    )
  }
})

autoUpdater.on("download-progress", (progressInfo) => {
  const percent = Math.round(progressInfo.percent)
  log.info(`📥 Progreso de descarga: ${percent}%`)

  if (mainWindow) {
    mainWindow.setTitle(`tallerPRO - Descargando ${percent}%`)
  }
})

autoUpdater.on("update-downloaded", async (info) => {
  log.info("📥 Actualización descargada:", info)
  isUpdateDownloaded = true

  // Restaurar título de la ventana
  if (mainWindow) {
    mainWindow.setTitle("tallerPRO")
  }

  if (!hasAskedForInstall) {
    hasAskedForInstall = true
    const choice = await showUpdateReadyDialog(info)

    if (choice === 0) {
      // Reiniciar ahora
      log.info("🔄 Reiniciando para aplicar actualización")
      autoUpdater.quitAndInstall(true, true)
    } else {
      // Más tarde
      log.info("🔄 Actualización programada para el próximo reinicio")
      autoUpdater.autoInstallOnAppQuit = true
    }
  } else {
    log.info("🚫 Ya se mostró el diálogo de instalación para esta descarga")
  }
})

// =============================================================================
// 6. INICIALIZACIÓN DE LA APLICACIÓN
// =============================================================================

app.on("ready", createWindow)

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

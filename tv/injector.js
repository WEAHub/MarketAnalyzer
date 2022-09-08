require('nightmare/lib/preload');
window.nightmare = {};
nightmare.ipc = require('electron').ipcRenderer;

document.addEventListener("readystatechange", () => {
  if (document.readyState === "interactive") {
    let initData = window.initData || {};
    initData.readOnly = false;
    initData.defStyle = initData.defStyle ? parseInt(initData.defStyle) : null;
    initData.addonId = "";
    initData.theme = "dark";
    initData.content = {INJECTION};
    window.initData = initData;
  }
});


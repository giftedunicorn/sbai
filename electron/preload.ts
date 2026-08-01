import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('companion', {
  platform: process.platform,
});

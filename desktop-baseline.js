/* Explicit, recoverable desktop-baseline loading. Never auto-replace a saved/cloud drawing. */
(() => {
  'use strict';
  const revision='desktop-confirmed-20261023';
  const clone=value=>JSON.parse(JSON.stringify(value));
  function prepare(current,desktop,storage,stamp=new Date().toISOString()) {
    if(desktop?.baseline_revision!==revision || !Array.isArray(desktop.equipment) || !Array.isArray(desktop.walls))throw new Error('Invalid desktop baseline');
    const snapshot=JSON.stringify(current),key='chin_chun_before_desktop_'+stamp;
    // Fail closed on full/disabled storage or a reused key; never lose an old backup.
    if(storage.getItem(key)!==null)throw new Error('Backup already exists');
    storage.setItem(key,snapshot);
    if(storage.getItem(key)!==snapshot)throw new Error('Backup verification failed');
    return {layout:clone(desktop),backupKey:key};
  }
  window.ChinChunDesktop={revision,prepare,isConfirmed:layout=>layout?.baseline_revision===revision};
})();

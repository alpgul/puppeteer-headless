console.log('Service OriginalWorker',Date.now());
const channel = new BroadcastChannel('patch');

channel.onmessage = (event) => {
  if (event.data && event.data.type === 'patch') {
    importScripts(event.data.url);
  }
};

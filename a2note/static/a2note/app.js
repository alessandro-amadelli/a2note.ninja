registerSW();

async function registerSW() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch(err) {
      console.log('SW registration failed: ', err);
    }
  }
}

export function createUrlWithPatchedWorker(blobUrl: string): string {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', blobUrl, false);
    xhr.send();
    const code = xhr.responseText;
    const newCode = `(()=>{\nconst workerPatch=${workerPatch.toString()}\nworkerPatch();\n})();\n` + code;
    const blob = new Blob([newCode], { type: 'text/javascript' });
    const newUrl = URL.createObjectURL(blob);
    return newUrl;
  } catch {
    return blobUrl;
  }
}

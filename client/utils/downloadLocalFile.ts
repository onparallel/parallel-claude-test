export async function downloadLocalFile(file: File) {
  const response = await fetch(URL.createObjectURL(file));
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  window.URL.revokeObjectURL(url);
}

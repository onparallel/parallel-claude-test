export async function downloadLocalFile(file: File, preview: boolean = false) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  if (preview) {
    link.target = "_blank";
  } else {
    link.download = file.name;
  }
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export const scrollBarSize = (function () {
  let size: number | null = null;
  return function () {
    if (typeof window === "undefined") {
      return 0;
    }
    if (size !== null) {
      return size;
    }
    const div1 = window.document.createElement("div");
    const div2 = window.document.createElement("div");
    div1.style.width = "100px";
    div1.style.overflowX = "scroll";
    div2.style.width = "100px";
    window.document.body.appendChild(div1);
    window.document.body.appendChild(div2);
    size = div1.offsetHeight - div2.offsetHeight;
    window.document.body.removeChild(div1);
    window.document.body.removeChild(div2);
    return size;
  };
})();

import "@primer/view-components/app/components/primer/beta/clipboard_copy";
import "@primer/view-components/app/components/primer/alpha/tool_tip";
import mermaid from "mermaid";

(() => {
  createClipboardCopyTooltip();
  createMermaid();
  updateMermaid();
})();

function createClipboardCopyTooltip() {
  document.addEventListener("clipboard-copy", function (event) {
    const button = event.target as HTMLButtonElement;
    button.classList.add(
      "ClipboardButton--success",
      "tooltipped",
      "tooltipped-w"
    );
    setTimeout(() => {
      button.classList.remove(
        "ClipboardButton--success",
        "tooltipped",
        "tooltipped-w"
      );
    }, 2e3);
  });
}

function createMermaid() {
  mermaid.initialize({ startOnLoad: false }); // 必要时配置 Mermaid 初始化选项
  const mermaidContainers = document.querySelectorAll(".mermaid");
  mermaidContainers.forEach(async (container, index) => {
    const content = container.getAttribute("data-mermaid-content");
    const { svg } = await mermaid.render("mermaidSvg" + index, content || "");
    container.innerHTML = svg;
  });
}

function updateMermaid() {
  window.addEventListener("vscode.markdown.updateContent", createMermaid);
}

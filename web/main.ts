import "@primer/view-components/app/components/primer/beta/clipboard_copy";
import "@primer/view-components/app/components/primer/alpha/tool_tip";

document.addEventListener("clipboard-copy", function (event) {
	const button = event.target as HTMLButtonElement;
	button.classList.add(
		"ClipboardButton--success",
		"tooltipped",
		"tooltipped-w",
	);
	setTimeout(() => {
		button.classList.remove(
			"ClipboardButton--success",
			"tooltipped",
			"tooltipped-w",
		);
	}, 2e3);
});

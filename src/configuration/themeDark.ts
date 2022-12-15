import { getConfiguration } from "../configuration";

export type ThemeDark = typeof themeDark[number];

export const themeDark = [
	"dark",
	"dark_colorblind",
	"dark_dimmed",
	"dark_high_contrast",
	"dark_tritanopia",
] as const;

export const themeDarkAlias: Record<ThemeDark, string> = {
	dark: "Dark default",
	dark_colorblind: "Dark Protanopia & Deuteranopia",
	dark_dimmed: "Dark dimmed",
	dark_high_contrast: "Dark high contrast",
	dark_tritanopia: "Dark Tritanopia",
};

export const themeDarkSection = "theme.dark";

export function getThemeDark() {
	const configuration = getConfiguration();
	return configuration.get<ThemeDark>(themeDarkSection);
}

export async function setThemeDark(theme: ThemeDark) {
	const configuration = getConfiguration();
	await configuration.update(themeDarkSection, theme, true);
}

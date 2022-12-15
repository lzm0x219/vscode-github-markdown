import { getConfiguration } from "../configuration";

export type ThemeLight = typeof themeLight[number];

export const themeLight = [
	"light",
	"light_colorblind",
	"light_high_contrast",
	"light_tritanopia",
] as const;

export const themeLightAlias: Record<ThemeLight, string> = {
	light: "Light default",
	light_colorblind: "Light Protanopia & Deuteranopia",
	light_high_contrast: "Light high contrast",
	light_tritanopia: "Light Tritanopia",
};

export const themeLightSection = "theme.light";

export function getThemeLight() {
	const configuration = getConfiguration();
	return configuration.get<ThemeLight>(themeLightSection);
}

export async function setThemeLight(theme: ThemeLight) {
	const configuration = getConfiguration();
	await configuration.update(themeLightSection, theme, true);
}

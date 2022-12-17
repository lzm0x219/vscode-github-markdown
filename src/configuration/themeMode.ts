import { getConfiguration } from "../configuration";

export type ThemeMode = typeof themeMode[number];

export const themeMode = ["light", "dark", "auto"] as const;

export const themeModeAlias: Record<ThemeMode, string> = {
	light: "Light",
	dark: "Dark",
	auto: "Sync to the system",
};

export const themeModeSection = "theme.mode";

export function getThemeMode() {
	const configuration = getConfiguration();
	return configuration.get<ThemeMode>(themeModeSection);
}

export async function setThemeMode(mode: ThemeMode) {
	const configuration = getConfiguration();
	await configuration.update(themeModeSection, mode, true);
}

declare module "generate-github-markdown-css" {
  export type GithubMarkdownCssTheme =
    | "light"
    | "light_high_contrast"
    | "light_colorblind"
    | "light_tritanopia"
    | "dark"
    | "dark_dimmed"
    | "dark_high_contrast"
    | "dark_colorblind"
    | "dark_tritanopia";

  /**
   * Options for generating GitHub Markdown CSS.
   */
  export interface GithubMarkdownCssOptions {
    /**
     * Theme used for the light color scheme.
     *
     * Examples:
     * - `light`
     * - `light_high_contrast`
     * - `light_colorblind`
     */
    light?: GithubMarkdownCssTheme;

    /**
     * Theme used for the dark color scheme.
     *
     * Examples:
     * - `dark`
     * - `dark_dimmed`
     * - `dark_high_contrast`
     */
    dark?: GithubMarkdownCssTheme;

    /**
     * Return the list of available themes instead of generating CSS.
     *
     * @default false
     */
    list?: boolean;

    /**
     * Preserve CSS custom properties in the output.
     *
     * When `false` and only a single theme is generated,
     * variables are resolved and inlined into the CSS.
     *
     * When `true`, the generated CSS keeps all
     * `var(--variable)` references and variable definitions.
     *
     * @default false
     */
    preserveVariables?: boolean;

    /**
     * Output only theme variables.
     *
     * Forces `preserveVariables` to `true`.
     *
     * Useful when sharing one stylesheet across multiple themes.
     *
     * @default false
     */
    onlyVariables?: boolean;

    /**
     * Output only Markdown styles without theme variables.
     *
     * Forces `preserveVariables` to `true`.
     *
     * Useful when theme variables are managed separately.
     *
     * @default false
     */
    onlyStyles?: boolean;

    /**
     * Include additional GitHub Flavored Markdown fixture styles.
     *
     * This includes styles for features such as:
     * - task lists
     * - footnotes
     * - details/summary
     * - kbd
     * - emoji
     *
     * @default true
     */
    useFixture?: boolean;

    /**
     * Root selector used for the rendered Markdown container.
     *
     * @default '.markdown-body'
     */
    rootSelector?: string;

    /**
     * Use a transparent background instead of the theme background.
     *
     * Useful for embedding Markdown into applications that already
     * provide their own background color.
     *
     * @default false
     */
    transparentBackground?: boolean;
  }

  /**
   * Options used when requesting the theme list.
   */
  export interface GithubMarkdownCssListOptions extends GithubMarkdownCssOptions {
    list: true;
  }

  /**
   * Return all available GitHub themes.
   */
  export default function githubMarkdownCss(
    options: GithubMarkdownCssListOptions
  ): Promise<string[]>;

  /**
   * Generate GitHub Markdown CSS.
   */
  export default function githubMarkdownCss(options?: GithubMarkdownCssOptions): Promise<string>;
}

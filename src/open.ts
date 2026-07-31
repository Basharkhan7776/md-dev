/** Open a URL in the default browser (best-effort, cross-platform). */
export async function openBrowser(url: string): Promise<void> {
  const platform = process.platform;
  try {
    if (platform === "darwin") {
      await Bun.$`open ${url}`.quiet();
    } else if (platform === "win32") {
      await Bun.$`cmd /c start "" ${url}`.quiet();
    } else {
      // Linux / BSD
      const openers = ["xdg-open", "gio", "gnome-open", "kde-open"];
      for (const cmd of openers) {
        try {
          await Bun.$`${cmd} ${url}`.quiet();
          return;
        } catch {
          // try next
        }
      }
    }
  } catch (err) {
    console.warn(`Could not open browser automatically. Visit: ${url}`);
  }
}

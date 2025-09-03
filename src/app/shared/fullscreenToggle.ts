export function toggleFullScreen(): void {
    const rootElement: HTMLElement = document.documentElement;
    if (!document.fullscreenElement) {
        rootElement.requestFullscreen().catch((err) => {
            console.error(`Error attempting to enable full-screen mode for root element: ${err.message}`);
        });
    } else {
        document.exitFullscreen().catch((err) => {
            console.error(`Error attempting to exit full-screen mode: ${err.message}`);
        });
    }
}
export function initVideoDemos() {
  document.querySelectorAll('[data-video-demo]').forEach((details) => {
    const video = details.querySelector('video');
    details.addEventListener('toggle', () => {
      if (!details.open) video.pause();
    });
  });
}

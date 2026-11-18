export function showToast(message, type = "success") {
  window.dispatchEvent(
    new CustomEvent("music-toast", {
      detail: {
        message,
        type,
      },
    }),
  );
}

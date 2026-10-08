/** Small, optional enhancements. The invitation itself needs no JavaScript. */
const shareButton = document.querySelector<HTMLButtonElement>('#share-invitation');
const fallback = document.querySelector<HTMLAnchorElement>('#share-fallback');
const dialog = document.querySelector<HTMLDialogElement>('#share-dialog');
const whatsapp = document.querySelector<HTMLAnchorElement>('#whatsapp-share');
const copyButton = document.querySelector<HTMLButtonElement>('#copy-link');
const nativeButton = document.querySelector<HTMLButtonElement>('#share-native');
const closeButton = document.querySelector<HTMLButtonElement>('#close-share');
const status = document.querySelector<HTMLElement>('#share-status');

if (
  shareButton && dialog && whatsapp && copyButton && nativeButton && closeButton && status &&
  typeof dialog.showModal === 'function'
) {
  const invitationUrl = new URL(window.location.href);
  invitationUrl.hash = '';
  const url = invitationUrl.toString();
  const title = 'The Nikah Ceremony — Fahad Masood & Rahnuma Zarrin';
  const message = 'By the grace of Allah, you are warmly invited to the Nikah of Fahad Masood & Rahnuma Zarrin.\n\n' +
    '12 November 2026 | 6:00 PM IST\n\n' +
    'Your presence and duas would mean the world to us.';

  whatsapp.href = `https://wa.me/?text=${encodeURIComponent(`${message}\n\nView the invitation: ${url}`)}`;
  whatsapp.target = '_blank';
  whatsapp.rel = 'noopener noreferrer';
  nativeButton.hidden = typeof navigator.share !== 'function';
  shareButton.hidden = false;
  if (fallback) fallback.hidden = true;

  shareButton.addEventListener('click', () => {
    status.textContent = '';
    if (!dialog.open) dialog.showModal();
    whatsapp.focus();
  });

  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => shareButton.focus());
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom
    ) dialog.close();
  });

  const copyWithSelection = (): boolean => {
    const focused = document.activeElement;
    const selection = document.getSelection();
    const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index).cloneRange()) : [];
    const field = document.createElement('textarea');
    field.value = url;
    field.setAttribute('readonly', '');
    field.setAttribute('aria-label', 'Invitation link');
    field.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;padding:0;border:0;opacity:0;';
    // Keep the temporary field inside the modal; content outside it is inert.
    dialog.append(field);
    field.focus({ preventScroll: true });
    field.select();
    field.setSelectionRange(0, field.value.length);
    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    } finally {
      field.remove();
      if (selection) {
        selection.removeAllRanges();
        ranges.forEach((range) => selection.addRange(range));
      }
      if (focused instanceof HTMLElement) focused.focus({ preventScroll: true });
    }
    return copied;
  };

  copyButton.addEventListener('click', async () => {
    copyButton.disabled = true;
    copyButton.setAttribute('aria-busy', 'true');
    status.textContent = '';
    try {
      let copied = false;
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(url);
          copied = true;
        } catch {
          // Some embedded browsers deny Clipboard API access but support selection.
        }
      }
      if (!copied) copied = copyWithSelection();
      status.textContent = copied
        ? 'Invitation link copied.'
        : 'Copy is unavailable here. You can share through WhatsApp or copy the address from your browser.';
    } catch {
      status.textContent = 'Copy is unavailable here. You can share through WhatsApp or copy the address from your browser.';
    } finally {
      copyButton.disabled = false;
      copyButton.removeAttribute('aria-busy');
      // Disabling a focused button moves focus to the body in some browsers.
      // Keep context without interrupting a guest who chose another control.
      if (dialog.open && (document.activeElement === document.body || document.activeElement === dialog)) {
        copyButton.focus({ preventScroll: true });
      }
    }
  });

  nativeButton.addEventListener('click', async () => {
    status.textContent = '';
    try {
      await navigator.share({ title, text: message, url });
      status.textContent = 'Invitation shared.';
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      status.textContent = 'Sharing is unavailable here. You can use WhatsApp or copy the invitation link.';
    }
  });
}

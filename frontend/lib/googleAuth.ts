type GoogleButtonText = "signin_with" | "signup_with" | "continue_with";

interface RenderGoogleButtonParams {
  buttonElementId: string;
  clientId?: string;
  callback: (response: any) => void;
  text?: GoogleButtonText;
}

declare global {
  interface Window {
    google: any;
    __googleAuthInitialized?: boolean;
    __googleAuthCallback?: (response: any) => void;
    __googleButtonResizeObservers?: Record<string, ResizeObserver>;
  }
}

function getElementWidth(element: HTMLElement): number {
  const width = Math.floor(element.getBoundingClientRect().width);

  if (width > 0) return width;

  return 340;
}

export function renderGoogleButton({
  buttonElementId,
  clientId,
  callback,
  text = "continue_with",
}: RenderGoogleButtonParams): boolean {
  if (typeof window === "undefined") return false;

  const buttonElement = document.getElementById(buttonElementId);

  if (!clientId || !buttonElement || !window.google?.accounts?.id) {
    return false;
  }

  window.__googleAuthCallback = callback;

  if (!window.__googleAuthInitialized) {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: any) => {
        window.__googleAuthCallback?.(response);
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_button: true,
      button_auto_select: false,
    });

    window.__googleAuthInitialized = true;
  }

  let lastWidth = 0;
  let resizeTimer: ReturnType<typeof setTimeout>;

  const render = () => {
    const buttonWidth = getElementWidth(buttonElement);

    if (buttonWidth === lastWidth) return;

    lastWidth = buttonWidth;
    buttonElement.innerHTML = "";

    window.google.accounts.id.renderButton(buttonElement, {
      theme: "outline",
      size: "large",
      type: "standard",
      shape: "pill",
      text,
      width: buttonWidth,
      logo_alignment: "left",
    });
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(render);
  });

  if (!window.__googleButtonResizeObservers) {
    window.__googleButtonResizeObservers = {};
  }

  window.__googleButtonResizeObservers[buttonElementId]?.disconnect();

  const observer = new ResizeObserver(() => {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {
      render();
    }, 150);
  });

  observer.observe(buttonElement);

  window.__googleButtonResizeObservers[buttonElementId] = observer;

  return true;
}

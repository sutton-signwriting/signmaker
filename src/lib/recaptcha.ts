import { apiDomain } from './api';

declare const grecaptcha: {
  enterprise: {
    ready: (cb: () => void) => void;
    execute: (siteKey: string, options: { action: string }) => Promise<string>;
  };
};

/* Each API gateway's own reCAPTCHA Enterprise key (sign-infra api-gateway.ts, per stack) —
   Cloud Armor only accepts tokens minted with the key of the gateway being called. */
const SITE_KEYS: Record<string, string> = {
  'nagish.dev': '6LcGHIssAAAAABt5Kiu1hc7bgZt3Pw_l69w17hip',
  'nagish.io': '6Le9ZY4sAAAAAKj8wgshA2oGW-f1fzJr9NO9X5yQ',
};
const SITE_KEY = SITE_KEYS[apiDomain];

let loadPromise: Promise<void> | null = null;
function load(): Promise<void> {
  loadPromise ??= new Promise<void>((resolve) => {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${SITE_KEY}`;
    script.async = true;
    script.onload = () => grecaptcha.enterprise.ready(resolve);
    document.head.appendChild(script);
  });
  return loadPromise;
}

export async function recaptchaToken(action: string): Promise<string> {
  await load();
  return grecaptcha.enterprise.execute(SITE_KEY, { action });
}

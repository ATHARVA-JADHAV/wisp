/* Wisp widget loader — https://github.com/atharvajadhav/wisp
 * Usage: <script src="https://<app>/widget.js" data-project="prj_xxx" async></script>
 * ~5KB, framework-free, never blocks the host page, fails silently.
 */
(function () {
  "use strict";
  if (window.__wisp) return;
  window.__wisp = true;

  var script = document.currentScript;
  if (!script) return;
  var projectKey = script.getAttribute("data-project");
  if (!projectKey) return;
  var base;
  try {
    base = new URL(script.src).origin;
  } catch (e) {
    return;
  }

  var accent = "#8b5cf6";
  var accent2 = "#22d3ee";
  var open = false;
  var iframe = null;

  var css = [
    "#wisp-root{position:fixed;bottom:20px;right:20px;z-index:2147483000;font-family:inherit}",
    "#wisp-btn{width:60px;height:60px;border-radius:50%;border:none;cursor:pointer;position:relative;",
    "background:linear-gradient(135deg," + accent + "," + accent2 + ");",
    "box-shadow:0 4px 24px rgba(139,92,246,.45),0 2px 8px rgba(0,0,0,.25);",
    "display:flex;align-items:center;justify-content:center;padding:0;",
    "transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s ease}",
    "#wisp-btn:hover{transform:scale(1.08) translateY(-2px);box-shadow:0 8px 32px rgba(139,92,246,.6),0 4px 12px rgba(0,0,0,.3)}",
    "#wisp-btn:active{transform:scale(.95)}",
    "#wisp-btn svg{width:26px;height:26px;transition:transform .3s cubic-bezier(.34,1.56,.64,1),opacity .2s ease;position:absolute}",
    "#wisp-btn .wisp-ico-x{opacity:0;transform:rotate(-90deg) scale(.5)}",
    "#wisp-root.wisp-open .wisp-ico-chat{opacity:0;transform:rotate(90deg) scale(.5)}",
    "#wisp-root.wisp-open .wisp-ico-x{opacity:1;transform:rotate(0) scale(1)}",
    "#wisp-btn::after{content:'';position:absolute;inset:0;border-radius:50%;",
    "border:2px solid " + accent + ";opacity:0;animation:wisp-pulse 2.6s ease-out infinite}",
    "#wisp-root.wisp-open #wisp-btn::after{animation:none}",
    "@keyframes wisp-pulse{0%{transform:scale(1);opacity:.55}70%{transform:scale(1.55);opacity:0}100%{opacity:0}}",
    "#wisp-panel{position:absolute;bottom:76px;right:0;width:384px;height:min(620px,calc(100vh - 120px));",
    "border-radius:20px;overflow:hidden;background:#fff;",
    "box-shadow:0 24px 64px rgba(21,21,26,.18),0 0 0 1px rgba(21,21,26,.08);",
    "opacity:0;transform:translateY(14px) scale(.96);transform-origin:bottom right;",
    "pointer-events:none;transition:opacity .28s ease,transform .32s cubic-bezier(.34,1.4,.64,1)}",
    "#wisp-root.wisp-open #wisp-panel{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}",
    "#wisp-panel iframe{width:100%;height:100%;border:0;display:block;background:#fff}",
    "@media(max-width:480px){#wisp-root{bottom:14px;right:14px}",
    "#wisp-panel{width:calc(100vw - 28px);height:min(560px,calc(100vh - 100px))}}",
  ].join("");

  var chatIcon =
    '<svg class="wisp-ico-chat" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.7 4.3a2 2 0 0 0 1.1 1.1L19 10l-4.2 1.6a2 2 0 0 0-1.1 1.1L12 17l-1.7-4.3a2 2 0 0 0-1.1-1.1L5 10l4.2-1.6a2 2 0 0 0 1.1-1.1L12 3z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z"/></svg>';
  var closeIcon =
    '<svg class="wisp-ico-x" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  function mount() {
    var style = document.createElement("style");
    style.id = "wisp-style";
    style.textContent = css;
    document.head.appendChild(style);

    var root = document.createElement("div");
    root.id = "wisp-root";
    root.innerHTML =
      '<div id="wisp-panel"></div>' +
      '<button id="wisp-btn" type="button" aria-label="Open support chat">' +
      chatIcon + closeIcon +
      "</button>";
    document.body.appendChild(root);

    var btn = root.querySelector("#wisp-btn");
    var panel = root.querySelector("#wisp-panel");

    function toggle() {
      open = !open;
      root.classList.toggle("wisp-open", open);
      btn.setAttribute("aria-label", open ? "Close support chat" : "Open support chat");
      if (open && !iframe) {
        iframe = document.createElement("iframe");
        iframe.src = base + "/embed/" + encodeURIComponent(projectKey);
        iframe.title = "Support chat";
        iframe.allow = "clipboard-write";
        panel.appendChild(iframe);
      }
      if (open && iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: "wisp:open" }, base);
      }
    }

    btn.addEventListener("click", toggle);
    window.addEventListener("message", function (e) {
      if (e.origin !== base || !e.data) return;
      if (e.data.type === "wisp:close" && open) toggle();
    });

    // brand tint from project settings — non-blocking, defaults stay if it fails
    try {
      fetch(base + "/api/widget-config?key=" + encodeURIComponent(projectKey))
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (cfg) {
          if (cfg && cfg.accent_color && /^#[0-9a-f]{6}$/i.test(cfg.accent_color)) {
            btn.style.background =
              "linear-gradient(135deg," + cfg.accent_color + "," + accent2 + ")";
          }
        })
        .catch(function () {});
    } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();

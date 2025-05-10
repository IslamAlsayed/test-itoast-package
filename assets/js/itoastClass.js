export const Itoast = {
  configItoast: {
    move: "enable",
    enter_time: "0.5s",
    exit_time: "0.5s",
    visible_time: "7s",
    start_delay_time: "1s",
    itoast_pin: false,
    confirm_pin: true,
    itoast_shake: false,
    confirm_shake: true,
    default_dir: "ltr",
    default_position: "top",
    default_theme: "warn",
    default_message: "Default message",
    default_title: "Default title",
    default_confirm_title: "Confirmation",
    default_confirm_message: "Are you sure?",
    default_onconfirm_text: "Yes",
    default_oncancel_text: "No",
  },

  totalAnimationTime: 0,
  root: document.documentElement,

  parseTime(time) {
    if (!time) return 0;
    // Matches time like "2", "3s", "2.5m", or "1h"
    const match = time.match(/^(\d+(\.\d+)?)([smh])?$/i);

    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[3]?.toLowerCase() ?? "s";

      switch (unit) {
        case "h":
          return value * 60 * 60 * 1000;
        case "m":
          return value * 60 * 1000;
        default:
          return value * 1000;
      }
    }
    return 0;
  },

  resetTimes() {
    this.root.style.setProperty(
      "--itoast-move",
      this.configItoast.move || "enable"
    );
    this.root.style.setProperty(
      "--itoast-enter-time",
      this.configItoast.enter_time || "0.3s"
    );
    this.root.style.setProperty(
      "--itoast-visible-time",
      this.parseTime(this.configItoast.visible_time || "7s")
    );
    this.root.style.setProperty(
      "--itoast-exit-time",
      this.configItoast.exit_time || "0.3s"
    );
    this.root.style.setProperty(
      "--itoast-start-delay-time",
      this.configItoast.start_delay_time || "1s"
    );
  },

  setTimes(itoast) {
    const baseVisibleTime = this.parseTime(
      this.configItoast.visible_time || "7s"
    );
    const enterTime = this.parseTime(this.configItoast.enter_time || "0.3s");
    const exitTime = this.parseTime(this.configItoast.exit_time || "0.3s");
    const startDelayTime = this.parseTime(
      this.configItoast.start_delay_time || "1s"
    );

    const rawDuration = itoast.dataset.duration ?? null;
    const customDuration = this.parseTime(rawDuration);

    const visibleTime = baseVisibleTime + customDuration;

    this.totalAnimationTime =
      startDelayTime + enterTime + exitTime + visibleTime;

    itoast.style.setProperty("--itoast-visible-time", `${visibleTime}ms`);
  },

  shouldAutoRemove(itoast) {
    if (this.configItoast.move != "enable") return false;
    if (itoast.classList.contains("pin")) return false;
    if (itoast.classList.contains("no_move")) return false;
    if (itoast.classList.contains("forever")) return false;
    if (itoast.classList.contains("confirm-forever")) return false;
    return true;
  },

  shaking() {
    let itoastInners = document.querySelectorAll(".itoasts .itoast-inner");

    itoastInners.forEach((inner) => {
      if (inner.querySelector(".itoast.shaking")) {
        if (!document.querySelector(".layer")) {
          let layer = document.createElement("div");
          layer.className = "layer";
          document.body.appendChild(layer);

          layer.addEventListener("click", () => {
            let _inner = inner.querySelector(".itoast");
            if (!_inner) return;

            if (inner.dataset.shaking == "true") return;

            inner.dataset.shaking = "true";

            let class_shake = _inner.classList.contains("right")
              ? "itoast-right-shake"
              : "itoast-top-shake";

            inner.classList.remove(class_shake);
            void inner.offsetWidth;
            inner.classList.add(class_shake);

            setTimeout(() => {
              inner.classList.remove(class_shake);
              inner.dataset.shaking = "false";
            }, 700);
          });
        }
      }
    });
  },

  toastTimeouts: new Map(),
  toastStartTimes: new Map(),
  toastPausedTimes: new Map(),
  toastPauseStart: new Map(),

  removeItoast(_itoastInner) {
    if (!_itoastInner || !_itoastInner.parentNode) return;
    _itoastInner.remove();

    this.toastTimeouts.delete(_itoastInner);
    this.toastStartTimes.delete(_itoastInner);
    this.toastPausedTimes.delete(_itoastInner);
    this.toastPauseStart.delete(_itoastInner);

    setTimeout(() => {
      const parent = document.querySelector(".itoasts");
      if (parent && parent.children.length == 0) {
        parent.remove();
      }
    }, 125);

    const hasConfirm = document.querySelector(".itoasts .confirm-forever");
    if (!hasConfirm) {
      document.querySelector(".layer")?.remove();
    }
  },

  userActive(itoastInner, itoast, totalTime, fast = 0) {
    let itoastActions = [
      ...itoast.querySelectorAll(".itoast-action"),
      ...itoast.querySelectorAll(".itoast-closed .fa-xmark"),
    ];

    if (itoastActions.length) {
      itoastActions.forEach((actions) => {
        actions?.addEventListener("click", () => {
          setTimeout(() => this.removeItoast(itoastInner), 125);
        });
      });
    }

    if (this.shouldAutoRemove(itoast)) {
      const startTime = Date.now();
      this.toastStartTimes.set(itoastInner, startTime);
      this.toastPausedTimes.set(itoastInner, 0);

      const id = setTimeout(() => {
        this.removeItoast(itoastInner);
      }, totalTime - fast);

      this.toastTimeouts.set(itoastInner, id);
    }

    itoast.addEventListener("mouseenter", () => {
      const id = this.toastTimeouts.get(itoastInner);
      if (id) {
        clearTimeout(id);
        this.toastTimeouts.delete(itoastInner);
        this.toastPauseStart.set(itoastInner, Date.now());
      }
    });

    itoast.addEventListener("mouseleave", () => {
      if (
        this.shouldAutoRemove(itoast) &&
        !this.toastTimeouts.has(itoastInner)
      ) {
        const pauseStart = this.toastPauseStart.get(itoastInner);
        const pausedTime = this.toastPausedTimes.get(itoastInner) || 0;
        const now = Date.now();
        const newPausedTime = pausedTime + (now - pauseStart);
        this.toastPausedTimes.set(itoastInner, newPausedTime);

        const startTime = this.toastStartTimes.get(itoastInner);
        const elapsed = now - startTime - newPausedTime;
        const remaining = totalTime - fast - elapsed;

        if (remaining > 0) {
          const id = setTimeout(() => {
            this.removeItoast(itoastInner);
          }, remaining);
          this.toastTimeouts.set(itoastInner, id);
        } else {
          this.removeItoast(itoastInner);
        }
      }
    });
  },

  isEmoji(char) {
    const emojiRegex =
      /[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}|\u{1F900}-\u{1F9FF}|\u{1FA70}-\u{1FAFF}]/u;
    return emojiRegex.test(char);
  },

  // internal helpers
  _getOrCreateContainer() {
    let container = document.querySelector(".itoasts");
    if (!container) {
      container = document.createElement("div");
      container.className = "itoasts";
      document.body.prepend(container);
    }
    return container;
  },

  _createIcon(type, emoji, icon) {
    let iconElement;

    if (emoji) {
      iconElement = document.createElement("div");
      iconElement.classList.add("itoast-icon", "emoji");
      iconElement.style.fontSize = "20px";
      iconElement.textContent = emoji;
    } else {
      iconElement = document.createElement("i");
      iconElement.classList.add("itoast-icon", "fas");

      if (icon) {
        icon.split(" ").forEach((_class) => {
          iconElement.classList.add(_class);
        });
      } else {
        switch (type) {
          case "success":
            iconElement.classList.add("fa-circle-check");
            break;
          case "error":
            iconElement.classList.add("fa-circle-xmark");
            break;
          case "warn":
            iconElement.classList.add("fa-triangle-exclamation");
            break;
          case "info":
            iconElement.classList.add("fa-circle-exclamation");
            break;
        }
      }
    }

    return iconElement;
  },

  _createText(title, message, actions, confirm) {
    const itoastText = document.createElement("div");
    itoastText.className = "itoast-text";

    const text = document.createElement("div");
    text.className = "text";

    if (title) {
      const titleElement = document.createElement("strong");
      titleElement.textContent = title;
      text.appendChild(titleElement);
    }

    const messageElement = document.createElement("p");
    messageElement.textContent = message;
    text.appendChild(messageElement);

    itoastText.appendChild(text);
    if (actions) itoastText.appendChild(actions);
    if (confirm) itoastText.appendChild(confirm);

    return itoastText;
  },

  _createCloseButton(itoastElement) {
    const close = document.createElement("div");
    close.className = "itoast-closed";

    const icon = document.createElement("i");
    icon.className = "fas fa-xmark";
    close.appendChild(icon);

    icon.addEventListener("click", () => {
      const itoastInner = itoastElement.parentElement;
      this.removeItoast(itoastInner);
    });

    return close;
  },

  _createConfirmButtons(_confirm, itoast) {
    const confirmActions = document.createElement("div");
    confirmActions.className = "itoast-actions";

    const a = document.createElement("a");
    a.classList.add("itoast-action", "onconfirm");
    a.href = _confirm.onconfirmLink;
    a.classList.add(this.isEmoji(_confirm.onconfirmText) ? "emoji" : "text");
    a.textContent = _confirm.onconfirmText;

    const p = document.createElement("p");
    p.classList.add("itoast-action", "oncancel");
    p.classList.add(this.isEmoji(_confirm.oncancelText) ? "emoji" : "text");
    p.textContent = _confirm.oncancelText;

    confirmActions.appendChild(a);
    confirmActions.appendChild(p);

    if (
      _confirm.onConfirmCallback &&
      typeof _confirm.onConfirmCallback == "function"
    ) {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        onConfirmCallback();
        this.removeItoast(itoast);
      });
    }

    return confirmActions;
  },

  _createActionsButtons(actions) {
    const _actions = document.createElement("div");
    _actions.className = "itoast-actions";

    if (actions) {
      actions.forEach((action) => {
        const a = document.createElement("a");
        a.classList.add("itoast-action");
        a.href = action.url;
        if (action.target) a.target = action.target;
        a.classList.add(this.isEmoji(action.label) ? "emoji" : "text");
        a.textContent = action.label;
        _actions.appendChild(a);
      });
    }

    return _actions;
  },

  // public methods to show a toast
  show(options) {
    if (!options.type || !options.message) return;

    const itoasts = this._getOrCreateContainer();

    this.root.style.setProperty("--itoast-start-delay-time", `0s`);

    const itoastInner = document.createElement("div");
    itoastInner.className = "itoast-inner";

    const itoast = document.createElement("div");
    itoast.classList.add("itoast", `itoast-${options.type}`, "top");

    if (
      (options.confirm && this.configItoast.confirm_shake) ||
      this.configItoast.itoast_shake
    ) {
      itoast.classList.add("shaking", "confirm-forever");
    }

    if (
      (options.confirm && this.configItoast.confirm_pin) ||
      this.configItoast.itoast_pin ||
      this.configItoast.move != "enable" ||
      options.pin ||
      itoast.classList.contains("confirm-forever")
    ) {
      const pin = document.createElement("i");
      pin.className = "itoast-icon pin fas fa-thumbtack";

      itoast.classList.add("no_move", "pin");
      itoast.appendChild(pin);
    }

    if (options.duration) {
      itoast.setAttribute("data-duration", options.duration);
    }

    itoast.appendChild(
      this._createIcon(options.type, options.emoji, options.icon)
    );

    let __confirm = null;
    let __actions = null;

    if (options.confirm) {
      __confirm = this._createConfirmButtons(options.confirm, itoast);
    }

    if (options.actions) {
      __actions = this._createActionsButtons(options.actions);
    }

    itoast.appendChild(
      this._createText(options.title, options.message, __actions, __confirm)
    );
    itoast.appendChild(this._createCloseButton(itoast)); // اهوو

    itoastInner.appendChild(itoast);
    itoasts.appendChild(itoastInner);

    this.shaking();

    // Set timeout for auto-dismiss
    this.setTimes(itoast);
    this.userActive(itoastInner, itoast, this.totalAnimationTime, 1000);
  },
};

export const Confirm = {
  show(options) {
    Itoast.show({
      type: options.type,
      title: options.title,
      message: options.message,
      pin: true,
      confirm: options.confirm,
    });
  },
};

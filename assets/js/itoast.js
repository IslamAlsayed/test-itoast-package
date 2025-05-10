import { Confirm, Itoast } from "./itoastClass.js";

document.addEventListener("DOMContentLoaded", function () {
  Itoast.resetTimes();
});

document.querySelectorAll(".itoast-inner").forEach((inner) => {
  const itoast = inner.querySelector(".itoast");
  Itoast.shaking();
  Itoast.setTimes(itoast);
  Itoast.userActive(inner, itoast, Itoast.totalAnimationTime, 0);
});

document.addEventListener("click", function (e) {
  const toastBtn = e.target.closest(".push-itoast-btn");
  const confirmBtn = e.target.closest(".push-confirm-btn");

  if (toastBtn) {
    const type =
      toastBtn.dataset.type ||
      toastBtn.dataset.theme ||
      Itoast.configItoast.default_theme;
    const title = toastBtn.dataset.title || type;
    const message =
      toastBtn.dataset.message || Itoast.configItoast.default_message || null;
    const duration = toastBtn.dataset.duration || null;
    const pin = toastBtn.dataset.pin || null;
    const emoji = toastBtn.dataset.emoji || null;
    const icon = toastBtn.dataset.icon || null;
    const actions = toastBtn.dataset.actions || null;

    Itoast.show({
      type: type,
      title: title,
      message: message,
      duration: duration,
      emoji: emoji,
      icon: icon,
      pin: pin,
      actions: JSON.parse(actions) || null,
    });
  }

  if (confirmBtn) {
    e.preventDefault();

    const isForm = confirmBtn.tagName === "FORM";

    const type =
      confirmBtn.dataset.type ||
      confirmBtn.dataset.theme ||
      Itoast.configItoast.default_theme;
    const title =
      confirmBtn.dataset.title ||
      Itoast.configItoast.default_confirm_title ||
      type;
    const message =
      confirmBtn.dataset.message ||
      Itoast.configItoast.default_confirm_message ||
      null;
    const emoji = confirmBtn.dataset.emoji || null;
    const icon = confirmBtn.dataset.icon || null;
    const onconfirmText =
      confirmBtn.dataset.onconfirmtext ||
      Itoast.configItoast.default_onconfirm_text ||
      "Yes";
    const onconfirmLink = confirmBtn.dataset.onconfirmlink || "#";
    const oncancelText =
      confirmBtn.dataset.oncanceltext ||
      Itoast.configItoast.default_oncancel_text ||
      "No";
    const actions = confirmBtn.dataset.actions || null;

    const proceed = () => {
      if (isForm) {
        confirmBtn.submit();
      } else {
        // Trigger native click if it's just a button (e.g., inside a form)
        confirmBtn.dispatchEvent(
          new Event("confirmed-click", { bubbles: true })
        );
      }
    };

    Confirm.show({
      type: type,
      title: title,
      message: message,
      duration: duration,
      emoji: emoji,
      icon: icon,
      confirm: {
        onconfirmText: onconfirmText,
        onconfirmLink: onconfirmLink,
        oncancelText: oncancelText,
        onConfirmCallback: proceed,
      },
      actions: JSON.parse(actions) || null,
    });
  }
});

(function () {
  var root = document.querySelector("[data-journey]");
  if (!root) return;
  var buttons = Array.prototype.slice.call(root.querySelectorAll("[data-journey-button]"));

  function setOpen(button, open) {
    var panel = document.getElementById(button.getAttribute("aria-controls"));
    button.setAttribute("aria-expanded", String(open));
    panel.setAttribute("data-open", String(open));
    if (open) panel.removeAttribute("inert");
    else panel.setAttribute("inert", "");
  }

  buttons.forEach(function (button, index) {
    setOpen(button, index === 0);
    button.addEventListener("click", function () {
      var willOpen = button.getAttribute("aria-expanded") !== "true";
      buttons.forEach(function (other) { setOpen(other, other === button && willOpen); });
    });
  });
})();

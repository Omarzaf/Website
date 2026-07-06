(function () {
  var theme = "light";

  try {
    var stored = window.localStorage.getItem("uz-theme");

    if (stored === "dark" || stored === "light") {
      theme = stored;
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      theme = "dark";
    }
  } catch (error) {
    // localStorage can be unavailable in private or restricted browser contexts.
  }

  document.documentElement.dataset.theme = theme;
})();

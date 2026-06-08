window.App = window.App || {};

const rootEl = document.getElementById("root");
const root = ReactDOM.createRoot(rootEl);

if (!window.location.hash) window.location.hash = "#/home";

root.render(<App.AppRoot />);

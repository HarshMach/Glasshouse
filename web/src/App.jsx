import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import About from "./pages/about.jsx";
import HomePage from "./pages/Homepage.jsx";
import GotATip from "./pages/tip.jsx";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<About />} />
        <Route path="/got-a-tip" element={<GotATip />} />
      </Routes>
    </Router>
  );
}
export default App;

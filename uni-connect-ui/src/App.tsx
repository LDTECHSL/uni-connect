import { Route, Routes } from "react-router-dom"
import Login from "./pages/Login"
import Toast from "./components/Toast"
import Navbar from "./layouts/Navbar"
import Dashboard from "./pages/Dashboard"

function App() {

  return (
    <>
      <Toast />
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/app" element={<Navbar />}>
          <Route index element={<Dashboard />} />
        </Route>
      </Routes>
    </>
  )
}

export default App

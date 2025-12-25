import { Route, Routes } from "react-router-dom"
import Login from "./pages/Login"
import Toast from "./components/Toast"

function App() {

  return (
    <>
      <Toast />
      <Routes>
        <Route path="/" element={<Login />} />
      </Routes>
    </>
  )
}

export default App

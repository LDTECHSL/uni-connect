import { Route, Routes } from "react-router-dom"
import Login from "./pages/Login"
import Toast from "./components/Toast"
import Navbar from "./layouts/Navbar"
import Dashboard from "./pages/Dashboard"
import Users from "./pages/Users"
import ManageCourse from "./pages/courses/ManageCourse"
import AddCourse from "./pages/courses/AddCourse"
import CourseCategory from "./pages/courses/CourseCategory"
import Coupons from "./pages/courses/Coupons"
import CourseBundle from "./pages/courses/CourseBundle"
import SubscriptionReports from "./pages/courses/SubscriptionReports"

function App() {

  return (
    <>
      <Toast />
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/app" element={<Navbar />}>
          <Route index element={<Dashboard />} />
          <Route path="courses/manage" element={<ManageCourse />} />
          <Route path="courses/new" element={<AddCourse />} />
          <Route path="courses/category" element={<CourseCategory />} />
          <Route path="courses/coupons" element={<Coupons />} />
          <Route path="courses/bundle" element={<CourseBundle />} />
          <Route path="courses/subscriptions" element={<SubscriptionReports />} />

          <Route path="users" element={<Users />} />
        </Route>
      </Routes>
    </>
  )
}

export default App

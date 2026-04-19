import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ProtectedRoute from "./components/protectedRoute";
import PublicRoute from "./components/publicRoute";

import { useAppData } from "./context/AppContext";


const App = () => {
   const { user, loading } = useAppData();

  if(loading) {
    return <h1 className="text-2xl font-bold text-red-500 text-center mt-56">Loading...</h1>
  }

 

  return (
    <>
      <BrowserRouter>
       {/* // <Navbar /> */}
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default App;
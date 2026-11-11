import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

const AuthRoute = () => {
  const user = useSelector((state) => state.user.user);

  return user ? <Navigate to="/home" replace /> : <Outlet />;
};

export default AuthRoute;

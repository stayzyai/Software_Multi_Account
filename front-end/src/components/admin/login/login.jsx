import {LoginComponent} from "@/components/common/auth/LoginComponent";
const Login = () => {
  return (
    <LoginComponent
      role="admin"
      redirectPath="/admin/dashboard"
    />
  );
};

export default Login;

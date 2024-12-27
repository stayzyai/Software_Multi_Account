import { LoginComponent } from "@/components/common/auth/LoginComponent";

const Login = () => {
  return (
    <LoginComponent
      role="user"
      redirectPath="/user/dashboard"
    />
  );
};

export default Login;
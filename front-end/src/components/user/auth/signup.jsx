import { SignupComponent } from "@/components/common/auth/SignupComponent";

const SignUp = () => {
  return (
    <SignupComponent
      role="user"
      redirectPath="/user/dashboard"
      logoText="Lodgr"
    />
  );
};

export default SignUp;

import { ForgotPasswordComponent } from "@/components/common/auth/ForgotPasswordComponent" 

const forgotPassword = () =>{
    return(
        <ForgotPasswordComponent 
        role="user"
        redirectPath="/user/login"
        />   
    )
}

export default forgotPassword;
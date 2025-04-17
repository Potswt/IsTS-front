import logo from "../assets/jib-logo-2.png";
import LoginForm from "../components/LoginForm";

const Login = () => {
  return (
    <div className="flex justify-center items-center min-h-screen w-screen p-5 bg-radial-[at_50%_50%]  from-blue-400 via-[#193CB8] to-[#262362] to-90%">
      <div
        className="w-full max-w-[500px] md:h-[700px] bg-white rounded-[26px] 
      shadow-[4px_4px_15.5px_-2px_rgba(0,0,0,0.25)] 
      flex flex-col justify-start items-center 
      pt-20 md:pt-0 pb-10 md:pb-10">
        <div className="w-[100px] absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 md:translate-y-15 ">
          <img src={logo} alt="logo" />
        </div>
        <div className="flex flex-auto justify-center items-center mt-15 w-full px-5">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default Login;

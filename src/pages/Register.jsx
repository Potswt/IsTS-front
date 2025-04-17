import RegisterForm from "../components/RegisterForm";

const Register = () => {
  return (
    <div className="flex justify-center items-center min-h-screen w-screen p-5 bg-radial-[at_50%_50%] from-blue-400 via-[#193CB8] to-[#262362] to-90%">
      <div
        className="w-full max-w-[500px] h-auto md:h-[700px] relative 
      bg-white rounded-[26px] shadow-[4px_4px_15.5px_-2px_rgba(0,0,0,0.25)] 
      flex flex-col justify-center
      items-center ">
        <div className="flex flex-auto justify-center items-center mt-5 w-full px-4 md:px-0">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
};

export default Register;

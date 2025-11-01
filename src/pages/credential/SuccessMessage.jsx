import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SuccessMessage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/"); 
    }, 1000); // 1 second delay

    return () => clearTimeout(timer); 
  }, [navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-white px-4">
      <div className="bg-[radial-gradient(circle,#2563eb,#164CA1,#164CA1)] text-white rounded-xl shadow-lg w-full max-w-md sm:max-w-lg md:max-w-xl p-6 text-center">
        
        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <img
            src="/images/login/success.svg"
            alt="Success"
            className="h-24 w-24"
          />
        </div>

        {/* Text */}
        <h2 className="text-sm sm:text-base md:text-lg font-semibold mb-1">
          You’ve successfully logged into your account.
        </h2>
        <p className="text-sm sm:text-base">
          Your dashboard is ready to go.
        </p>
      </div>
    </div>
  );
};

export default SuccessMessage;
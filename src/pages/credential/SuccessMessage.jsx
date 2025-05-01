import React from "react";
import Lottie from "lottie-react";
import successAnimation from "/images/login/success.json"; // adjust the path based on your folder structure

const SuccessMessage = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-white px-4">
      <div className="bg-[radial-gradient(circle,#2563eb,#164CA1,_#164CA1)] text-white rounded-[24px] shadow-lg w-full max-w-[320px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px] xl:max-w-[700px] p-6 text-center">
        
        {/* Success Animation */}
        <div className="flex justify-center mb-6">
          <Lottie
            animationData={successAnimation}
            loop={false}
            style={{ height: 100, width: 100 }}
          />
        </div>

        {/* Success Text */}
        <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-2">
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

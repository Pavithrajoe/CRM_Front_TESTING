import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VerifyCode = () => {
  const navigate = useNavigate();  
  const inputsRef = useRef([]);
  const [error, setError] = useState("");

  const handleChange = (e, index) => {
    const value = e.target.value;

    if (!/^[0-9]$/.test(value)) {
      e.target.value = '';
      return;
    }

    if (value && index < inputsRef.current.length - 1) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handleVerify = () => {
    const enteredOtp = inputsRef.current.map(input => input.value).join('');
    const storedOtp = localStorage.getItem("reset_otp");

    if (enteredOtp === storedOtp) {
      navigate("/updatepassword");
    } else {
      setError("Invalid OTP. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="flex flex-col md:flex-row bg-white rounded-3xl overflow-hidden w-full max-w-5xl space-y-10 md:space-y-0 md:space-x-20">
        <div className="bg-[radial-gradient(circle,#2563eb,#164CA1)] w-full md:w-[500px] h-[540px] flex items-center justify-center rounded-3xl">
          <img src="/images/login/verify_code.png" alt="Verification Illustration" className="max-w-[80%] h-auto" />
        </div>

        <div className="w-full md:w-[500px] p-6 sm:p-10 flex flex-col justify-center items-center text-center">
          <h2 className="text-xl font-semibold mb-4 mb-10">Verify the code</h2>
          <div className="flex justify-center gap-2 mb-6">
            {Array(4).fill(0).map((_, i) => (
              <input
                key={i}
                type="text"
                maxLength={1}
                onChange={(e) => handleChange(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                ref={(el) => (inputsRef.current[i] = el)}
                className="w-12 h-12 text-center border border-gray-300 rounded-md text-lg"
              />
            ))}
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <button
            onClick={handleVerify}
            className="bg-black text-white font-semibold px-6 py-2 rounded-md hover:bg-gray-800 transition"
          >
            Verify OTP
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyCode;
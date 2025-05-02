import React, { useRef } from 'react';

const VerifyCode = () => {
  const inputsRef = useRef([]);

  const handleChange = (e, index) => {
    const value = e.target.value;

    // Only allow numbers
    if (!/^[0-9]$/.test(value)) {
      e.target.value = '';
      return;
    }

    // Move to next input if exists
    if (value && index < inputsRef.current.length - 1) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="flex flex-col md:flex-row bg-white rounded-3xl overflow-hidden w-full max-w-5xl space-y-10 md:space-y-0 md:space-x-20">
        
        {/* Left Blue Box */}
        <div className="bg-[radial-gradient(circle,#2563eb,#164CA1)] w-full md:w-[500px] h-[540px] flex items-center justify-center rounded-3xl">
          <img
            src="/images/login/verify_code.png"
            alt="Verification Illustration"
            className="max-w-[80%] h-auto"
          />
        </div>

        {/* Right Form Section */}
        <div className="w-full md:w-[500px] p-6 sm:p-10 flex flex-col justify-center items-center text-center">
          <h2 className="text-xl font-semibold mb-4">Verify the code</h2>
          <div className="flex justify-center gap-2 mb-4">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  ref={(el) => (inputsRef.current[i] = el)}
                  onChange={(e) => handleChange(e, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  className="w-10 h-10 border border-gray-300 rounded text-center text-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              ))}
          </div>
          <p className="text-sm mb-4">
            Haven't received the code? Click{" "}
            <span className="font-semibold text-black cursor-pointer">
              Resend
            </span>
          </p>
          <button className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800">
            Verify code
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyCode;

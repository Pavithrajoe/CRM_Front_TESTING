import React from 'react';
import logo from './logo.png';
const Loader = () => {
  return (
    <>
      <div className="loader-container">
        <img src={logo} alt="Loading..." className="loader-logo" />
      </div>

      <style jsx="true">{`
        .loader-container {
          height: 100vh;
          width: 100vw;
          background-color: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .loader-logo {
          width: 100px;
          height: auto;
          margin-bottom: 20px;
          animation: pulse 1s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.7;
          }
        }
      `}</style>
    </>
  );
};

export default Loader;

import React from "react";
import RemainderForm from "../Components/RemainderForm";
import { useParams } from "react-router-dom";

const RemainderPage = () => {
    const { leadId } = useParams();
  
  return (
    <>  
     <div >
      </div>
      <div > 
      </div>
      <div className="flex ">
        <div >
        </div>

        <div className="w-full overflow-x-hidden shadow rounded bg-[#f8f8f8]">
      <RemainderForm  leadId={leadId}  />
    </div>
    </div>

    </>
  );
};

export default RemainderPage;
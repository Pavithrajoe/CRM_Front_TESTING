import React from "react";
import RemainderForm from "@/components/RemainderForm";
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

        <div className="w-full overflow-x-hidden shadow rounded bg-white">
      <RemainderForm  leadId={leadId}  />
    </div>
    </div>

    </>
  );
};

export default RemainderPage;
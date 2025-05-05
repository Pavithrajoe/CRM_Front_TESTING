import React from "react";
import CompanyList from "@/Components/Company/CompanyList";

import ProfileHeader from "../Components/common/ProfileHeader";

const CompanyPage = () => {
  return (
    <>
      <ProfileHeader />

   

      
        <div className="w-full md:w-[80%] lg:w-[80%] xl:w-[100%] mx-auto mt-[40px]">
          <CompanyList />
        </div>

        
   
    </>
  );
};

export default CompanyPage;

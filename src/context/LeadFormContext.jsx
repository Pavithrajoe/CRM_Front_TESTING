import {Children, createContext,useContext,useState} from 'react';

const LeadFormContext = createContext();

export const LeadFormProvider = ({children})=>{
    const [showLeadForm,setShowLeadForm] = useState(false);
    const [leadFormType,setLeadFormType] = useState(null); // 1 for Individual, 2 for Company

   const handleLeadFormOpen = (type = 1) => {
    setLeadFormType(type);
    setShowLeadForm(true);
  };

    const handleLeadFormClose = ()=>{
        setShowLeadForm(false);
        setLeadFormType(null);
    }

   return(
       <LeadFormContext.Provider value={{ 
      showLeadForm, setShowLeadForm, leadFormType, setLeadFormType,
      handleLeadFormOpen, handleLeadFormClose 
    }}>
      {children}
    </LeadFormContext.Provider>
   )
}

export const useLeadForm = () => useContext(LeadFormContext);

import React, { useState, useEffect } from 'react';
import { FaCheckSquare, FaRegSquare, FaUserAlt, FaClock, FaPlus, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Drawer, TextField, Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { ENDPOINTS  } from "../api/constraints";



// import ReminderForm from './src/Components/RemainderForm';
// Dummy API functions (keep this the same)
const dummyApi = {
  getReminders: (date) => new Promise((resolve) => {
    setTimeout(() => resolve({
      data: [
        {
          id: 1,  
          title: "Project Title",
          client: "Shivakumar",
          description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
          completed: false,
          time: "12:30 PM",
          date: date
        },
        {
          id: 2,
          title: "Project Title",
          client: "Shivakumar",
          description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
          completed: false,
          time: "12:30 PM",
          date: date
        }
      ]
    }), 500);
  }),

  createMeet: (meetData) => new Promise((resolve) => {
    
    setTimeout(() => resolve({
      data: {
        ...meetData,
        id: Math.floor(Math.random() * 1000),
        client: "New Client",
        completed: false,
        description: `Meeting scheduled at ${meetData.time}`
      }
    }), 800);
  }),

  toggleReminder: () => new Promise((resolve) => {
    setTimeout(() => resolve({ success: true }), 300);
  })
};

// MeetFormDrawer Component (keep this the same)
const MeetFormDrawer = ({ open, onClose, selectedDate, onCreated, setOpenDrawer }) => {
  const getNowISOString = new Date().toISOString().split('.')[0] + 'Z';


  const [formData, setFormData] = useState({
    ctitle: '',
    devent_startdt: '',
    cdescription: '',
    icreated_by: null,
    iupdated_by: null ,

    //Send default values for the below fields
    devent_end : getNowISOString,
    dupdated_at: getNowISOString
  });
  const [loading, setLoading] = useState(false);
 

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    const startTime = new Date(formData.devent_startdt).toISOString().split('.')[0] + 'Z';
    const user_data = localStorage.getItem("user");
    const user_data_parsed = JSON.parse(user_data);
    console.log("User Data:", user_data_parsed.iUser_id); // Log the user data
    formData.devent_startdt = startTime;
    formData.icreated_by = user_data_parsed.iUser_id;
    formData.iupdated_by = user_data_parsed.iUser_id;

    console.log('Form submitted after date:', formData);

    

    setLoading(true);
    const  token = localStorage.getItem("token");
    try {
      const response = await fetch(`${ENDPOINTS.CREATE_EVENT}`, {
          
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Failed to post leads: ${response.status} , The error is ${JSON.stringify(response)}`);  
      }

      const data = await response.json();
      console.log('Fetched data:', data);

      setFormData({
        ctitle: '',
        cdescription: '',
        devent_startdt: '',
        devent_end: '',
        dupdated_at: '',
        icreated_by: null,
        iupdated_by: null,
      });
      setLoading(false);
      setOpenDrawer(false); // Close the drawer when fetching reminders

     
    } catch (error) {
      console.error('Error creating meet:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <div className={`fixed top-0 right-0 w-full max-w-xl h-full  bg-white shadow-xl z-50 transition-transform duration-500 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-6 h-full mb-5 overflow-y-auto ">

        <h2 className="font-semibold text-lg mt-5 mb-4">Reminder</h2>
        <form onSubmit={handleSubmit}>

        <label className="block text-sm mb-2">Title *</label>
          <input
            className="w-full border p-2 mb-4 rounded bg-[#EEEEEE]"
            placeholder="Enter your reminder title"
            value={formData.ctitle}
            onChange={(e) => setFormData({ ...formData, ctitle: e.target.value })}
            maxLength={100}
          />

        <label className="block text-sm mb-2">Description </label>

        <textarea
          className="w-full border p-2 mb-4 rounded h-24 bg-[#EEEEEE]"
          placeholder="Write your description here……"
          value={formData.cdescription}
          onChange={(e) => setFormData({ ...formData, cdescription: e.target.value })}
          maxLength={300}
        />



        
<label className="block text-sm mb-2">Date *</label>
          <input
            className="w-full border p-2 mb-4 rounded bg-[#EEEEEE]"
            placeholder="Enter your reminder date"
            type='datetime-local'
            value={formData.devent_startdt}
            onChange={(e) => setFormData({ ...formData, devent_startdt: e.target.value })}            maxLength={100}
          />


        <div className="flex justify-center items-center gap-4">
          <button
            className="bg-black text-white px-6 py-2 rounded disabled:opacity-50" 

          >
            Submit
          </button>
        </div>
        </form>


        <button
          className="absolute top-4 right-4 text-black text-lg"
        > 
        </button> 
      </div>
      </div>

    </Drawer>



  );
};

const CalendarView = () => {
  const [msg,setMsg]=useState('');
const [reminderList,setReminderList]=useState([])
  // State declarations for all variables being used
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [reminders, setReminders] = useState([]);
    const [allReminder, setAllReminder] = useState([]);

const [calendarEvents, setCalendarEvents] = useState([]);


  const [loading, setLoading] = useState(true);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [draftToEdit, setDraftToEdit] = useState(null); // For editing drafts

  // Define all functions being used
  const fetchReminders = async (date = selectedDate) => {
    const user_data = localStorage.getItem("user");
    const user_data_parsed = JSON.parse(user_data);
    console.log("User Data:", user_data_parsed.iUser_id); // Log the user data

    let dates = new Date(date);

              // Step 2: Create a new UTC date with desired time: 12:00:00
          let utcDate = new Date(Date.UTC(
            dates.getUTCFullYear(),
            dates.getUTCMonth(),
            dates.getUTCDate() + 1, // add 1 day to get 2025-05-08
            12, 0, 0 // 12:00:00 UTC
          ));

          // Step 3: Convert to ISO string
          let formattedDate = utcDate.toISOString(); // gives "2025-05-08T12:00:00.000Z"

          // Optional: If you want to remove milliseconds:
          formattedDate = formattedDate.replace('.000', '');

          // formattedDate =`2025-05-07T12:00:00Z`;





          console.log("Formatted date is:", formattedDate); // Log the user data




    setLoading(true);
    try {
          const  token = localStorage.getItem("token");

  console.log("Fetching reminders for date:", ENDPOINTS.REMINDERS); // Log the date being fetched
  const response = await fetch(`${ENDPOINTS.FOLLOW_UP}?id=${user_data_parsed.iUser_id}&eventDate=${formattedDate}`, {
    method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }
});


const data = await response.json(); // Parse the response body
console.log("Parsed Response Data:", data); // Now you can see the actual JSON
        setReminders(data.reminders || []);

                // setAllReminder(allReminderData || []);

        setCalendarEvents(data.calender_event || []);
      console.log("The reminder response is :", reminders); // Log the user data

    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to load reminders',
        severity: 'error'
      });
    }
     finally {
      setLoading(false);
    }
  };

  const toggleReminder = async (id) => {
    try {
      await dummyApi.toggleReminder(id);
      setReminders(reminders.map(reminder => 
        reminder.id === id ? {...reminder, completed: !reminder.completed} : reminder
      ));
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update reminder',
        severity: 'error'
      });
    }
  };

  //Reminder list for user 

  const UserReminder=async()=>{
    const  token = localStorage.getItem("token");
    try {
      const response =await fetch(`${ENDPOINTS.USER_REMINDER}`,{
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
        
      }

    )

    if(!response.ok){
      setMsg("Error in fetching user reminder")
    }

    const data=await response.json();
    console.log("reminder data",data)
    const reminderLists=data.data;
    setReminderList(reminderLists)
    } catch (e) {
      setMsg("can't fetch reminders")
    }
  }

  useEffect(() => {
    fetchReminders();
    UserReminder();

  }, [selectedDate]);
  console.log("Reminder list",reminderList)
  return (
    <div>
    <div className="flex h-80vh overflow-y-scroll w-full p-8 bg-gray-50 rounded-lg ">
      
      {/* Left Column - Calendar and Draft Form */}
      <div className="w-1/2 flex flex-col mb-1 mr-6">
        {/* Calendar */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            className="border-none w-full"
            navigationLabel={({ date }) => (
              <div className="flex items-center justify-center">
                <FaChevronLeft className="mr-4 cursor-pointer" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(new Date(date.setMonth(date.getMonth() - 1)));
                  }} 
                />
                <span className="text-lg font-semibold">
                  {date.toLocaleString('default', { month: 'long' })} {date.getFullYear()}
                </span>
                <FaChevronRight className="ml-4 cursor-pointer" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(new Date(date.setMonth(date.getMonth() + 1)));
                  }} 
                />
              </div>
            )}
            prevLabel={<FaChevronLeft />}
            nextLabel={<FaChevronRight />}
            tileClassName={({ date }) => 
              date.getDate() === selectedDate.getDate() ? 'bg-black text-white rounded' : ''
            }
          />

<div className="flex gap-4 mt-6 ms-[80px] mb-1">

  <button 
    onClick={() => setOpenDrawer(true)}
    className="w-[180px] bg-black hover:bg-gray-800 text-white py-2 px-4 rounded-md flex items-center justify-center"
  >
    <FaPlus className="mr-2" />
    Create Reminder
  </button>

  <button 
  onClick={() => window.open("https://meet.google.com/landing", "_blank")}
  className="w-[200px] bg-black hover:bg-gray-800 text-white py-2 px-4 rounded-md flex items-center justify-center"
>
  <div className="flex items-center gap-2">
    <b>G</b>
    <span>Create Meet</span>
  </div>
</button>
</div>

        </div>

      </div>


      


      <div className="max-h-[395px] overflow-y-auto bg-white rounded-lg shadow-xl p-4 space-y-6 pr-2 w-1/2">
      

      
  {/* Reminders Header */}
  <h2 className="text-lg font-bold text-gray-700 mb-2">Reminders</h2>
    {/* Legend (Reminder & Calendar Event) */}
  <div className="flex gap-6 mb-2">
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span>
      <span className="text-sm text-gray-700">Reminder</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
      <span className="text-sm text-gray-700">Calendar Event</span>
    </div>
  </div>


  {/* Reminders List */}
  {reminders.length > 0 ? (
    reminders.map(reminder => (
      <div key={reminder.iremainder_id} className="border-b border-gray-100 pb-4 last:border-0">
        <div className="flex items-start">
          <button 
            onClick={() => toggleReminder(reminder.iremainder_id)}
            className="mt-1 mr-3 text-gray-400 hover:text-black"
          >
            {reminder.bactive ? (
              <FaCheckSquare className="text-black text-lg" />
            ) : (
              <FaRegSquare className="text-lg" />
            )}
          </button>
          <div className="flex-1">
            <h3 className="font-medium text-gray-800">{reminder.cremainder_title}</h3>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <FaUserAlt className="mr-2 text-xs" />
              Assigned To: {reminder.iassigned_to}
            </div>
            <p className="text-sm text-gray-600 mt-2">{reminder.cremainder_content}</p>
            <div
              className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                reminder.priority === 'High'
                  ? 'bg-red-100 text-red-800'
                  : reminder.priority === 'Medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              Priority: {reminder.priority}
            </div>
          </div>
          <div className="text-sm text-black bg-yellow-500 px-3 py-1 rounded-full flex items-center">
            <FaClock className="mr-1" />
            {new Date(reminder.dremainder_dt).toLocaleString()}
          </div>
        </div>
      </div>
    ))
  ) : (
    <p className="text-gray-500">No reminders found for this date.</p>
  )}

  {/* Calendar Events Header */}
  
  <h2 className="text-lg font-bold text-gray-700 mb-2">Calendar Events</h2>

  {/* Calendar Events List */}
  {calendarEvents.length > 0 ? (
    calendarEvents.map(event => (
      <div key={event.icalender_event} className="border-b border-gray-200 pb-4 last:border-0">
        <div className="flex items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">{event.ctitle}</h3>
            <p className="text-sm text-gray-600 mt-1">{event.cdescription}</p>
          </div>
          <div className="text-sm text-white bg-blue-600 px-3 py-1 rounded-full flex items-center">
            <FaClock className="mr-1" />
            {new Date(event.devent_startdt).toLocaleString()}
          </div>
        </div>
      </div>
    ))
  ) : (
    <p className="text-gray-500">No calendar events for this date.</p>
  )}
  </div>



      {/* Meet Form Drawer */}
      <MeetFormDrawer
      setOpenDrawer={setOpenDrawer}
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        selectedDate={selectedDate}
      />
   
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({...snackbar, open: false})}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

    </div>
          
{/* All reminders of users */}
<div className="w-full rounded-2xl p-2 shadow-lg border border-gray-300 mt-10">
  <h2 className="font-extrabold text-2xl mb-6 mt-4 text-black drop-shadow-md">
    All Reminders:
  </h2>
  
  {reminderList && reminderList.length > 0 ? (
  <table className=" table-fixed w-full text-sm rounded-lg overflow-hidden shadow-md">
    <thead className="bg-gray-300 text-white uppercase text-left tracking-wider">
      <tr>
        <th className="px-5 py-3  w-12  text-black border-b ">S.no</th>
        <th className="px-5 py-3 border-b text-black  ">Reminder</th>
        <th className="px-5 py-3 border-b text-black  ">Created by</th>
        <th className="px-5 py-3 border-b text-black  max-w-xs">Assigned to</th>
        <th className="px-5 py-3 border-b text-black  ">Lead</th>
        <th className="px-5 py-3 border-b text-black  max-w-xs">Date</th>
      </tr>
    </thead>
    <tbody>
      {reminderList.map((reminder, index) => (
        <tr
          key={index}
          className="bg-white hover:bg-purple-50 transition-colors duration-300 cursor-pointer"
        >
          <td className="border-b  px-5 py-3 font-medium text-center">
            {index + 1}
          </td>
          <td className="border-b  px-5 py-3">{reminder.cremainder_content}</td>
          <td className="border-b  px-5 py-3">{reminder.created_by}</td>
          <td className="border-b  px-5 py-3 break-words whitespace-normal max-w-xs">
            {reminder.assigned_to}
          </td>
          <td className="border-b  px-5 py-3">{reminder.lead_name}</td>
          <td className="border-b  px-5 py-3 break-words whitespace-normal max-w-xs">
            {new Intl.DateTimeFormat('en-GB', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(reminder.dremainder_dt))}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
) : (
  <p className="text-center text-purple-600 font-semibold py-4">
    No reminders found.
  </p>
)}

</div>

    </div>
    
  );
};

export default CalendarView;

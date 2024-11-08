// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import sidebarReducer from "../redux/sidebarSlice";
import authReducer from "../redux/authSlice";
import userReduer from "../redux/userSlice";
import scheduleReducer from "../redux/scheduleSlice";
import listScheduleSlice from "../redux/listScheduleSlice";
import doctorListSlice from "@/redux/doctorList";
import archiveListReducer from "@/redux/archiveList";
import mrSlice from "@/redux/mrSlice";

const store = configureStore({
  reducer: {
    sidebar: sidebarReducer,
    auth: authReducer,
    user: userReduer,
    schedule: scheduleReducer,
    listSchedule: listScheduleSlice,
    doctorList: doctorListSlice,
    archiveList: archiveListReducer,
    mr: mrSlice
  },
});

export default store;

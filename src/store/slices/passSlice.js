import { createSlice } from "@reduxjs/toolkit";

const PassSlice = createSlice({
    name: "hassPass",
    initialState: {
        hassPass: null,
    
    },
    reducers: {
        setPass: (state, action) => {
            state.hassPass = action.payload;
        },
       
    }
})
export const { setPass, } = PassSlice.actions;
export default PassSlice.reducer;
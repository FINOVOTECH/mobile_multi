import { createSlice } from "@reduxjs/toolkit";

const LoginSlice = createSlice({
    name: "login",
    initialState: {
        loginData: null,
        regi: null,
        regiId: null,
        enabled: false,
        pin: "",
    },
    reducers: {
        setLoginData: (state, action) => {
            state.loginData = action.payload;
        },
        setRegi: (state, action) => {
            state.regi = action.payload;
        },
         setRegiId: (state, action) => {
            state.regiId = action.payload;
        },
        setBiometricEnabled: (state, action) => {
            state.enabled = action.payload;
        },
        setBiometricPin: (state, action) => {
            state.pin = action.payload;
        },
        clearBiometricPin: (state) => {
            state.pin = "";
        },
    }
})
export const { setLoginData, setRegi, setRegiId,setBiometricEnabled, setBiometricPin, clearBiometricPin } = LoginSlice.actions;
export default LoginSlice.reducer;
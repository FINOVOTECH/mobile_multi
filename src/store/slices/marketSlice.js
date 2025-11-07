import { createSlice } from "@reduxjs/toolkit";

const MarketWatch = createSlice({
    name: "marketWatch",
    initialState: {
        marketData: null,
        fundType: null,
        investment: null,
        investType: '',
        portfolio: null,
        mfCentral: null,
        sipInterface: null,
        mandateAlert: false
    },
    reducers: {
        setMarketData: (state, action) => {
            state.marketData = action.payload;
        },
        setFundTyoe: (state, action) => {
            state.fundType = action.payload;
        },
        setInvestment: (state, action) => {
            state.investment = action.payload;
        },
        setInvestType: (state, action) => {
            state.investType = action.payload;
        },
        setPortfolio: (state, action) => {
            state.portfolio = action.payload
        },
        setMfCentral: (state, action) => {
            state.mfCentral = action.payload
        },
        setSipInterface: (state, action) => {
            state.sipInterface = action.payload
        },
        setMandateAlert: (state, action) => {
            state.mandateAlert = action.payload
        }
    }
})
export const { setMarketData, setFundTyoe, setInvestment, setPortfolio, setMfCentral, setInvestType, setSipInterface, setMandateAlert } = MarketWatch.actions;
export default MarketWatch.reducer;